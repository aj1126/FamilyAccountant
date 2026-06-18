const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTransactions: () => ipcRenderer.invoke('db:getTransactions'),
  addTransaction: (tx) => ipcRenderer.invoke('db:addTransaction', tx),
  updateSyncStatus: (id, status) => ipcRenderer.invoke('db:updateSyncStatus', id, status),
  openHelp: () => ipcRenderer.invoke('app:openHelp'),
});
