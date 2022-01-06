declare namespace Billet {
  type FnTrace<T> = (event: T) => void
  type FnAssess<T> = (item: T) => boolean
  type FnDeserialize<T extends BaseEvent> = (source: unknown) => T
  type FnApply<T, U> = (item: T) => U

  export interface Selecting<T> {
    filtering: (fnAssess: FnAssess<T>) => Awaited<Selecting<T>>
    taking: (count: number) => Awaited<Selecting<T>>
    tracing: (fnTrace: FnTrace<T>) => Awaited<Selecting<T>>
    [Symbol.asyncIterator](): AsyncGenerator<T>

    // n.b. all below exit the current λEvents context
    result: () => Promise<T[]>

    // TODO this doesn't belong here
    mapping: <U>(fnApply: FnApply<T, U>) => Awaited<Selecting<U>>
  }

  export interface SelectingEvents {
    filtering: (fnAssess: FnAssess<AnyEvent>) => Awaited<SelectingEvents>
    taking: (count: number) => Awaited<SelectingEvents>
    tracing: (fnTrace: FnTrace<AnyEvent>) => Awaited<SelectingEvents>
    onlyMetaEvents: (count?: number) => Awaited<SelectingEvents>
    onlyTakeSnapshotEvents: (count?: number) => Awaited<SelectingEvents>
    since: (epoch: number) => Awaited<SelectingEvents>
    after: (epoch: number) => Awaited<SelectingEvents>
    before: (epoch: number) => Awaited<SelectingEvents>
    until: (epoch: number) => Awaited<SelectingEvents>
    only: (query: string) => Awaited<SelectingEvents>
    except: (query: string) => Awaited<SelectingEvents>
    [Symbol.asyncIterator](): AsyncGenerator<AnyEvent>

    // n.b. all below exit the current λEvents context
    result: () => Promise<AnyEvent[]>

    // TODO this doesn't belong here
    mapping: <T>(fnApply: FnApply<AnyEvent, T>) => Awaited<Selecting<T>>
  }

  type AnyEvent = MetaEvent | PropagatedEvent

  export interface DeserializingEvents {
    deserializers: Record<MetaEventName, (source: unknown) => MetaEvent>
    selecting: () => SelectingEvents
    [Symbol.asyncIterator](): AsyncGenerator<AnyEvent>
  }

  export interface Streaming extends AsyncIterable<object> {
    deserializingEvents: () => DeserializingEvents
    [Symbol.asyncIterator](): AsyncGenerator<object>
  }

  export interface LibSelecting {
    selecting: <T>(items: AsyncIterable<T>) => Selecting<T>
  }

  export interface LibSelectingEvents {
    selectingEvents: (events: AsyncIterable<AnyEvent>) => SelectingEvents
  }

  export interface LibDeserializing {
    deserializingEvents: (source: AsyncIterable<object>) => DeserializingEvents
  }

  export interface LibStreaming {
    streamingMultijson: (iterable: AsyncIterable<string>) => Streaming
    streamingMsgpack: (iterable: AsyncIterable<BufferSource>) => Streaming
  }
}
