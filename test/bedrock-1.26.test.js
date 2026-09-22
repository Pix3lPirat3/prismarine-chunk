/* eslint-env mocha */
// Regression: bedrock 1.26 had no chunk implementation mapped (dispatch stopped at 1.21), so
// require('prismarine-chunk')(<bedrock 1.26 registry>) threw. The subchunk format is unchanged since 1.18, so 1.26 uses
// the shared bedrock/1.18/chunk. Validates construct + set/get + a toJson/fromJson round-trip on bedrock_1.26.45.
const assert = require('assert')
const { Vec3 } = require('vec3')

describe('bedrock 1.26 chunk implementation', () => {
  const registry = require('prismarine-registry')('bedrock_1.26.45')
  const ChunkColumn = require('prismarine-chunk')(registry)

  it('resolves an implementation for bedrock 1.26', () => {
    assert.strictEqual(typeof ChunkColumn, 'function')
  })

  it('stores and reads block state ids, and survives a toJson/fromJson round-trip', () => {
    const column = new ChunkColumn({ x: 0, z: 0 })
    const stone = registry.blocksByName.stone.defaultState
    const cobble = registry.blocksByName.cobblestone.defaultState
    column.setBlockStateId(new Vec3(3, 70, 5), stone)
    column.setBlockStateId(new Vec3(4, 70, 5), cobble)
    assert.strictEqual(column.getBlock(new Vec3(3, 70, 5)).name, 'stone')

    const restored = ChunkColumn.fromJson(column.toJson())
    assert.strictEqual(restored.getBlock(new Vec3(3, 70, 5)).name, 'stone')
    assert.strictEqual(restored.getBlock(new Vec3(4, 70, 5)).name, 'cobblestone')
  })
})
