import { contextBridge } from 'electron';

// Безпечно експортуємо API для рендер процесу
contextBridge.exposeInMainWorld('electron', {
  // Тут можна додати API для комунікації між головним і рендер процесами
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

