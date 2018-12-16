const assert = require('chai').assert
const should = require('chai').should()
const loadTopo = require('../loadTopo/index.js')
const { dynamodb, dynamoClient } = loadTopo

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
    describe('#Functionality', function() {
      it('should get list tables', function() {
        loadTopo.listTables(dynamodb).then(tables => {
          assert.isArray(tables)
          done()
        })
      })
    })
  })
  describe('DynamoDB', function() {
    describe('#Connect', function() {
      it('should connect dynamodb', function() {
        dynamodb.listTables({}, (err, data) => {
          assert.notExists(err)
          assert.isArray(data)
          done()
        })
      })
    })
  })
})
