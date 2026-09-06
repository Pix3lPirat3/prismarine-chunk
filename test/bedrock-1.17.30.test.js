/* eslint-env mocha */

const assert = require('assert')
const { Vec3 } = require('vec3')

for (const version of ['1.17.30', '1.17.40']) {
  describe(`Bedrock ${version} zero-bit runtime palettes`, () => {
    it('decodes all-air subchunks without consuming the legacy biome data', async () => {
      const registry = require('prismarine-registry')(`bedrock_${version}`)
      registry.handleStartGame({ block_network_ids_are_hashes: false, itemstates: [] })
      const Chunk = require('..')(registry)
      const Stream = require('../src/bedrock/common/Stream')
      const stream = new Stream()

      for (let y = 0; y < 32; y++) {
        stream.writeUInt8(9)
        stream.writeUInt8(1)
        stream.writeUInt8(y)
        stream.writeUInt8(1)
        stream.writeZigZagVarInt(registry.blocksByName.air.defaultState)
      }
      stream.writeBuffer(Buffer.alloc(256, 18))
      stream.writeUInt8(0)
      const payload = stream.getBuffer()

      const column = new Chunk({ x: 0, z: 0 })
      column.networkDecodeNoCache(payload, 32)

      assert.strictEqual(column.getBlock(new Vec3(0, 0, 0)).name, 'air')
      assert.deepStrictEqual(await column.networkEncodeNoCache(), payload)
    })
  })
}
