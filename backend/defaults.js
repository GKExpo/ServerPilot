const defaultSettings = {
  defaultJavaPath: 'java',
  defaultRamMin: '2G',
  defaultRamMax: '4G',
  playitPath: '',
  autoStartPlayit: true,
  autoRestartCrashed: false,
  theme: 'neon'
};

const defaultServer = {
  name: 'New Server',
  folderPath: '',
  jarName: '',
  javaPath: 'java',
  ramMin: '2G',
  ramMax: '4G',
  jvmArgs: '',
  serverType: 'Vanilla',
  playitPath: '',
  autoStartPlayit: true
};

module.exports = { defaultSettings, defaultServer };
