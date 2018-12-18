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
  format.label({ label: path.basename(module.parent.filename) }),
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  
  format.printf(info => `${(info.level || '').toUpperCase()} [${info.timestamp}] ${info.label}: ${JSON.stringify(info.message)}`)
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

module.exports = logger
