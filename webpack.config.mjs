import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
  module: {
    rules: [
      {
        test: /maplibre-gl-(worker|shared)\.mjs$/,
        resourceQuery: /url/,
        type: 'asset/resource',
        generator: { filename: 'maplibre/[name][ext]' }
      }
    ]
  },
  resolve: {
    fallback: {
      os: false,
      path: false,
      fs: false,
      vm: false,
      zlib: false,
      http: false,
      https: false,
      tls: false,
      net: false,
      stream: false,
      crypto: false
    }
  },
  entry: {
    map: '/app/assets/javascripts/map.js',
    application: '/app/assets/javascripts/application.js'
  },
  output: {
    filename: '[name].bundle.js',
    publicPath: '/public/javascripts/',
    path: path.resolve(__dirname, 'app/assets/javascripts')
  },
  mode: 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, '/')
    },
    compress: true,
    port: 9000,
    open: true, // open the browser after server had been started
    hot: true // enable HMR on the server
  }
}
