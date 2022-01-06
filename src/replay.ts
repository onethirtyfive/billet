import { strict as assert } from 'assert'

function tracing<T> (
  source: AsyncIterable<T>,
  fnTrace: Billet.FnTrace<T>
) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of source) {
        fnTrace(item)
        yield item
      }
    }
  }
}

function filtering<T> (source: AsyncIterable<T>, fnAssess: Billet.FnAssess<T>) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of source)
        if (!!fnAssess(item))
          yield item
    }
  }
}

function taking<T> (source: AsyncIterable<T>, count: number) {
  assert(typeof count === 'number' && count > 0)

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

function mapping<T, U> ( 
  source: AsyncIterable<T>,
  fnApplying: Billet.FnApply<T, U>
) {
  return {
    async * [Symbol.asyncIterator]() {
      for await (const item of source)
        yield fnApplying(item)
    }
  }
}

export { tracing, filtering, taking, mapping }
