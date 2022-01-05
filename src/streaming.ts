import { strict as assert } from 'assert'

// n.b. generic because they will be used for both events and checksums

function streamingMsgpack<T>(iterable: AsyncIterable<BufferSource>): AsyncIterable<T> {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of iterable) {
        assert(typeof item === 'object', `not an object: ${item}`)
        yield item as any as T
      }
    }
  }
}

function streamingMultijson<T>(iterable: AsyncIterable<string>): AsyncIterable<T> {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const line of iterable) {
        if (line.length > 0) {
          const parsed = JSON.parse(line)
          assert(typeof parsed === 'object', `not an object: ${parsed}`)
          yield parsed as T
        }
      }
    }
  }
}

export { streamingMsgpack, streamingMultijson }
