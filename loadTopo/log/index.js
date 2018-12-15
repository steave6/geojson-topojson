var winston = require('winston')
const fs = require('fs')
var path = require('path')
var logDir = path.resolve(__dirname, '../../logs') // directory path you want to set
if ( !fs.existsSync( logDir ) ) {
    // Create the directory if it does not exist
    fs.mkdirSync( logDir );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: path.resolve(logDir, 'loadTopo-error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.resolve(logDir, 'loadTopo-infos.log') })
  ]
// eslint-disable-next-line semi
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

module.exports = logger
