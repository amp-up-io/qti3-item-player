const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  runtimeCompiler: true,

  // Fix for https://github.com/vuejs/vue-cli/issues/7291
  // "The 'from' argument must be of type string"
  parallel: false,

  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([
        {
          context: 'node_modules/@webcomponents/webcomponentsjs',
          from: '**/*.js',
          to: 'webcomponents'
        }
      ])
    ]
  }
};
