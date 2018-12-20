/**
 * Logger
 * 
 * log level
 *   emerg: 0, 
 *   alert: 1, 
 *   crit: 2, 
 *   error: 3, 
 *   warning: 4, 
 *   notice: 5, 
 *   info: 6, 
 *   debug: 7
 */

var { createLogger, format, transports } = require('winston')
const fs = require('fs')
var path = require('path')
var logDir = path.resolve(__dirname, '../../logs') // directory path you want to set

// eslint-disable-next-line no-sync
if (!fs.existsSync(logDir)) {
  // Create the directory if it does not exist
  // eslint-disable-next-line no-sync
  fs.mkdirSync(logDir);
}

const logformat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  
  format.printf(info => `${(info.level || '').toUpperCase()} [${info.timestamp}] ${info.message}`)
)

const logger = createLogger({
  level: 'info',
  format: logformat,
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new transports.File({ filename: path.resolve(logDir, 'loadTopo-error.log'), level: 'error' }),
    new transports.File({ filename: path.resolve(logDir, 'loadTopo-infos.log') })
  ]
// eslint-disable-next-line semi
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    name: 'console',
    prettyPrint: true,
    format: logformat
  }))
}

/**
 * Set function name for log message
 * @param {Winston} loggerObj Winston logger
 * @param {String} label File name
 * @returns {void}
 */
function decorateName (loggerObj, label) {
  const methodList = ['info', 'emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug']
  let newLogger = Object.create(loggerObj)
  methodList.forEach(method => {
    newLogger[method] = function (first, ...rest) {
      const args = [`${label}: ${JSON.stringify(first)}`, ...rest]
      Reflect.apply(loggerObj[method], loggerObj, args)
    }
  });
  return newLogger
}

module.exports = {
  logger,
  decorateName
}