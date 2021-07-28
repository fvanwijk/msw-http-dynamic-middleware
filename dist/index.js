
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./msw-dynamic-http-middleware.cjs.production.min.js')
} else {
  module.exports = require('./msw-dynamic-http-middleware.cjs.development.js')
}
