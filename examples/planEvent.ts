import { createReadStream } from 'fs'
import { decodeMultiStream } from '@msgpack/msgpack'
import readline from 'readline'

import { construct } from '../src/topics.js'
import { streamingMultijson, streamingMsgpack } from '../src/streaming.js'
import { deserializing } from '../src/deserialization.js'
import { λevents } from '../src/generation.js'

const mode = process.argv[2]
const src = createReadStream(`./examples/data/${mode}/events.${mode}`)

let rawEventStream: AsyncIterable<object>

switch (mode) {
  case 'multijson':
    const lineStream =
      readline.createInterface({ input: src, crlfDelay: Infinity })
    rawEventStream = streamingMultijson(lineStream)
    break
  case 'msgpack':
    const msgpackStream = decodeMultiStream(src) as AsyncIterable<BufferSource>
    rawEventStream = streamingMsgpack(msgpackStream)
    break
  default:
    throw new Error(`unknown mode ${mode}`)
}

const snapshotEvents =
  await λevents(deserializing(rawEventStream))
    .filtering(event => event.name === '__billet__:snapshot')
    .taking(1)
    .result() as Billet.TakeSnapshot[]

const topics = construct(snapshotEvents.pop()!.context)

const plan = topics.plan(
  {
    "uuid": "a4e361d4-7300-46a7-a14e-69a7870c6db4",
    "name": "anticipation.patch",
    "timestamp": 1640412156411,
    "context": {
      "name": "Lindsey Repayment (1 of 3)",
      "eventuality": "imminent",
      "amount": 400.00
    },
    "propagations": []
  } as Billet.PropagatedEvent
)

console.log(plan)
