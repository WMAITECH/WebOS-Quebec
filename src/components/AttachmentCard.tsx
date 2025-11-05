import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, FileText, Image as ImageIcon, Video, Music, Archive, File, X, Maximize2 } from 'lucide-react';

interface Attachment {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at?: string;
}

interface AttachmentCardProps {
  attachment: Attachment;
  bucket?: 'message-attachments' | 'email-attachments';
  showPreview?: boolean;
}

const FILE_ICONS: Record<string, any> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  pdf: FileText,
  zip: Archive,
  default: File,
};

export function AttachmentCard({ attachment, bucket = 'message-attachments', showPreview = true }: AttachmentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

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

  const loadImagePreview = async () => {
    if (!attachment.mime_type.startsWith('image/') || imagePreview) return;

    try {
      const { data } = await supabase.storage.from(bucket).download(attachment.file_path);
      if (data) {
        const url = URL.createObjectURL(data);
        setImagePreview(url);
      }
    } catch (error) {
      console.error('Error loading image preview:', error);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { data, error } = await supabase.storage.from(bucket).download(attachment.file_path);

      if (error) throw error;

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Erreur lors du téléchargement du fichier');
    } finally {
      setIsDownloading(false);
    }
  };

  const Icon = getFileIcon(attachment.mime_type);
  const isImage = attachment.mime_type.startsWith('image/');

  if (isImage && showPreview) {
    if (!imagePreview) {
      loadImagePreview();
    }

    return (
      <>
        <div className="relative group">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt={attachment.filename}
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowFullImage(true)}
              />
              <button
                onClick={() => setShowFullImage(true)}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-48 h-32 bg-zinc-800 rounded-lg animate-pulse flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-zinc-600" />
            </div>
          )}
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
            <span className="truncate max-w-[180px]">{attachment.filename}</span>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-1 hover:bg-zinc-700 rounded transition-colors"
              title="Télécharger"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>

        {showFullImage && imagePreview && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={imagePreview}
              alt={attachment.filename}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg">
              <p className="text-white text-sm">{attachment.filename}</p>
              <p className="text-zinc-400 text-xs">{formatFileSize(attachment.file_size)}</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700 max-w-xs">
      <div className="w-10 h-10 flex items-center justify-center bg-zinc-700 rounded">
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-zinc-400">{formatFileSize(attachment.file_size)}</p>
      </div>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="p-2 hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
        title="Télécharger"
      >
        <Download className="w-4 h-4 text-zinc-400" />
      </button>
    </div>
  );
}

interface AttachmentGridProps {
  attachments: Attachment[];
  bucket?: 'message-attachments' | 'email-attachments';
}

export function AttachmentGrid({ attachments, bucket = 'message-attachments' }: AttachmentGridProps) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mime_type.startsWith('image/'));
  const others = attachments.filter((a) => !a.mime_type.startsWith('image/'));

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((attachment) => (
            <AttachmentCard key={attachment.id} attachment={attachment} bucket={bucket} showPreview />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="flex flex-col gap-2">
          {others.map((attachment) => (
            <AttachmentCard key={attachment.id} attachment={attachment} bucket={bucket} showPreview={false} />
          ))}
        </div>
      )}
    </div>
  );
}
