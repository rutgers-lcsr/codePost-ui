const path = require("path");
const SRC_PATH = path.join(__dirname, '../src');
const tsImportPluginFactory = require('ts-import-plugin')

var sass = require("node-sass");
const sassUtils = require("node-sass-utils")(sass);
const themeVars = require('../src/styles/abstracts/_theme.js');

module.exports = ({config}) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    include: [SRC_PATH],
      use: [
        {
          loader: require.resolve('awesome-typescript-loader'),
          options: {
            configFileName: './tsconfig.json',
            getCustomTransformers: () => ({
              before: [ tsImportPluginFactory( { style: true } ) ]
            }),
          },
        },
        { loader: require.resolve('react-docgen-typescript-loader') },
      ]
  });
  config.module.rules.push({
    test: /\.scss/,
    use: [{
      loader: 'style-loader',
    }, {
      loader: 'css-loader',
    }, {
      loader: 'sass-loader',
      // ------ Sharing variables between JS and SASS --------//
      // https://itnext.io/sharing-variables-between-js-and-sass-using-webpack-sass-loader-713f51fa7fa0
      options: {
        functions: {
          "get($keys)": function(keys) {
            keys = keys.getValue().split(".");
            let result = themeVars;
            let i;
            for (i = 0; i < keys.length; i++) {
              result = result[keys[i]];
            }
            result = sassUtils.castToSass(result);
            return result;
          }
        }
      }

    }],
  });
  config.module.rules.push({
    //------------------- For Ant Theme Override -------------------//
    // https://ant.design/docs/react/customize-theme
    test: /\.less$/,
    use: [{
      loader: 'style-loader',
    }, {
      loader: 'css-loader', // translates CSS into CommonJS
    }, {
      loader: 'less-loader', // compiles Less to CSS
      options: {
        modifyVars: themeVars.ant,
        javascriptEnabled: true,
      },
    }],
  });
  config.resolve.extensions.push('.ts', '.tsx');
  return config;
};