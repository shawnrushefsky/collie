const TerserPlugin = require('terser-webpack-plugin')
module.exports = {
  mode: 'development',
  entry: "./api/index.js",
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
    filename: 'api/index.js',
    libraryTarget: 'umd',
    globalObject: 'this'
  }
}