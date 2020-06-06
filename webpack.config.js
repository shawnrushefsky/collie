const TerserPlugin = require('terser-webpack-plugin')
const webpack = require('webpack');
module.exports = {
  mode: 'development',
  entry: "./src/index.js",
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        module: true,
        mangle: {
          module: true,
          properties: false
        }
      }
    })]
  },
  target: 'node',
  output: {
    filename: 'bundle.js',
    libraryTarget: 'umd',
    globalObject: 'this'
  }
}