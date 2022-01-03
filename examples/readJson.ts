// stdlib
import { readFileSync } from 'fs'

import { construct } from '../src/topics.js'
import { deserializing, λevents } from '../src/generation.js'

interface RawEvent {
  name: Billet.EventName
}

interface EventProvider {
  events: RawEvent[]
}

const loadedEvents: EventProvider =
  JSON.parse(readFileSync(process.argv[2]).toString())

function loadedEventIterator(rawEvents: RawEvent[]) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const rawEvent of rawEvents)
        yield rawEvent
    }
  }
}

const snapshotEvents =
  await λevents(deserializing(loadedEventIterator(loadedEvents.events)))
    .filtering(event => event.name === '__billet__:snapshot')
    .taking(1)
    .result() as Billet.TakeSnapshot[]

const snapshot = snapshotEvents.pop()!.context
const topics = construct(snapshot)
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
