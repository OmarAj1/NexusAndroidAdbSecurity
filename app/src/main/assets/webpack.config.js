const path = require('path');

module.exports = {
  entry: './index.tsx', // Your entry point
  mode: 'production',   // Optimizes for offline speed
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'], // Injects Tailwind into JS
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  performance: {
    hints: false, // Suppress size warnings for offline apps
  },
};