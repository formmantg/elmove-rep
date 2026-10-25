const { contextBridge } = require('electron');

// Expose minimal API if needed later
contextBridge.exposeInMainWorld('elmove', {
  version: '1.0.0',
  isElectron: true
});
