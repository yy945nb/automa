const webpack = require('webpack');
const path = require('path');
const fileSystem = require('fs-extra');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const env = require('./utils/env');

const ASSET_PATH = process.env.ASSET_PATH || '/';

const alias = {
  '@': path.resolve(__dirname, 'src/'),
  secrets: path.join(__dirname, 'secrets.blank.js'),
  '@business': path.resolve(__dirname, 'business/dev'),
};

// load the secrets
const secretsPath = path.join(__dirname, `secrets.${env.NODE_ENV}.js`);

const fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias.secrets = secretsPath;
}

const options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    sandbox: path.join(__dirname, 'src', 'sandbox', 'index.js'),
    execute: path.join(__dirname, 'src', 'execute', 'index.js'),
    newtab: path.join(__dirname, 'src', 'newtab', 'index.jsx'),
    popup: path.join(__dirname, 'src', 'popup', 'index.jsx'),
    params: path.join(__dirname, 'src', 'params', 'index.jsx'),
    background: path.join(__dirname, 'src', 'background', 'index.js'),
    contentScript: path.join(__dirname, 'src', 'content', 'index.js'),
    offscreen: path.join(__dirname, 'src', 'offscreen', 'index.js'),
    recordWorkflow: path.join(
      __dirname,
      'src',
      'content',
      'services',
      'recordWorkflow',
      'index.jsx'
    ),
    webService: path.join(
      __dirname,
      'src',
      'content',
      'services',
      'webService.js'
    ),
    elementSelector: path.join(
      __dirname,
      'src',
      'content',
      'elementSelector',
      'index.jsx'
    ),
  },
  chromeExtensionBoilerplate: {
    notHotReload: [
      'background',
      'webService',
      'contentScript',
      'recordWorkflow',
      'elementSelector',
    ],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: new RegExp(`.(${fileExtensions.join('|')})$`),
        type: 'asset/resource',
        dependency: { not: [/node_modules/] },
        generator: {
          filename: '[name][ext]',
        },
      },
      {
        test: /\.[jt]sx?$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias,
    extensions: fileExtensions
      .map((extension) => `.${extension}`)
      .concat(['.ts', '.tsx', '.jsx', '.js', '.css']),
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new webpack.DefinePlugin({
      BROWSER_TYPE: JSON.stringify(env.BROWSER),
    }),
    new webpack.ProgressPlugin(),
    // clean the build folder
    new CleanWebpackPlugin({
      verbose: false,
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin({
      patterns: [
        {
          from:
            env.NODE_ENV === 'development' && env.BROWSER === 'chrome'
              ? `src/manifest.${env.BROWSER}.dev.json`
              : `src/manifest.${env.BROWSER}.json`,
          to: path.join(__dirname, 'build', 'manifest.json'),
          force: true,
          toType: 'file',
          transform(content) {
            const manifestObj = {
              description: process.env.npm_package_description,
              version: process.env.npm_package_version,
              ...JSON.parse(content.toString()),
            };
            const isChrome = env.BROWSER === 'chrome';

            if (manifestObj.version && manifestObj.version.includes('-')) {
              const [version, preRelease] = manifestObj.version.split('-');

              if (isChrome) {
                manifestObj.version = version;
                manifestObj.version_name = `${version} ${preRelease}`;
              } else {
                manifestObj.version = `${version}${preRelease}`;
              }
            }

            return Buffer.from(JSON.stringify(manifestObj));
          },
        },
        {
          from: 'src/assets/images/icon-128.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
        {
          from: 'src/assets/images/icon-dev-128.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'newtab', 'index.html'),
      filename: 'newtab.html',
      chunks: ['newtab'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'sandbox', 'index.html'),
      filename: 'sandbox.html',
      chunks: ['sandbox'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'execute', 'index.html'),
      filename: 'execute.html',
      chunks: ['execute'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'params', 'index.html'),
      filename: 'params.html',
      chunks: ['params'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'offscreen', 'index.html'),
      filename: 'offscreen.html',
      chunks: ['offscreen'],
      cache: false,
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
