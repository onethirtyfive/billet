import jsonata from 'jsonata'

import { tracing, filtering, taking, mapping } from '../replay'
import { λ } from './selecting'

function λevents<T extends Billet.BaseEvent>(
  events: AsyncIterable<T>
): Billet.λEvents<T> {
  return {
    filtering: function (fnAssess: Billet.FnAssess<T>) {
      return λevents(filtering<T>(events, fnAssess))
    },

    taking: function (count: number) {
      return λevents(taking<T>(events, count))
    },

    tracing: function (fnTrace: (event: T) => void) {
      return λevents(tracing<T>(events, fnTrace))
    },

    onlyMetaEvents: function(count: number | undefined = undefined) {
      const basis =
        this.filtering((event: T) => event.name.startsWith('__billet__'))

      return (count !== undefined)
        ? basis.taking(count)
        : basis
    },

    onlyTakeSnapshotEvents: function(count: number | undefined = undefined) {
      const basis =
        this.filtering((event: T) => event.name === '__billet__:snapshot')

      return (count !== undefined)
        ? basis.taking(count)
        : basis
    },

    since: function (epoch: number) {
      return this.filtering((event: T) => event.timestamp >= epoch)
    },

    after: function (epoch: number) {
      return this.filtering((event: T) => event.timestamp > epoch)
    },

    before: function (epoch: number) {
      return this.filtering((event: T) => event.timestamp < epoch)
    },

    until: function (epoch: number) {
      return this.filtering((event: T) => event.timestamp <= epoch)
    },

    only: function (query: string) {
      return this.filtering((event: T) => !!jsonata(query).evaluate(event))
    },

    except: function (query: string) {
      return this.filtering((event: T) => !jsonata(query).evaluate(event))
    },

    async * [Symbol.asyncIterator]() {
      for await (const event of events)
        yield event as T
    },

    // n.b. below functions change type context

    result: async function () {
      return await (async () => {
        const events: T[] = []
        for await (const event of this)
          events.push(event as unknown as T)
        return events
      })()
    },

    mapping: function<U> (fnApply: Billet.FnApply<T, U>) {
      return λ(mapping<T, U>(events, fnApply))
    }
  }
}

export { λevents }
