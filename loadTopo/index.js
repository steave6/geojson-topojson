#!/usr/bin/env node
const AWS = require('aws-sdk')
const { from, fromEvent } = require('rxjs')
const { map, flatMap, takeUntil } = require('rxjs/operators')
const JSONStream = require('JSONStream')
const path = require('path')
let { logger, decorateName } = require('./utils/logger')
logger = decorateName(logger, __filename)
const DirectoryWalker = require('./utils/directory-walker')

const config = require('./config.json')
AWS.config.update(config)

const dynamodb = new AWS.DynamoDB()
const dynamoClient = new AWS.DynamoDB.DocumentClient()

const schemaGeoParams = require('../resources/schemas/Kant_GeoPolygonArea.json')

/**
 * get table names of dynamodb
 * @param {DynamoDB} db dynamoDB object
 * @param {String} tableName table name of dynamodb
 * @returns {Promise} array of table name
 */
async function listTables (db) {
  const tableList = await db.listTables({}).promise()
  logger.info(`tableList: ${JSON.stringify(tableList)}`)
  return tableList.TableNames
}

/**
 * Create dynamodb tables
 * @param {DynamoDB} db dynamoDB object
 * @param {Object} params table schemas
 * @returns {Promise} null of promise
 */
function createTable (db, params) {
  return db.createTable(params).promise()
    .then((data) => {
      logger.info(`Created table: ${JSON.stringify(data)}`)
      return data
    })
    .catch(err => {
      if (err.code === 'ResourceInUseException') {
        logger.info(`createTable: ${err.message}`)
      } else {
        logger.error(`createTable: Unable to create table: ${JSON.stringify(err)}`)
        throw err
      }
    })
}

function deleteTable (db, tableName) {
  return db.deleteTable({TableName: tableName}).promise()
    .then((data) => {
      logger.info(`deleteTable: ${JSON.stringify(data)}`)
      return data
    })
    .catch(err => {
      logger.error(err)
    })
}

/**
 * Put item into the DynamoDB table
 * @param {DocumentClient} client DynamoDb Document
 * @param {*} params Item of table
 * @returns {void} 
 */
function putItem (client, params) {
  return new Promise((resolve, reject) => {
    client.put(params, (err) => {
      if (err) {
        if (err.retryable) {
          logger.info('Retry on error')
          putItem(client, params)
        } else {
          logger.error(`putItem: Unable to add properties Error: ${JSON.stringify(err)}, ${JSON.stringify(params).substr(0, 255)}`)
          reject(err)
        }
      } else {
        logger.info(`putItem successed: ${JSON.stringify(params).substr(0, 255)}`)
        resolve(params)
      }
    })
  })
}

/**
 * Get content of table
 * @param {dynamoClient} client dynamo client
 * @param {Object} params query parameter object
 * @returns {Promise<Object>} query result
 */
function queryTable (client, params) {
  return client.query(params).promise()
    .then(data => {
      logger.info(JSON.stringify(data).substr(0, 255))
      return data
    })
    .catch(err => {
      logger.error(err)
      throw err
    })

}

/**
 * Load json files with name
 * @param {Array<{file, rs}>} rsList list of json info
 * @returns {Observable} rsObservable
 */
function getLoadJsonObservable (rsList) {
  const rsObservable = from(rsList).pipe(
    map(({file, rs}) => {
      logger.info(file)
      const name = path.parse(file).name
      const parser = JSONStream.parse()
      const stream = rs.pipe(parser)
      // error log
      stream.on('error', (err) => logger.error(err))
      // get Promised json
      const pjson = fromEvent(stream, 'data').pipe(
        takeUntil(fromEvent(stream, 'end')),
      )
      .toPromise()
      return pjson.then(json => ({name, json}))
    }),
    flatMap(data => data)
  )
  return rsObservable
}

/**
 * main function as executable
 * @param {String} dir of resource files
 * @param {String} ext of extension
 * @returns {void}
 */
// eslint-disable-next-line max-statements
async function main ({dir, ext}, callback) {
  logger.info('Start main function')
  if (!(dir && ext)) {
    logger.error(`dir: ${dir}, ext: ${ext}`)
    return
  }
  logger.info('Importing movies into DynamoDB. Please wait.')
  const tableList = await listTables(dynamodb)
  if (!tableList.includes(schemaGeoParams.TableName)) {
    await createTable(dynamodb, schemaGeoParams)
  }
  let dirWalker = new DirectoryWalker({dir, ext})
  const rsList = await dirWalker.getAllReadFileStream()
  const jsonObservable = getLoadJsonObservable(rsList)

  let promiseList = []
  jsonObservable.subscribe(({name, json}) => {
    let params = {
      TableName: schemaGeoParams.TableName,
      Item: {
        CountryCode: 'JP',
        Code: name,
        Year: '2018',
        Scale: '1',
        Topo: json
      }
    }
    logger.info(`jsonObservable: ${name}, ${JSON.stringify(params).substr(0, 255)}`)
    const put = putItem(dynamoClient, params)
      .catch(err => logger.error(err))
    promiseList.push(put)
  },
  (err) => logger.error(err),
  () => {
    Promise.all(promiseList)
      .then(() => {
        logger.info('End main function')
        return callback && callback()
      })
  })
}

module.exports = {
  main,
  dynamodb,
  dynamoClient,
  logger,
  listTables,
  createTable,
  deleteTable,
  putItem,
  queryTable,
  getLoadJsonObservable
}

if (typeof require != 'undefined' && require.main ===module) {
  main()
}