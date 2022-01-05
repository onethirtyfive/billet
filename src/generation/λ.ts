import { tracing, filtering, taking, mapping } from '../generation'

// in vim, 'λ' is ctrl + k, *, l
function λ<T>(items: AsyncIterable<T>): Billet.λ<T> {
  return {
    filtering: (fnAssess: Billet.FnAssess<T>) =>
      λ(filtering<T>(items, fnAssess)),

    taking: (count: number) => λ(taking<T>(items, count)),

    tracing: function (fnTrace: (event: T) => void) {
      return λ(tracing<T>(items, fnTrace))
    },

    async * [Symbol.asyncIterator]() {
      for await (const item of items)
        yield item
    },

    // n.b. below functions change type context

    result: async function () {
      return await (async () => {
        const items: T[] = []
        for await (const item of this)
          items.push(item as unknown as T)
        return items
      })()
    },

    mapping: <U>(fnApply: Billet.FnApply<T, U>) =>
      λ(mapping<T, U>(items, fnApply))
  }
}

export { λ }
