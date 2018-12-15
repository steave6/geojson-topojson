#!/usr/bin/env node
const AWS = require('aws-sdk')
const log = require('./log')

const config = require('./config.json')
AWS.config.update(config)

var dynamodb = new AWS.DynamoDB()
var dynamoClient = new AWS.DynamoDB.DocumentClient()

function isConnect () {

}

function putItem (params) {
  dynamoClient.put(params, function(err) {
    if (err) {
      log.error('Unable to add properties', params.town, '. Error JSON:', JSON.stringify(err, null, 2))
      if (err.retryable) {
        log.info('Retry on error')
        putItem(params)
      }
    } else {
      log.info('PutItem succeeded:', params.town)
    }
  })
}

function main () {
  log.info('Importing movies into DynamoDB. Please wait.')

}

module.exports = {
  dynamodb: dynamodb,
  dynamoClient: dynamoClient,
  logger: log,
  putItem: putItem,
}

if (typeof require != 'undefined' && require.main ===module) {
  main()
}