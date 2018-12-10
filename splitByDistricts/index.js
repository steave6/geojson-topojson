#! /usr/bin/env node
const { Observable, from, of, fromEvent } = require('rxjs')
const { map, reduce, groupBy, mergeMap, toArray } = require('rxjs/operators')
const JSONStream = require('JSONStream')
const fs = require('fs')

main()

function getStream (file) {
  const stream = fs.createReadStream(file, 'utf-8')
    parser = JSONStream.parse('features.*')

  stream.on('error', (err) => console.error(err))
  return stream.pipe(parser)
}

function main() {
  const fileLocation = process.argv.slice(-1).pop()
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
    groupBy(({code, featureCollection}) => code),
    mergeMap(group => group.pipe(toArray()))
  ).subscribe(data => {
    console.log(data)
  },
  err => console.log('SBSCRIBE ERROR: ',err),
  () => {
    console.log('COMPLETED')
    sys.stdout.write('some data', () => {
      console.log('The data has been flushed');
    });
  })
}
