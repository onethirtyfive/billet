import {
  deserializeMetaEvent,
  deserializePropagatedEvent
} from './deserialization.js'

function deserializing (source: AsyncIterable<object>) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of source) {
        const name = (item as any)['name']
        switch (name) {
          case '__billet__.settings:update':
          case '__billet__.graph.topic:upsert':
          case '__billet__:snapshot':
            yield deserializeMetaEvent(name, item) as Billet.MetaEvent
            break
          default:
            yield deserializePropagatedEvent(item) as Billet.BaseEvent
            break
        }
      }
    }
  }
}

type FnAssess<T> = (item: T) => boolean

function filtering<T> (source: AsyncIterable<T>, fnAssess: FnAssess<T>) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of source)
        if (!!fnAssess(item))
          yield item
    }
  }
}

function taking<T> (source: AsyncIterable<T>, count: number) {
  return {
    async * [Symbol.asyncIterator]() {
      let taken = 0
      for await (const item of source) {
        if (taken < count) {
          yield item
          taken = taken + 1
        } else break
      }
    }
  }
}

type FnApply<T, U> = (item: T) => U

function mapping<T, U> ( 
  source: AsyncIterable<T>,
  fnApplying: FnApply<T, U>
) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of source)
        yield fnApplying(item)
    }
  }
}

// n.b.:
//   All events in the log MUST, at a minimum:
//     1. be of a type which extends Billet.BasicEvent, which requires that they
//     2. have a `name` field; furthermore,
//     3. `name` must not start with the string `__billet__`
//
//   Additionally, all app events are propagated through the topics graph, so
//   their shape MUST extend Billet.PropagatedEvent.
//
//   Developers are free to use their own derived type hierarchies, so long as
//   they meet these requirements. Since Typescript types are not accessible at
//   runtime, and since interpretation of the type is contingent on its `name`,
//   some runtime casting accommodations (and leaps of faith) are required.
//
//   The below function is a low-overhead nod and accommodation to the above.
//   Billet consumers SHOULD use this over performing their own casting.
//
//   Any validation of the post-cast event's contents' is also up to the app.
function casting<T, U extends T> (source: AsyncIterable<T>) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of source)
        yield item as unknown as U
    }
  }
}

// in vim, 'λ' is ctrl + k, *, l
function λ<T>(items: AsyncIterable<T>) {
  return {
    filtering: (fnAssess: FnAssess<T>) => λ(filtering<T>(items, fnAssess)),
    taking: (count: number) => λ(taking<T>(items, count)),
    mapping: <U>(fnApply: FnApply<T, U>) => λ(mapping<T, U>(items, fnApply)),

    result: async function () {
      await (async () => {
        const promises = []
        for await (const event of this)
          promises.push(event as T)
        return promises
      })()
    },

    async * [Symbol.asyncIterator]() {
      for await (const item of items)
        yield item
    }
  }
}

function λevents<T extends Billet.BaseEvent>(events: AsyncIterable<T>) {
  return {
    filtering: (fnAssess: FnAssess<Billet.BaseEvent>) =>
      λevents(filtering<Billet.BaseEvent>(events, fnAssess)),
    taking: (count: number) =>
      λevents(taking<Billet.BaseEvent>(events, count)),

    // n.b. exit events lambda context
    mapping: <U>(fnApply: FnApply<Billet.BaseEvent, U>) =>
      λ(mapping<Billet.BaseEvent, U>(events, fnApply)),

    result: async function (): Promise<T[]> {
      return await (async () => {
        const events: T[] = []
        for await (const event of this)
          events.push(event as unknown as T)
        return events
      })()
    },

    async * [Symbol.asyncIterator]() {
      for await (const event of events)
        yield event as T
    }
  }
}

export { deserializing, λ, λevents }
