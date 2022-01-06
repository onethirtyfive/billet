import { strict as assert } from 'assert'
import { libDeserializing } from './deserializing'

// n.b. generic because they will be used for both events and checksums

export const libStreaming: Billet.LibStreaming = {
  streamingMsgpack: function (iterable) {
    return {
      deserializingEvents: function () {
        return libDeserializing.deserializingEvents(this)
      },

      async * [Symbol.asyncIterator]() {
        for await (const item of iterable) {
          assert(typeof item === 'object', `not an object: ${item}`)
          yield item as object
        }
      }
    }
  },

  streamingMultijson: function (iterable: AsyncIterable<string>) {
    return {
      deserializingEvents: function () {
        return libDeserializing.deserializingEvents(this)
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
}