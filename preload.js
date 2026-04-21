'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  start:         (data) => ipcRenderer.invoke('start', data),
  runConclusion: ()     => ipcRenderer.invoke('run-conclusion'),
  listPdfs:      ()     => ipcRenderer.invoke('list-pdfs'),
  onLog:         (cb)   => ipcRenderer.on('log', (_, msg) => cb(msg)),
  onFormDone:    (cb)   => ipcRenderer.on('form-done', () => cb()),
});