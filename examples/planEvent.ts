import { createReadStream } from 'fs'
import { decodeMultiStream } from '@msgpack/msgpack'
import readline from 'readline'

import { libRuntime } from '../src/runtime'
import { libStreaming } from '../src/replay/streaming'

async function main(mode: string) {
  const src = createReadStream(`./examples/data/${mode}/events.${mode}`)

  let serialEventStream

  switch (mode) {
    case 'multijson':
      const lineStream =
        readline.createInterface({ input: src, crlfDelay: Infinity })
      serialEventStream = libStreaming.streamingMultijson(lineStream)
      break
    case 'msgpack':
      const msgpackStream = decodeMultiStream(src) as AsyncIterable<BufferSource>
      serialEventStream = libStreaming.streamingMsgpack(msgpackStream)
      break
    default:
      throw new Error(`unknown mode ${mode}`)
  }

  console.log('\nEvents encountered during replay:')
  const potentiallyAllDeserializedEvents = serialEventStream.deserializingEvents()
  const desiredTakeSnapshotEvents =
    await potentiallyAllDeserializedEvents.filtering()
      .tracing(event => console.log(' ' + event.name))
      .onlyTakeSnapshotEvents(1)
      .result() as Billet.TakeSnapshot[]

  const firstTakeSnapshotEvent = desiredTakeSnapshotEvents.pop()!
  const runtime = libRuntime.bootstrap(firstTakeSnapshotEvent.context)

  console.log('\nExample event to plan:')
  const eventToPlan = 
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
  console.log(eventToPlan)

  console.log('\nPropagations planned:')
  const plan = runtime.plan(eventToPlan)
  console.log([...plan].map(uuid => runtime.topicsByUUID.get(uuid)!.alias))

  console.log()
}

main(process.argv[2])
