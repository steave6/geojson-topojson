const { assert, expect } = require('chai')
const should = require('chai').should()
const loadTopo = require('../../loadTopo/index.js')
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
