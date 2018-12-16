#!/usr/bin/env node
const AWS = require('aws-sdk')
const logger = require('./log')

const config = require('./config.json')
AWS.config.update(config)

const dynamodb = new AWS.DynamoDB()
const dynamoClient = new AWS.DynamoDB.DocumentClient()

const params = require('./schema-GeoJapanDistricts.json')
const topoTableName = 'topoJson'

/**
 * get table names of dynamodb
 * @param {DynamoDB} db dynamoDB object
 * @param {String} tableName table name of dynamodb
 * @returns {Promise} array of table name
 */
async function listTables (db) {
  const tableList = await db.listTables({}).promise()
  logger.info(tableList)
  return tableList.TableNames
}

/**
 * Create dynamodb tables
 * @param {DynamoDB} db dynamoDB object
 * @param {String} tableName table name of dynamodb
 * @param {Object} params table schemas
 * @returns {Promise} null of promise
 */
function createTable (db, tableName, params) {

  return listTables(db).then(tables => {
    if (tables.includes(tableName)) {
      db.createTable(params, function(err, data) {
        if (err) {
          logger.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2))
        } else {
          logger.info('Created table. Table description JSON:', JSON.stringify(data, null, 2))
        }
      })
    }
  })
}

/**
 * Put item into the DynamoDB table
 * @param {DocumentClient} client DynamoDb Document
 * @param {*} params Item of table
 * @returns {void} 
 */
function putItem (client, params) {
  
  client.put(params, function(err) {
    if (err) {
      logger.error('Unable to add properties', params.town, '. Error JSON:', JSON.stringify(err, null, 2))
      if (err.retryable) {
        logger.info('Retry on error')
        putItem(params)
      }
    } else {
      logger.info('PutItem succeeded:', params.town)
    }
  })
}

/**
 * main function as executable
 * @returns {void}
 */
function main () {
  logger.info('Importing movies into DynamoDB. Please wait.')
  createTable(dynamodb, topoTableName, params).then()
}

module.exports = {
  dynamodb,
  dynamoClient,
  logger,
  putItem,
  listTables,
  createTable
}

if (typeof require != 'undefined' && require.main ===module) {
  main()
}