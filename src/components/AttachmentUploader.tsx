import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Paperclip, X, FileText, Image as ImageIcon, Video, Music, Archive, File, Upload, AlertCircle } from 'lucide-react';

interface AttachmentFile {
  file: File;
  preview?: string;
  progress: number;
  error?: string;
}

interface AttachmentUploaderProps {
  onUploadComplete: (attachments: Array<{ id: string; filename: string; file_path: string; file_size: number; mime_type: string }>) => void;
  userId: string;
  bucket?: 'message-attachments' | 'email-attachments';
  maxFileSize?: number;
  maxFiles?: number;
}

const FILE_ICONS: Record<string, any> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  pdf: FileText,
  zip: Archive,
  default: File,
};

const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown',
  'application/json', 'application/xml', 'text/xml',
  'text/x-python', 'text/javascript', 'text/html', 'text/css',
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac',
];

export function AttachmentUploader({
  onUploadComplete,
  userId,
  bucket = 'message-attachments',
  maxFileSize = 500 * 1024 * 1024,
  maxFiles = 10,
}: AttachmentUploaderProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FILE_ICONS.image;
    if (mimeType.startsWith('video/')) return FILE_ICONS.video;
    if (mimeType.startsWith('audio/')) return FILE_ICONS.audio;
    if (mimeType === 'application/pdf') return FILE_ICONS.pdf;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return FILE_ICONS.zip;
    return FILE_ICONS.default;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const loadStorageInfo = async () => {
    try {
      const { data, error } = await supabase.rpc('get_storage_usage', { p_user_id: userId });
      if (!error && data && data.length > 0) {
        setStorageInfo({
          used: data[0].used_bytes,
          available: data[0].available_bytes,
        });
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Vous ne pouvez pas télécharger plus de ${maxFiles} fichiers à la fois`);
      return;
    }

    await loadStorageInfo();

    const newFiles: AttachmentFile[] = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(py|js|ts|jsx|tsx|html|css|json|xml|sql|sh|md|txt|csv)$/i)) {
        alert(`Type de fichier non autorisé: ${file.name}`);
        continue;
      }

      if (file.size > maxFileSize) {
        alert(`Le fichier ${file.name} dépasse la taille maximale de ${formatFileSize(maxFileSize)}`);
        continue;
      }

      if (storageInfo && file.size > storageInfo.available) {
        alert(`Espace de stockage insuffisant pour ${file.name}`);
        continue;
      }

      const attachmentFile: AttachmentFile = {
        file,
        progress: 0,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachmentFile.preview = e.target?.result as string;
          setFiles((prev) => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(attachmentFile);
    }

    setFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const uploadedAttachments: Array<{ id: string; filename: string; file_path: string; file_size: number; mime_type: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const attachmentFile = files[i];
      const file = attachmentFile.file;

      try {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${userId}/${timestamp}_${randomStr}_${sanitizedFileName}`;

        setFiles((prev) => {
          const updated = [...prev];
          updated[i].progress = 0;
          return updated;
        });

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        setFiles((prev) => {
          const updated = [...prev];
          updated[i].progress = 100;
          return updated;
        });

        uploadedAttachments.push({
          id: `${timestamp}_${randomStr}`,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
        });
      } catch (error: any) {
        console.error('Upload error:', error);
        setFiles((prev) => {
          const updated = [...prev];
          updated[i].error = error.message || 'Erreur d\'upload';
          return updated;
        });
      }
    }

    if (uploadedAttachments.length > 0) {
      onUploadComplete(uploadedAttachments);
      setFiles([]);
    }

    setIsUploading(false);
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= maxFiles || isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm"
        >
          <Paperclip className="w-4 h-4" />
          Joindre des fichiers
        </button>
        {files.length > 0 && (
          <span className="text-sm text-zinc-400">
            {files.length} fichier{files.length > 1 ? 's' : ''} ({formatFileSize(totalSize)})
          </span>
        )}
      </div>

      {storageInfo && (
        <div className="text-xs text-zinc-500">
          Espace disponible: {formatFileSize(storageInfo.available)}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((attachmentFile, index) => {
            const Icon = getFileIcon(attachmentFile.file.type);
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700"
              >
                {attachmentFile.preview ? (
                  <img
                    src={attachmentFile.preview}
                    alt={attachmentFile.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-zinc-700 rounded">
                    <Icon className="w-6 h-6 text-zinc-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachmentFile.file.name}</p>
                  <p className="text-xs text-zinc-400">{formatFileSize(attachmentFile.file.size)}</p>
                  {attachmentFile.progress > 0 && attachmentFile.progress < 100 && (
                    <div className="mt-1 w-full bg-zinc-700 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all"
                        style={{ width: `${attachmentFile.progress}%` }}
                      />
                    </div>
                  )}
                  {attachmentFile.error && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      {attachmentFile.error}
                    </div>
                  )}
                </div>

                {!isUploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={uploadFiles}
            disabled={isUploading || files.length === 0}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Envoi en cours...' : `Envoyer ${files.length} fichier${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
