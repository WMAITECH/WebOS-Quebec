// Advanced File Manager for WebOS Quebec
// This module extends the basic file system with professional features

window.AdvancedFileManager = {
  getFileIcon(ext) {
    const icons = {
      'txt': '📄', 'md': '📝', 'json': '{ }', 'xml': '< >', 'html': '🌐',
      'csv': '📊', 'pdf': '📕', 'doc': '📘', 'docx': '📘',
      'xls': '📗', 'xlsx': '📗', 'ppt': '📙', 'pptx': '📙',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
      'zip': '📦', 'rar': '📦'
    };
    return icons[ext] || '📄';
  },

  getFileColor(ext) {
    const colors = {
      'txt': '#6b7280', 'md': '#3b82f6', 'json': '#f59e0b', 'xml': '#8b5cf6',
      'html': '#10b981', 'csv': '#10b981', 'pdf': '#ef4444',
      'doc': '#3b82f6', 'docx': '#3b82f6', 'xls': '#10b981', 'xlsx': '#10b981',
      'jpg': '#ec4899', 'png': '#ec4899', 'gif': '#ec4899'
    };
    return colors[ext] || '#6b7280';
  },

  async handleFileImport(event) {
    const files = event.target.files;
    for (const file of files) {
      const result = await WebOS.FileSystem.importFile(file);
      if (result.success) {
        await WebOS.Notifications.createNotification(
          'Fichier importé',
          `${file.name} (${WebOS.FileSystem.formatFileSize(file.size)})`,
          'success',
          'files'
        );
      }
    }
    WebOS.Apps.Files.refresh();
    event.target.value = '';
  },

  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#3b82f6';
    event.currentTarget.style.background = '#eff6ff';
  },

  handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#d1d5db';
    event.currentTarget.style.background = '#fafafa';
  },

  async handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.style.borderColor = '#d1d5db';
    event.currentTarget.style.background = '#fafafa';

    const files = event.dataTransfer.files;
    for (const file of files) {
      const result = await WebOS.FileSystem.importFile(file);
      if (result.success) {
        await WebOS.Notifications.createNotification(
          'Fichier déposé',
          `${file.name} importé avec succès`,
          'success',
          'files'
        );
      }
    }
    WebOS.Apps.Files.refresh();
  },

  showExportMenu(filename) {
    const content = `
      <div style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: #1f2937;">Exporter: ${filename}</h3>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <button class="btn" onclick="AdvancedFileManager.exportAs('${filename}', null)" style="background: #3b82f6;">
            Format original
          </button>
          <button class="btn" onclick="AdvancedFileManager.exportAs('${filename}', 'txt')" style="background: #6b7280;">
            Texte (.txt)
          </button>
          <button class="btn" onclick="AdvancedFileManager.exportAs('${filename}', 'json')" style="background: #f59e0b;">
            JSON (.json)
          </button>
          <button class="btn" onclick="AdvancedFileManager.exportAs('${filename}', 'csv')" style="background: #10b981;">
            CSV (.csv)
          </button>
          <button class="btn" onclick="AdvancedFileManager.exportAs('${filename}', 'xml')" style="background: #8b5cf6;">
            XML (.xml)
          </button>
          <button class="btn" onclick="AdvancedFileManager.exportAs('${filename}', 'html')" style="background: #06b6d4;">
            HTML (.html)
          </button>
        </div>

        <button class="btn" onclick="WebOS.WindowManager.close('export-menu')" style="margin-top: 20px; background: #ef4444;">
          Annuler
        </button>
      </div>
    `;

    WebOS.WindowManager.create('export-menu', 'Exporter le fichier', content, { width: 400, height: 350 });
  },

  async exportAs(filename, format) {
    await WebOS.FileSystem.exportFile(filename, format);
    WebOS.WindowManager.close('export-menu');
    await WebOS.Notifications.createNotification(
      'Fichier exporté',
      `${filename} exporté avec succès`,
      'success',
      'files'
    );
  },

  generateFileListHTML(files) {
    if (files.length === 0) {
      return '<p style="color: #6b7280; text-align: center; padding: 40px;">Aucun fichier<br><span style="font-size: 14px;">Importez ou glissez-déposez des fichiers pour commencer</span></p>';
    }

    return files.map(f => {
      const icon = this.getFileIcon(f.extension);
      const color = this.getFileColor(f.extension);

      return `
        <div class="file-item" style="display: flex; align-items: center; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; background: white;"
             onmouseover="this.style.background='#f9fafb'; this.style.borderColor='#3b82f6';"
             onmouseout="this.style.background='white'; this.style.borderColor='#e5e7eb';">
          <div style="flex: 1; display: flex; align-items: center; gap: 12px;" onclick="AdvancedFileManager.openFile('${f.name}')">
            <div style="font-size: 28px; color: ${color};">${icon}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; font-size: 15px;">${f.name}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                <span style="font-weight: 500;">${f.sizeFormatted}</span> •
                <span>${f.lastModified.toLocaleDateString('fr-CA', {year: 'numeric', month: 'short', day: 'numeric'})}</span> •
                <span style="text-transform: uppercase; font-weight: 600; color: ${color};">${f.extension}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn" style="width: auto; padding: 8px 14px; font-size: 13px; background: #10b981;"
                    onclick="event.stopPropagation(); AdvancedFileManager.showExportMenu('${f.name}')">
              ⬇ Exporter
            </button>
            <button class="btn" style="width: auto; padding: 8px 14px; font-size: 13px; background: #ef4444;"
                    onclick="event.stopPropagation(); AdvancedFileManager.deleteFile('${f.name}')">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async openFile(name) {
    const preview = await WebOS.FileSystem.getFilePreview(name);

    if (preview.type === 'image') {
      const content = `
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; background: #fafafa;">
          <img src="${preview.url}" style="max-width: 100%; max-height: 70%; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn" onclick="AdvancedFileManager.showExportMenu('${name}')" style="background: #10b981;">
              ⬇ Exporter
            </button>
            <button class="btn" onclick="AdvancedFileManager.deleteFile('${name}')" style="background: #ef4444;">
              🗑️ Supprimer
            </button>
          </div>
        </div>
      `;
      WebOS.WindowManager.create(`file-${name}`, name, content, { width: 800, height: 700 });
    } else if (preview.type === 'text') {
      const content = await WebOS.FileSystem.readFile(name);
      const editorContent = `
        <div style="height: 100%; display: flex; flex-direction: column;">
          <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
            <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px; background: #10b981;" onclick="AdvancedFileManager.saveFile('${name}')">
              💾 Enregistrer
            </button>
            <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px; background: #3b82f6;" onclick="AdvancedFileManager.showExportMenu('${name}')">
              ⬇ Exporter
            </button>
            <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px; background: #ef4444;" onclick="AdvancedFileManager.deleteFile('${name}')">
              🗑️ Supprimer
            </button>
          </div>
          <textarea id="fileEditor" style="flex: 1; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; resize: none;">${content || ''}</textarea>
        </div>
      `;
      WebOS.WindowManager.create(`file-${name}`, name, editorContent, { width: 900, height: 650 });
    } else {
      alert(preview.message || 'Impossible d\'ouvrir ce fichier');
    }
  },

  async saveFile(name) {
    const content = document.getElementById('fileEditor').value;
    await WebOS.FileSystem.writeFile(name, content);
    await WebOS.Notifications.createNotification(
      'Fichier enregistré',
      name,
      'success',
      'files'
    );
  },

  async deleteFile(name) {
    if (confirm(`Supprimer définitivement le fichier "${name}"?`)) {
      await WebOS.FileSystem.deleteFile(name);
      WebOS.WindowManager.close(`file-${name}`);
      await WebOS.Notifications.createNotification(
        'Fichier supprimé',
        name,
        'info',
        'files'
      );
      WebOS.Apps.Files.refresh();
    }
  }
};
