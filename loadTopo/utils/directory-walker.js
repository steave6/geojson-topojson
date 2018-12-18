const aFilter = require('async/filter')
const fs = require('fs')
const path = require('path')

module.exports = class DirectoryWalker {

  /**
   * @constructor
   * @param {Object} params dir of directory and ext of extention
   */
  constructor (params) {
    let {dir, ext} = params || {}
    this.dir = dir || ''
    this.ext = ext || ''
  }

  /**
   * get All the files that has topojson extention
   * @param {String} params path of target files
   * @returns {Array<String>} files array of files
   */
  getAllFiles (params) {
    let {dir, ext} = params || {}
    let _dir = dir || this.dir
    let _ext = ext || this.ext
    return new Promise((resolve, reject) => {
      fs.readdir(_dir, (err, list) => {
        if (err) {
          reject(new Error(err))
          return
        }
        let pathList = list.map(name => path.resolve(_dir, name))
        // filter with extention
        pathList = _ext ? pathList.filter(name => new RegExp(`\\.${_ext}$`, 'u').test(name)) : pathList
        aFilter(pathList, function(_path, callback) {
          // eslint-disable-next-line handle-callback-err
          fs.stat(_path, function(err, stat) {
            callback(null, stat.isFile())
          })
        }, function(err, results) {
          if (err) {
            reject(new Error(err))
            return
          }
          resolve(results)
        })
      })
    })
  }

  /**
   * Get the stream of files
   * @param {String} params dir and ext
   * @return {Promise<ReadableStream>} rs
   */
  getAllReadFileStream (params) {
    return this.getAllFiles(params)
      .then(list => list.map(file => ({
          file,
          rs: fs.createReadStream(file)
        })))
  }
}