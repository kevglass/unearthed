const config = require('./version.json');
const localProperties = require('./local.properties.json');
const path = require('path');
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const fs = require('fs');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'string-replace-loader',
            options: {
              search: '_VERSION_',
              replace: '' + config.version,
              flags: 'g'
            }
          },
          {
            loader: 'string-replace-loader',
            options: {
              search: '_ROOMPASSWORD_',
              replace: '' + localProperties.roomPassword,
              flags: 'g'
            }
          },
          {
            loader: 'ts-loader',
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.png$/,
        loader: "url-loader",
      },
      {
        test: /\.mp3$/,
        loader: "url-loader",
      },
      {
        test: /\.properties$/,
        loader: "url-loader",
      }
    ],
  },
  resolve: {
    plugins: [new TsConfigPathsPlugin({})],
    extensions: ['.tsx', '.ts', '.js'],
    symlinks: true
  },
  devtool: 'eval-source-map',
  devServer: {
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "resources", to: "[path][name][ext]" },
      ]
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      inject: false,
      templateParameters: {
        version: config.version
      }
    })
  ]
};
