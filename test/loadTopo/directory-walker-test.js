const chai = require('chai')
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const { assert, expect } = chai
const should = require('chai').should()
const logger = require('../../loadTopo/utils/logger.js')
const DirectoryWalker = require('../../loadTopo/utils/directory-walker.js')

const path = require('path')

// suppress console prints
logger.transports.find(transport => transport.name === 'console').silent = true

describe('TEST for directory-walker.js', function() {
  describe('DirectoryWalker', function() {
    describe('NORMAL', function() {
      describe('#Exists', function() {
        it('should contain properties', function() {
          expect(DirectoryWalker).to.respondTo('constructor')
          expect(DirectoryWalker).to.respondTo('getAllFiles')
          expect(DirectoryWalker).to.respondTo('getAllReadFileStream')
        })
      })
      describe('#getAllFiles()', function() {
        it('should get list of files', function() {
          const dirParam = path.resolve(__dirname, './resources')
          const dirWalker = new DirectoryWalker({dir: dirParam})
          return dirWalker.getAllFiles({ext: 'topojson'})
            .then(list => {
              expect(list).to.be.an.instanceOf(Array)
              expect(list).to.have.lengthOf(4)
            })
        })
        it('should get list of files with arguments', function() {
          const dir = path.resolve(__dirname, './resources')
          const dirWalker = new DirectoryWalker()
          return dirWalker.getAllFiles({dir, ext: 'topojson'})
            .then(list => {
              expect(list).to.be.an.instanceOf(Array)
              expect(list).to.have.lengthOf(4)
            })
        })
      })
      describe('#getAllReadFileStream()', function() {
        it('should get list of ReadableStream', function() {
          const dir = path.resolve(__dirname, './resources')
          const dirWalker = new DirectoryWalker()
          return dirWalker.getAllReadFileStream({dir, ext: 'topojson'})
            .then(list => {
              list.forEach(rs => {
                expect(rs.closed).to.be.false
                rs.on('close', () => expect(rs.closed).to.be.true)
                rs.close()
              });
            })
        })
      })
    })
    describe('ERROR', function() {
      describe('#getAllFiles()', function() {
        it('should get error because of no arguments', function() {
          const dirWalker = new DirectoryWalker()
          return should.throw(() => dirWalker.getAllFiles())
        })
      })
      describe('#getAllReadFileStream()', function() {
        it('should get error because of dir not exists', function() {
          const dir = path.resolve(__dirname, './notExistDir')
          const dirWalker = new DirectoryWalker()
          return dirWalker.getAllReadFileStream({dir}).should.be.rejected
        })
      })
    })
  })
})
