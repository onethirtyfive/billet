import { strict as assert } from 'assert'

import { libFilteringEvents } from './filteringEvents'

export const libDeserializing: Billet.LibDeserializing = {
  deserializingEvents: function (source): Billet.DeserializingEvents {
    return {
      // n.b. caller must destroy underlying resource after use (e.g. read stream), if
      //      applicable, as this iterable will frequently leave unconsumed data
      deserializers: {
        '__billet__.settings:update':
          // TODO: assert other properties of serialized representation object
          serialEvent => serialEvent as Billet.UpdateSettings,

        '__billet__.graph.topic:upsert':
          // TODO: assert other properties of serialized representation object
          serialEvent => serialEvent as Billet.UpsertGraphTopic,

        // n.b. To be JSON-compatible, the snapshot's relations are serialized as
        //      Record<UUID,[Criterion, UUID][]>. We must transform this into the
        //      more usable Record<UUID, Map<Criterion, UUID>> type at runtime for:
        //        1. guaranteed iteration in insertion order, which enables
        //        2. deterministically-ordered event propagations
        '__billet__:snapshot': function (serialEvent: Billet.SerialEvent) {
          const snapshot = serialEvent.context as Billet.SerialSnapshot

          assert(
            typeof serialEvent === 'object',
            `serialized representation not an object: ${serialEvent}`
          )

          // TODO: validate data
          const settings = new Map(Object.entries(snapshot.settings).sort())
          const aliases = new Map(Object.entries(snapshot.aliases).sort())
          const relations = new Map(
            Object.entries(snapshot.relations)
              .sort()
              .map(([uuid, contingentPaths]) =>
                [uuid, new Map(Object.entries(contingentPaths).sort())]
            )
          )
          const receipts = new Map(
            Object.entries(snapshot.receipts)
              .sort() // by topic uuid
              .map(([uuid, receipts]) => [uuid, new Set(receipts)])
          )

          return {
            uuid: serialEvent.name as Billet.UUID,
            timestamp: serialEvent.timestamp as number,
            name: '__billet__:snapshot',
            context: { settings, aliases, relations, receipts }
          }
        }
      },

      filtering: function () {
        return libFilteringEvents.filteringEvents(this)
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
              yield this.deserializers[name](item as Billet.SerialEvent) as Billet.MetaEvent
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
