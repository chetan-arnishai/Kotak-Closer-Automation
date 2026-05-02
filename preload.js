'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  start:            (data) => ipcRenderer.invoke('start', data),
  fillSupplementary:()     => ipcRenderer.invoke('fill-supplementary'),
  runConclusion:    ()     => ipcRenderer.invoke('run-conclusion'),
  listPdfs:         ()     => ipcRenderer.invoke('list-pdfs'),

  // Events from main process → renderer (UI)
  onLog:            (cb)   => ipcRenderer.on('log', (_, msg) => cb(msg)),
  onStep1Done:      (cb)   => ipcRenderer.on('step1-done', () => cb()),
  onSupplementaryDone:(cb) => ipcRenderer.on('supplementary-done', () => cb()),
});