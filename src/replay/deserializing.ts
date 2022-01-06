import { strict as assert } from 'assert'

import { libSelectingEvents } from './selectingEvents'

export const libDeserializing: Billet.LibDeserializing = {
  deserializingEvents: function (source): Billet.DeserializingEvents {
    return {
      // n.b. caller must destroy underlying resource after use (e.g. read stream), if
      //      applicable, as this iterable will frequently leave unconsumed data
      deserializers: {
        '__billet__.settings:update':
          source => source as Billet.UpdateSettings,

        '__billet__.graph.topic:upsert':
          source => source as Billet.UpsertGraphTopic,

        // n.b. To be JSON-compatible, the snapshot's relations are serialized as
        //      Record<UUID,[Criterion, UUID][]>. We must transform this into the
        //      more usable Record<UUID, Map<Criterion, UUID>> type at runtime for:
        //        1. guaranteed iteration in insertion order, which enables
        //        2. deterministically-ordered event propagations
        '__billet__:snapshot': source => {
          const serializedRepresentation = source as Billet.TakeSnapshot

          // TODO: assert other properties of serialized representation object
          assert(
            typeof serializedRepresentation === 'object',
            `serialized representation not an object: ${serializedRepresentation}`
          )

          const relationsRepr = Object.fromEntries(
            Object
              .entries(serializedRepresentation.context.relations)
              .map(([topicUUID, entries]) => [topicUUID, new Map(entries)]
            )
          )

          return {
            ...serializedRepresentation,
            name: '__billet__:snapshot',
            context: {
              ...serializedRepresentation.context,
              relations: relationsRepr
            }
          }
        }
      },

      selecting: function () {
        return libSelectingEvents.selectingEvents(this)
      },

      async * [Symbol.asyncIterator](): AsyncGenerator<Billet.AnyEvent> {
        for await (const item of source) {
          assert(typeof item === 'object', `item not an object: ${item}`)
          const name = (item as any)['name'] as Billet.EventName | undefined

          assert(typeof name == 'string', `no string value at 'name': ${item}`)
          switch (name) {
            case '__billet__.settings:update':
            case '__billet__.graph.topic:upsert':
            case '__billet__:snapshot':
              yield this.deserializers[name](item) as Billet.MetaEvent
              break
            default:
              yield item as Billet.PropagatedEvent
              break
          }
        }
      }
    }
  }
}
