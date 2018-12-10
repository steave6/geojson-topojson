#!/usr/bin/env node
var AWS = require("aws-sdk"),
  fs = require('fs'),
  JSONStream = require('JSONStream'),
  es = require('event-stream'),
  reduce = require('stream-reduce')
  log = require('./log.js');

var config = require('./config.json')
AWS.config.update(config);

var docClient = new AWS.DynamoDB.DocumentClient();

log.info("Importing movies into DynamoDB. Please wait.");

var getStream = function () {
  var stream = fs.createReadStream('N03-18_180101.geojson', {encoding: 'utf8'}),
    parser = JSONStream.parse('features.*')

  return stream.pipe(parser)
}

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

getStream()
  .pipe(es.map(function(geo, cb) {
    var {type, properties, geometry} = geo;
    var params = {
        TableName: "GeoJapanDistricts",
        Item: {
          year: 2018, 
          code: properties.N03_007,
          type: type,
          properties: {
            coordinateCode: "urn:ogc:def:crs:EPSG::6668",
            prefecture: properties.N03_001,
            branch: properties.N03_002,
            city: properties.N03_003,
            town: properties.N03_004,
          },
          geometry: [geometry],
        }
    };

    cb(null, params);
  }))
  .pipe(reduce(function(acc, data) {
    log.info(JSON.stringify(data, null, 2))
    var geo = acc[data.Item.code]
    if (geo) {
      geo.Item.geometry.push(data.Item.geometry[0])
      acc[data.Item.code] = geo
    } else {
      acc[data.Item.code] = data
    }
    return acc
  }, {}))
  .pipe(es.flatmapSync(function (data) {
    log.info(JSON.stringify(data, null, 2))
    return Object.values(data)
  }))
  .pipe(es.map(function(params, cb) {
    log.info(params)
    putItem(params)
  }))
  .on('error', function(err) {
    log.error(err)
  })

