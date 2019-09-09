const { override, fixBabelImports, addLessLoader } = require("customize-cra");

const themeVars = require("./src/styles/abstracts/_theme.js");

module.exports = override(
  fixBabelImports("import", {
    libraryName: "antd",
    libraryDirectory: "es",
    style: true
  }),
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: themeVars.ant
  })
);
