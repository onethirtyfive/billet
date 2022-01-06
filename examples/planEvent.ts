import { createReadStream } from 'fs'
import { decodeMultiStream } from '@msgpack/msgpack'
import readline from 'readline'

import { bootstrap } from '../src/runtime'
import { streamingMultijson, streamingMsgpack } from '../src/replay/streaming'

async function main(mode: string) {
  const src = createReadStream(`./examples/data/${mode}/events.${mode}`)

  let rawEventStream

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

  console.log('\nAll events encountered...')
  const potentiallyAllDeserializedEvents = rawEventStream.deserializing()
  const desiredTakeSnapshotEvents =
    await potentiallyAllDeserializedEvents.λ()
      .tracing(event => console.log(' ' + event.name))
      .onlyTakeSnapshotEvents(1)
      .result() as Billet.TakeSnapshot[]

  const firstTakeSnapshotEvent = desiredTakeSnapshotEvents.pop()!
  const runtime = bootstrap(firstTakeSnapshotEvent.context)

  console.log('\nFirst snapshot...')
  Object.entries(firstTakeSnapshotEvent.context.relations).forEach(([k, v]) => {
    console.log(` Relations for '${runtime.topicsByUUID[k].alias}':`)
    if (v.size > 0) {
      const aliased =
        [...v.values()].map(uuid => runtime.topicsByUUID[uuid].alias)
      console.log('  ' + [...v.keys()] + ' > ' + aliased.join(' | '))
    }
    else {
      console.log('  (none)')
    }
  })

  console.log('\nEvent to plan...')
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

  console.log('\nPlanned propagations...')
  const plan = runtime.plan(eventToPlan)
  console.log(plan.map(uuid => runtime.topicsByUUID[uuid].alias))

  console.log()
}

main(process.argv[2])
