export const libMapping: Billet.LibMapping = {
  mapping: <T, U>(
    source: AsyncIterable<T>,
    fnApplying: Billet.FnApply<T, U>
  ) => {
    return {
      async * [Symbol.asyncIterator]() {
        for await (const item of source)
          yield fnApplying(item)
      }
    }
  }
}
