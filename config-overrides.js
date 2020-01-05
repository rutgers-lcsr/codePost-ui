const { override, fixBabelImports, addLessLoader } = require('customize-cra');
const path = require('path');

const themeVars = require('./src/styles/abstracts/_theme.js');

module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: true,
  }),
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: themeVars.ant,
  }),
  function(config, env) {
    const alias = config.resolve.alias || {};
    alias['@ant-design/icons/lib/dist$'] = path.resolve(__dirname, './src/antd_icons.js');
    config.resolve.alias = alias;
    return config;
  },
);
