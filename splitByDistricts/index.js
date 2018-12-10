#! /usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const { fromEvent } = require('rxjs')
const { map, groupBy, mergeMap, toArray, takeUntil } = require('rxjs/operators')
const JSONStream = require('JSONStream')
const fs = require('fs')
const path = require('path')

main({
  file: argv._.slice(-1).pop(),
  year: argv.year
})

function getStream (file) {
  const stream = fs.createReadStream(file, 'utf-8')
    parser = JSONStream.parse('features.*')

  stream.on('error', (err) => console.error(err))
  return stream.pipe(parser)
}

function main({file, year}) {
  const fileLocation = file
  const outYear = '' + (year || '')
  const fileStream = getStream(fileLocation)
  const geoJsonObservable = fromEvent(fileStream, 'data').pipe(
    takeUntil(fromEvent(fileStream, 'end')),
    map(data => {
      const {type, properties, geometry} = data;
      let objData = {
        type: 'FeatureCollection',
        code: properties.N03_007,
        properties: {
          crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::6668' } },
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
    groupBy(({code}) => code),
    mergeMap(group => group.pipe(toArray()))
  )
  
  const geoJsonPath = path.join(path.resolve(__dirname), '../geojson')
  geoJsonObservable.subscribe((data) => {
    let master = data.pop()
    if (master.code) {
      data.forEach((elm) => {
        master.featureCollection.features = master.featureCollection.features.concat(elm.featureCollection.features)
      })
    } else {// code is null
      master.featureCollection = [master.featureCollection]
      data.forEach((elm) => {
        master.featureCollection = master.featureCollection.concat(elm.featureCollection)
      })
    }
    const filePath = path.join(geoJsonPath, outYear)
    fs.mkdir(filePath, {recursive: true, mode: 0o755}, (err) => {
      if (err) throw 'Error on mkdir: ' + err
      fs.writeFile(path.join(filePath, `${master.code}.geojson`), JSON.stringify(master.featureCollection), 'utf-8', (err) => {
        if (err) {
          console.log('Error on write: ', err)
        }
      })
    });
  },
  err => console.log('SBSCRIBE ERROR: ',err),
  () => {
    console.log('COMPLETED')
  })
}
