export interface WebOSIntegration {
  openOSINTApp: () => void;
  isWebOSEnvironment: () => boolean;
}

declare global {
  interface Window {
    WebOSIntegration?: WebOSIntegration;
  }
}

export function createWebOSIntegration(): WebOSIntegration {
  return {
    openOSINTApp: () => {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.display = 'block';
        rootElement.style.position = 'fixed';
        rootElement.style.top = '0';
        rootElement.style.left = '0';
        rootElement.style.width = '100%';
        rootElement.style.height = '100%';
        rootElement.style.zIndex = '1000';
        rootElement.style.background = 'white';
      }
    },

    isWebOSEnvironment: () => {
      return typeof window !== 'undefined' &&
             document.getElementById('webos-quebec-root') !== null;
    }
  };
}

export function initializeWebOSIntegration() {
  if (typeof window !== 'undefined') {
    window.WebOSIntegration = createWebOSIntegration();

    if (window.WebOSIntegration.isWebOSEnvironment()) {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.display = 'none';
      }
    }
  }
}

export function renderInWindow(containerId: string, onClose: () => void) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const rootElement = document.getElementById('root');
  if (rootElement) {
    container.appendChild(rootElement);
    rootElement.style.display = 'block';
    rootElement.style.width = '100%';
    rootElement.style.height = '100%';

    const closeHandler = (e: MessageEvent) => {
      if (e.data?.type === 'close-osint-app') {
        rootElement.style.display = 'none';
        onClose();
        window.removeEventListener('message', closeHandler);
      }
    };

    window.addEventListener('message', closeHandler);
  }
}
