const path = require("path");
const SRC_PATH = path.join(__dirname, '../src');
const tsImportPluginFactory = require('ts-import-plugin')
// const STORIES_PATH = path.join(__dirname, '../stories');
//dont need stories path if you have your stories inside your //components folder
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
              before: [ tsImportPluginFactory( { style: 'css' } ) ]
            }),
          },
        },
        { loader: require.resolve('react-docgen-typescript-loader') },
      ]
  });
  config.module.rules.push({
    test:/\.scss$/,
    loaders: [
      require.resolve('style-loader'),
      require.resolve('css-loader'),
      require.resolve('sass-loader')
    ]
  });
  config.resolve.extensions.push('.ts', '.tsx');
  return config;
};