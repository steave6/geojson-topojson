const chai = require('chai')
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const { assert, expect } = chai
const should = require('chai').should()
const path = require('path')
const loadTopo = require('../../loadTopo/index')
const DirectoryWalker = require('../../loadTopo/utils/directory-walker')
const { dynamodb, dynamoClient } = loadTopo

// suppress console prints
loadTopo.logger.transports.find(transport => transport.name === 'console').silent = true

const _deleteTable = async () => {
  try {
    const tables = await loadTopo.listTables(dynamodb)
    // eslint-disable-next-line no-invalid-this
    if (tables.includes(this.TableName)) {
        // eslint-disable-next-line no-invalid-this
        return loadTopo.deleteTable(dynamodb, this.TableName)
    }
  // eslint-disable-next-line no-empty
  } catch (ex) {}
  return Promise.resolve()
}

describe('TEST for loadTopo.js', function() {

  describe('Main Function', function() {
    const TableName = 'GeoJapanDistricts'
    describe('#Exists', function() {
      it('should contain properties', function() {
        loadTopo.should.have.property('main')
      })
    })
    describe('#Function', function() {
      before(_deleteTable.bind({TableName}))
      it('should process properly', function(done) {
        const dir = path.resolve(__dirname, './resources')
        const ext = 'topojson'
        loadTopo.main({dir, ext}, () => done())
      })
      it('should be able to query data from DynamoDB', async () => {
        var params = {
          TableName,
          KeyConditionExpression: '#yr = :year',
          ExpressionAttributeNames: {
              '#yr': 'year'
          },
          ExpressionAttributeValues: {
              ':year': 2018
          }
        }
        const result = await loadTopo.queryTable(dynamoClient, params)
        expect(result).has.keys('Count', 'Items', 'ScannedCount')
        expect(result.Items).to.have.a.lengthOf(4)
        return result
      })
    })
  })

  /**
   * Library Test
   */
  describe('Library', function() {
    describe('#Exists', function() {
      it('should contain properties', function() {
        loadTopo.should.have.property('dynamodb')
        loadTopo.should.have.property('dynamoClient')
        loadTopo.should.have.property('logger')
        loadTopo.should.have.property('listTables')
        loadTopo.should.have.property('createTable')
        loadTopo.should.have.property('deleteTable')
        loadTopo.should.have.property('putItem')
        loadTopo.should.have.property('queryTable')
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

    /**
     * DynamoDb Sequential Test
     */
    describe('#DB Operation: createTable() and putItem() and queryTable() and deleteTable()', function() {
      const TableName = 'Test_GeoJapanDistricts'
      before(_deleteTable.bind({TableName}))
      it('should create table', async () => {
        const createParams = require('../../loadTopo/schema-GeoJapanDistricts.json')
        createParams.TableName = TableName
        await loadTopo.createTable(dynamodb, createParams)
        const tables = await loadTopo.listTables(dynamodb)
        expect(tables).includes(TableName)
        return tables
      })
      it('should be able to put item to DynamoDB', async () => {
        let params = {
          TableName,
          Item: {
            year: 2018,
            code: '01101',
            topo: {type: 'Topology'}
          }
        }
        const result = await loadTopo.putItem(dynamoClient, params)
        expect(result).not.to.undefined
        return result
      })
      it('should be able to query data from DynamoDB', async () => {
        var params = {
          TableName,
          KeyConditionExpression: '#cd = :code and #yr = :year',
          ExpressionAttributeNames: {
              '#cd': 'code',
              '#yr': 'year'
          },
          ExpressionAttributeValues: {
              ':code': '01101',
              ':year': 2018
          }
        }
        const result = await loadTopo.queryTable(dynamoClient, params)
        expect(result).has.keys('Count', 'Items', 'ScannedCount')
        expect(result.Items).to.have.a.lengthOf(1)
        return result
      })
      it('should delete table', async () => {
        const tableName = 'GeoJapanDistricts'
        const result = await loadTopo.deleteTable(dynamodb, tableName)
        return result
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
  
  /**
   * DynamoDB Test
   */
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
