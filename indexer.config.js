const TerserPlugin = require('terser-webpack-plugin')
module.exports = {
  mode: 'development',
  entry: "./indexer/index.js",
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
    filename: 'indexer/index.js',
    libraryTarget: 'umd',
    globalObject: 'this'
  }
}