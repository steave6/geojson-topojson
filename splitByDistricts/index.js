#! /usr/bin/env node
const { Observable, from, of, fromEvent } = require('rxjs')
const { map, reduce } = require('rxjs/operators')
const JSONStream = require('JSONStream')
const fs = require('fs')
const es = require('event-stream')

const fileLocation = process.argv.slice(-1).pop()

var getStream = function (file) {
  const stream = fs.createReadStream(file, 'utf-8')
    parser = JSONStream.parse('features.*')

  stream.on('error', (err) => console.error(err))
  return stream.pipe(parser)
}

fromEvent(getStream(fileLocation), 'data').pipe(
  map(data => {
    const {type, properties, geometry} = data;
    let objData = {
      type: 'FeatureCollection',
      code: properties.N03_007,
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::6668' } },
      properties: {
        coordinateCode: 'urn:ogc:def:crs:EPSG::6668',
        prefecture: properties.N03_001,
        branch: properties.N03_002,
        city: properties.N03_003,
        town: properties.N03_004,
      },
      features: [
        { type, geometry }
      ]
    }
    return {featureCollection: objData, code: properties.N03_007}
  }),
  reduce((acc, {featureCollection, code}, index) => {
    let cur = acc[code]
    cur = cur || []
    cur.push(index)

    acc[code] = cur
    return acc;
  }, {}),
  map(d => {
    console.log(d)
    return d
  })
).subscribe(x => console.log(x),
err => console.log('SBSCRIBE ERROR: ',err),
() => console.log('COMPLETED'))
