import jsonata from 'jsonata'

import { libReplay } from '../replay'

export const libFilteringEvents: Billet.LibFilteringEvents = {
  filteringEvents: function (events): Billet.FilteringEvents {
    return {
      predicating: (fnAssess) =>
        this.filteringEvents(libReplay.predicating(events, fnAssess)),

      taking: (count) =>
        this.filteringEvents(libReplay.taking(events, count)),

      tracing: (fnTrace) =>
        this.filteringEvents(libReplay.tracing(events, fnTrace)),

      onlyMetaEvents: function(count: number | undefined = undefined) {
        const basis =
          this.predicating((event) => event.name.startsWith('__billet__'))

        return (count !== undefined)
          ? basis.taking(count)
          : basis
      },

      onlyTakeSnapshotEvents: function(count: number | undefined = undefined) {
        const basis =
          this.predicating((event) => event.name === '__billet__:snapshot')

        return (count !== undefined)
          ? basis.taking(count)
          : basis
      },

      since: function (epoch: number) {
        return this.predicating((event) => event.timestamp >= epoch)
      },

      after: function (epoch: number) {
        return this.predicating((event) => event.timestamp > epoch)
      },

      before: function (epoch: number) {
        return this.predicating((event) => event.timestamp < epoch)
      },

      until: function (epoch: number) {
        return this.predicating((event) => event.timestamp <= epoch)
      },

      only: function (query: string) {
        return this.predicating((event) => !!jsonata(query).evaluate(event))
      },

      except: function (query: string) {
        return this.predicating((event) => !jsonata(query).evaluate(event))
      },

      async * [Symbol.asyncIterator]() {
        for await (const event of events)
          yield event as Billet.AnyEvent
      },

      // n.b. below functions change type context

      result: async function () {
        const events = []
        for await (const event of this)
          events.push(event as unknown as Billet.AnyEvent)
        return events
      }
    }
  }
}
