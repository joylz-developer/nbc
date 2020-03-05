const path = require('path');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

const distPath = path.join(__dirname, '/dist');

const isDev = true;

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`;

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all'
    }
  }

  // if (isProd) {
  //   config.minimizer = [
  //     new OptimizeCssAssetWebpackPlugin(),
  //     new TerserWebpackPlugin()
  //   ]
  // }

  return config
}

const plugins = () => {
  const base = [
    new webpack.ProgressPlugin(),
    () => { if (isDev) { return new CleanWebpackPlugin(); } },
    new MomentLocalesPlugin({
      localesToKeep: ['ru'],
    }),
    new HTMLWebpackPlugin(
      {
        template: './popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
        minify: {
          collapseWhitespace: false
        }
      }),
    new HTMLWebpackPlugin(
      {
        template: './notifications/notifications.html',
        filename: 'notifications.html',
        chunks: ['notifications'],
        minify: {
          collapseWhitespace: false
        }
      }),
    new MiniCssExtractPlugin({
      filename: filename('css')
    }),
    new CopyWebpackPlugin([
      {
      from: '../node_modules/jquery/dist/jquery.min.js',
      to: distPath
      },
      {
      from: 'images/',
      to: distPath + '/images'
    }, {
      from: 'uploads/',
      to: distPath + '/uploads'
    }, {
      from: '*.*',
      to: distPath
    }
    ]),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }],
      },
      canPrint: true
    }),
  ]

  return base;
}

const cssLoaders = extra => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: true
      },
    },
    'css-loader'
  ]

  if (extra) {
    loaders.push(extra)
  }

  return loaders
}

const babelOptions = preset => {
  const opts = {
    presets: [
      '@babel/preset-env'
    ],
    plugins: [
      ['@babel/plugin-proposal-optional-chaining', {
        "loose": true
      }],
      ['@babel/plugin-proposal-nullish-coalescing-operator', {
        "loose": true
      }],
      ["add-module-exports"],
      ['@babel/plugin-transform-runtime'],
    ],
  }

  return opts
}

const config = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',

  entry: {
    popup: './popup/popup.js',
    notifications: './notifications/notifications.js',
  },
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist')
  },

  plugins: plugins(),

  optimization: optimization(),

  module: {
    noParse: [
      /[\/\\]node_modules[\/\\]jquery[\/\\]dist[\/\\]jquery.min\.js$/
    ],
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: {
          loader: 'babel-loader',
          options: babelOptions()
        }
      },
      {
        test: /\.css$/,
        exclude: /fonts/,
        use: cssLoaders()
      },
      {
        test: /\.scss$/,
        use: cssLoaders({
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
            sassOptions: {
              fiber: require('fibers'),
            },
          },
        })
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        }],
      },
    ],
  },
};

module.exports = config;
