const { assert, expect } = require('chai')
const should = require('chai').should()
const path = require('path')
const loadTopo = require('../../loadTopo/index')
const DirectoryWalker = require('../../loadTopo/utils/directory-walker')
const { dynamodb, dynamoClient } = loadTopo

// suppress console prints
loadTopo.logger.transports.find(transport => transport.name === 'console').silent = true

describe('TEST for loadTopo.js', function() {
  describe('Library', function() {
    describe('#Exists', function() {
      it('should contain properties', function() {
        loadTopo.should.have.property('dynamodb')
        loadTopo.should.have.property('dynamoClient')
        loadTopo.should.have.property('logger')
        loadTopo.should.have.property('putItem')
        loadTopo.should.have.property('listTables')
        loadTopo.should.have.property('createTable')
        loadTopo.should.have.property('getLoadJsonObservable')
      })
    })
    describe('#listTables()', function() {
      it('should get list tables', function() {
        return loadTopo.listTables(dynamodb)
          .then(tables => {
            expect(tables).to.be.an.instanceOf(Array)
          })
      })
    })
    describe('#getLoadJsonObservable()', function() {
      it('should be able to subscribe name and json data', async () => {
        const dirWalker = new DirectoryWalker()
        const dir = path.resolve(__dirname, './resources')
        const rsList = await dirWalker.getAllReadFileStream({dir, ext: 'topojson'})
        return loadTopo.getLoadJsonObservable(rsList)
          .subscribe(({name, json}) => {
            expect(name).not.to.be.empty.and.to.be.string
            expect(json).to.include.all.keys('type', 'objects', 'transform')
          })
      })
    })
  })
  describe('DynamoDB', function() {
    describe('#Connect', function() {
      it('should connect dynamodb', function() {
        return dynamodb.listTables({}).promise()
          .then((data) => {
            assert.isArray(data.TableNames)
          })
      })
    })
  })
})
