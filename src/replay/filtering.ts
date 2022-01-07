import { libReplay } from '../replay'

export const libFiltering: Billet.LibFiltering = {
  filtering: function<T> (items: AsyncIterable<T>): Billet.Filtering<T> {
    return {
      tracing: (fnTrace) =>
        this.filtering(libReplay.tracing(items, fnTrace)),
      predicating: (fnAssess) =>
        this.filtering(libReplay.predicating(items, fnAssess)),
      taking: (count) =>
        this.filtering(libReplay.taking(items, count)),

      async * [Symbol.asyncIterator]() {
        for await (const item of items)
          yield item
      },

      // n.b. below functions change type context

      result: async function () {
        const items = []
        for await (const item of this)
          items.push(item as unknown as T)
        return items
      }
    }
  }
}
