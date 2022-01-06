import { tracing, filtering, taking, mapping } from '../replay'

export const libSelecting: Billet.LibSelecting = {
  selecting: function<T> (items: AsyncIterable<T>): Billet.Selecting<T> {
    return {
      tracing: (fnTrace) => this.selecting(tracing(items, fnTrace)),
      filtering: (fnAssess) => this.selecting(filtering(items, fnAssess)),
      taking: (count) => this.selecting(taking(items, count)),

      async * [Symbol.asyncIterator]() {
        for await (const item of items)
          yield item
      },

      // n.b. below functions change type context

      result: async function () {
        return await (async () => {
          const items = []
          for await (const item of this)
            items.push(item as unknown as T)
          return items
        })()
      },

      mapping: <U>(fnApply: Billet.FnApply<T, U>) =>
        this.selecting(mapping(items, fnApply))
    }
  }
}
