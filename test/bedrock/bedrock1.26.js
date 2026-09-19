/* eslint-env mocha */
// Decode real Bedrock 1.26.45 sub-chunk payloads captured from an official dedicated server. Hashed runtime ids
// (the blockHashes feature) mean the network palette stores 32-bit block-state hashes, so this needs a
// prismarine-registry that remaps the block tables by hash on start_game. The suite skips when the installed
// registry does not (so it stays green until that registry support is released).
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const registryLoader = require('prismarine-registry')

const version = '1.26.45'
const dir = path.join(__dirname, 'fixtures', version)
const reviver = (k, v) => typeof v === 'string' && /^-?\d+n$/.test(v) ? BigInt(v.slice(0, -1)) : v

describe('bedrock ' + version + ' hashed chunk decode', function () {
  const registry = registryLoader('bedrock_' + version)
  const startGame = JSON.parse(fs.readFileSync(path.join(dir, 'start_game.json'), 'utf8'), reviver)
  before(function () {
    if (!registry.handleStartGame) this.skip()
    registry.handleStartGame(startGame)
    if (!registry.blocksByStateId || registry.blocksByStateId[registry.blocksByName.stone.defaultState]?.name !== 'stone') this.skip()
  })

  it('resolves the block-state hash palette to named blocks', function () {
    const ChunkColumn = require('prismarine-chunk')(registry)
    const col = new ChunkColumn({ x: 0, z: 0 })
    const found = new Set()
    for (const file of fs.readdirSync(dir).filter(f => f.startsWith('subchunk-') && f.endsWith('.bin'))) {
      const y = Number(file.match(/subchunk-(-?\d+)_(-?\d+)_(-?\d+)/)[2])
      col.networkDecodeSubChunkNoCache(y, fs.readFileSync(path.join(dir, file)))
      for (let x = 0; x < 16; x += 4) for (let z = 0; z < 16; z += 4) for (let ly = 0; ly < 16; ly += 4) {
        const b = col.getBlock({ x, y: y * 16 + ly, z })
        if (b && b.name && b.name !== 'air') found.add(b.name)
      }
    }
    assert.ok(found.size > 3, 'expected several distinct blocks, got: ' + [...found].join(', '))
    assert.ok(found.has('deepslate') || found.has('stone') || found.has('bedrock'), 'expected common stone-family blocks, got: ' + [...found].join(', '))
  })
})
