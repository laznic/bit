import path from 'path';
import { cssLoaders } from '@teambit/webpack.modules.style-loaders';
import { pathNormalizeToLinux } from '@teambit/legacy/dist/utils';
import { WebpackConfigWithDevServer } from '@teambit/webpack';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import evalSourceMapMiddleware from 'react-dev-utils/evalSourceMapMiddleware';
import noopServiceWorkerMiddleware from 'react-dev-utils/noopServiceWorkerMiddleware';
import redirectServedPath from 'react-dev-utils/redirectServedPathMiddleware';
import getPublicUrlOrPath from 'react-dev-utils/getPublicUrlOrPath';
import { postCssConfig } from './postcss.config';
import { html } from './html';

/*
 * Webpack config for the bit ui
 * i.e. `bit start --dev`,
 */

const clientHost = process.env.WDS_SOCKET_HOST;
const clientPath = process.env.WDS_SOCKET_PATH; // default is '/sockjs-node';
const port = process.env.WDS_SOCKET_PORT;

const publicUrlOrPath = getPublicUrlOrPath(process.env.NODE_ENV === 'development', '/', '/public');

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

export function devConfig(workspaceDir, entryFiles, title, aspectPaths): WebpackConfigWithDevServer {
  const resolveWorkspacePath = (relativePath) => path.resolve(workspaceDir, relativePath);

  const { styleLoaders, stylePlugins } = cssLoaders({
    postcssOptions: postCssConfig,
    styleInjector: 'style-loader',
  });
  // Host
  const host = process.env.HOST || 'localhost';

  // Required for babel-preset-react-app
  process.env.NODE_ENV = 'development';

  return {
    // Environment mode
    mode: 'development',
    // improves HMR
    snapshot: { managedPaths: [] },

    devtool: 'inline-source-map',

    // Entry point of app
    entry: {
      main: entryFiles,
      // preview: entryFiles.map(filePath => resolveWorkspacePath(filePath))
    },

    output: {
      // Development filename output
      filename: 'static/js/[name].bundle.js',

      pathinfo: true,

      path: resolveWorkspacePath('/'),

      publicPath: publicUrlOrPath,

      chunkFilename: 'static/js/[name].chunk.js',

      // point sourcemap entries to original disk locations (format as URL on windows)
      devtoolModuleFilenameTemplate: (info) => pathNormalizeToLinux(path.resolve(info.absoluteResourcePath)),

      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      // Commented out to use the default (self) as according to tobias with webpack5 self is working with workers as well
      // globalObject: 'this',
    },

    infrastructureLogging: {
      level: 'error',
    },

    stats: 'errors-only',

    devServer: {
      allowedHosts: 'all',

      static: [
        {
          directory: resolveWorkspacePath(publicUrlOrPath),
          staticOptions: {},
          // Don't be confused with `dev.publicPath`, it is `publicPath` for static directory
          // Can be:
          // publicPath: ['/static-public-path-one/', '/static-public-path-two/'],
          publicPath: publicUrlOrPath,
          // Can be:
          // serveIndex: {} (options for the `serveIndex` option you can find https://github.com/expressjs/serve-index)
          serveIndex: true,
          // Can be:
          // watch: {} (options for the `watch` option you can find https://github.com/paulmillr/chokidar)
          watch: true,
        },
      ],

      // Enable compression
      compress: true,

      // Enable hot reloading
      hot: true,

      host,

      historyApiFallback: {
        disableDotRule: true,
        index: publicUrlOrPath,
      },

      client: {
        webSocketURL: {
          hostname: clientHost,
          pathname: clientPath,
          port,
        },
      },

      onBeforeSetupMiddleware({ app, server }) {
        // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware`
        // middlewares before `redirectServedPath` otherwise will not have any effect

        // This lets us fetch source contents from webpack for the error overlay
        // @ts-ignore - #4860
        app.use(evalSourceMapMiddleware(server));
        // This lets us open files from the runtime error overlay.
        app.use(errorOverlayMiddleware());
      },

      onAfterSetupMiddleware({ app }) {
        // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
        app.use(redirectServedPath(publicUrlOrPath));

        // This service worker file is effectively a 'no-op' that will reset any
        // previous service worker registered for the same host:port combination.
        // We do this in development to avoid hitting the production cache if
        // it used the same host and port.
        // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
        app.use(noopServiceWorkerMiddleware(publicUrlOrPath));
      },

      devMiddleware: {
        // forward static files
        publicPath: publicUrlOrPath.slice(0, -1),
      },
    },

    resolve: {
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: moduleFileExtensions.map((ext) => `.${ext}`),
      alias: {
        react: require.resolve('react'),
        'react-dom/server': require.resolve('react-dom/server'),
        'react-dom': require.resolve('react-dom'),
        // 'react-refresh/runtime': require.resolve('react-refresh/runtime'),
      },
      fallback: {
        fs: false,
        path: require.resolve('path-browserify'),
        stream: false,
        process: false,
      },
    },

    module: {
      // Webpack by default includes node_modules under its managed paths which cause the whole directory to be cached
      // Watch mode requires us to turn off unsafeCache as well
      // this de-optimizes the dev build but ensures hmr works when writing/linking into node modules.
      // However we do not lose the caching entirely like cache: false
      unsafeCache: false,
      rules: [
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.js$/,
          enforce: 'pre',
          include: /node_modules/,
          // only apply to packages with componentId in their package.json (ie. bit components)
          descriptionData: { componentId: (value) => !!value },
          use: [require.resolve('source-map-loader')],
        },
        {
          test: /\.(js|jsx|tsx|ts)$/,
          exclude: /node_modules/,
          include: workspaceDir,
          loader: require.resolve('babel-loader'),
          options: {
            configFile: false,
            babelrc: false,
            presets: [
              // Preset includes JSX, TypeScript, and some ESnext features
              require.resolve('babel-preset-react-app'),
            ],
            plugins: [require.resolve('react-refresh/babel')],
          },
        },
        ...styleLoaders,
      ],
    },

    plugins: [
      ...stylePlugins,

      new ReactRefreshWebpackPlugin({
        include: aspectPaths, // original default value was /\.([cm]js|[jt]sx?|flow)$/i
        // replaces the default value of `/node_modules/`
        exclude: [
          /react-refresh-webpack-plugin/i,
          // file type filtering was done by `include`, so need to negative-filter them out here
          // A lookbehind assertion (`?<!`) has to be fixed width
          /(?<!\.jsx)(?<!\.js)(?<!\.tsx)(?<!\.ts)$/i,
        ],
      }),
      // Re-generate index.html with injected script tag.
      // The injected script tag contains a src value of the
      // filename output defined above.
      new HtmlWebpackPlugin({
        inject: true,
        templateContent: html(title || 'My component workspace'),
        chunks: ['main'],
        filename: 'index.html',
      }),
      // new HtmlWebpackPlugin({
      //   templateContent: html('Component preview'),
      //   chunks: ['preview'],
      //   filename: 'preview.html'
      // })
    ],
  };
}
