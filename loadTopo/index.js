#!/usr/bin/env node
const AWS = require("aws-sdk")
const fs = require('fs')
const path = require('path')
const log = require(path.resolve(__dirname, './log'));

const config = require(path.resolve(__dirname, './config.json'))
AWS.config.update(config)

var docClient = new AWS.DynamoDB.DocumentClient();

log.info("Importing movies into DynamoDB. Please wait.");

var putItem = function (params) {
    docClient.put(params, function(err, data) {
       if (err) {
         log.error("Unable to add properties", params.town, ". Error JSON:", JSON.stringify(err, null, 2))
         if (err.retryable) {
           log.info('Retry on error')
           putItem(params);
         }
       } else {
           log.info("PutItem succeeded:", params.town);
       }
    });
  }