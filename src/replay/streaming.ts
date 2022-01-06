import { strict as assert } from 'assert'
import { deserializing } from './deserialization'

// n.b. generic because they will be used for both events and checksums

function streamingMsgpack(iterable: AsyncIterable<BufferSource>) {
  return {
    deserializing: function () {
      return deserializing(this)
    },

    async * [Symbol.asyncIterator]() {
      for await (const item of iterable) {
        assert(typeof item === 'object', `not an object: ${item}`)
        yield item
      }
    }
  }
}

function streamingMultijson(iterable: AsyncIterable<string>) {
  return {
    deserializing: function () {
      return deserializing(this)
    },

    async * [Symbol.asyncIterator]() {
      for await (const line of iterable) {
        if (line.length > 0) {
          const parsed = JSON.parse(line)
          assert(typeof parsed === 'object', `not an object: ${parsed}`)
          yield parsed
        }
      }
    }
  }
}

export { streamingMsgpack, streamingMultijson }
