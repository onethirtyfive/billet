declare namespace Billet {
  export interface LibReplay {
    tracing: <T>(source: AsyncIterable<T>, fnTrace: FnTrace<T>) =>
      AsyncIterable<T>
    filtering: <T>(source: AsyncIterable<T>, fnAssess: FnAssess<T>) =>
      AsyncIterable<T>
    taking: <T>(source: AsyncIterable<T>, count: number) =>
      AsyncIterable<T>
  }

  export interface LibMapping {
    mapping: <T,U>(source: AsyncIterable<T>, fnApplying: FnApply<T, U>) =>
      AsyncIterable<U>
  }

  export interface LibFiltering {
    filtering: <T>(items: AsyncIterable<T>) => Filtering<T>
  }

  export interface LibFilteringEvents {
    filteringEvents: (events: AsyncIterable<AnyEvent>) => FilteringEvents
  }

  export interface LibDeserializing {
    deserializingEvents: (source: AsyncIterable<object>) => DeserializingEvents
  }

  export interface LibStreaming {
    streamingMultijson: (iterable: AsyncIterable<string>) => Streaming
    streamingMsgpack: (iterable: AsyncIterable<BufferSource>) => Streaming
  }
}
