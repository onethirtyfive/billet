import jsonata from 'jsonata'

import { tracing, filtering, taking, mapping } from '../replay'
import { libSelecting } from './selecting'

export const libSelectingEvents: Billet.LibSelectingEvents = {
  selectingEvents: function (events): Billet.SelectingEvents {
    return {
      filtering: function (fnAssess) {
        return libSelectingEvents.selectingEvents(filtering(events, fnAssess))
      },

      taking: function (count: number) {
        return libSelectingEvents.selectingEvents(taking(events, count))
      },

      tracing: function (fnTrace) {
        return libSelectingEvents.selectingEvents(tracing(events, fnTrace))
      },

      onlyMetaEvents: function(count: number | undefined = undefined) {
        const basis =
          this.filtering((event) => event.name.startsWith('__billet__'))

        return (count !== undefined)
          ? basis.taking(count)
          : basis
      },

      onlyTakeSnapshotEvents: function(count: number | undefined = undefined) {
        const basis =
          this.filtering((event) => event.name === '__billet__:snapshot')

        return (count !== undefined)
          ? basis.taking(count)
          : basis
      },

      since: function (epoch: number) {
        return this.filtering((event) => event.timestamp >= epoch)
      },

      after: function (epoch: number) {
        return this.filtering((event) => event.timestamp > epoch)
      },

      before: function (epoch: number) {
        return this.filtering((event) => event.timestamp < epoch)
      },

      until: function (epoch: number) {
        return this.filtering((event) => event.timestamp <= epoch)
      },

      only: function (query: string) {
        return this.filtering((event) => !!jsonata(query).evaluate(event))
      },

      except: function (query: string) {
        return this.filtering((event) => !jsonata(query).evaluate(event))
      },

      async * [Symbol.asyncIterator]() {
        for await (const event of events)
          yield event as Billet.AnyEvent
      },

      // n.b. below functions change type context

      result: async function () {
        return await (async () => {
          const events = []
          for await (const event of this)
            events.push(event as unknown as Billet.AnyEvent)
          return events
        })()
      },

      mapping: function<T> (fnApply: Billet.FnApply<Billet.AnyEvent, T>) {
        return libSelecting.selecting<T>(mapping(events, fnApply))
      }
    }
  }
}
