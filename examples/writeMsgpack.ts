// stdlib
import { createWriteStream } from 'fs'
import { readFileSync } from 'fs'

import { construct } from '../src/topics.js'
import { deserializing, λevents } from '../src/generation.js'
import { encode } from '@msgpack/msgpack'

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

// write it back to a file using message pack
const fileWriteStream = createWriteStream(process.argv[3])

for await (const rawEvent of loadedEventIterator(loadedEvents.events)) {
  // write this raw event to our msgpack file
  fileWriteStream.write(encode(rawEvent))
}
