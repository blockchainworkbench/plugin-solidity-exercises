const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const deploy = require('./src/js/exercise/index')
const blockchain = require('./src/js/exercise/blockchain')
const solc = require('solc')

const WEBSITE_TPL = _.template(fs.readFileSync(path.resolve(__dirname, './assets/website.html')))
const EBOOK_TPL = _.template(fs.readFileSync(path.resolve(__dirname, './assets/ebook.html')))

const assertLibrary = fs.readFileSync(path.resolve(__dirname, './src/sol/Assert.sol'), 'utf8')

async function deployAssertLibrary () {
  const input = {
    'Assert.sol': assertLibrary
  }
  const codes = solc.compile({sources: input}, 1)
  this.config.values.variables.assertLibrary = await blockchain.deploy(codes.contracts['Assert.sol:Assert'])
}

/**
 * Manage all pre-operations necessary for the exercise to work
 * @param {{blocks: Array<{name: string, body: string}>}} blk - Information about the block being parsed
 * @returns {string} - HTML code to insert into the webpage
 */
async function processDeployement (blk) {
  const log = this.book.log

  const codes = {}

  _.each(blk.blocks, function (_blk) {
    codes[_blk.name] = _blk.body.trim()
  })

  // To have a quick update on local machine deployment can be disabled
  if (process.env.WRITE_MODE === undefined) {
    // Compile and deploy test contracts to our blockchain
    const tests = await deploy(codes, { address: this.config.values.variables.assertLibrary, source: assertLibrary })
    codes.deployed = JSON.stringify(tests)
  }

  codes.hints = await this.book.renderBlock('markdown', '```solidity\n' + codes.solution + '\n```')

  // Select appropriate template
  const tpl = (this.generator === 'website' ? WEBSITE_TPL : EBOOK_TPL)

  return tpl({
    message: blk.body,
    codes: codes
  })
}

module.exports = {
  website: {
    assets: './assets',
    js: [
      'ace/ace.js',
      'ace/theme-tomorrow.js',
      'ace/mode-javascript.js',
      'exercises.js'
    ],
    css: [
      'exercises.css',
      'hint.css'
    ],
    sol: [
      'sol/Assert.sol'
    ]
  },
  ebook: {
    assets: './assets',
    css: [
      'ebook.css'
    ]
  },
  hooks: {
    init: deployAssertLibrary
  },
  blocks: {
    exercise: {
      parse: false,
      blocks: ['initial', 'solution', 'validation', 'context'],
      process: processDeployement
    }
  }
}
