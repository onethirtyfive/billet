import { createReadStream, createWriteStream } from 'fs'
import { encode } from '@msgpack/msgpack'
import readline from 'readline'

import { streamingMultijson } from '../src/streaming'

async function main () {
  const src = createReadStream(`./examples/data/multijson/events.multijson`)
  const dst = createWriteStream(`./examples/data/msgpack/events.msgpack`)
  const lineStream = readline.createInterface({ input: src, crlfDelay: Infinity })
  const rawEventStream = streamingMultijson(lineStream) as AsyncIterable<object>

  for await (const rawEvent of rawEventStream)
    dst.write(encode(rawEvent))
}

main()
