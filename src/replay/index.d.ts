declare namespace Billet {
  type FnTrace<T> = (event: T) => void
  type FnAssess<T> = (item: T) => boolean
  type FnDeserialize<T extends BaseEvent> = (source: unknown) => T
  type FnApply<T, U> = (item: T) => U

  export interface Filtering<T> {
    predicating: (fnAssess: FnAssess<T>) => Awaited<Filtering<T>>
    taking: (count: number) => Awaited<Filtering<T>>
    tracing: (fnTrace: FnTrace<T>) => Awaited<Filtering<T>>
    [Symbol.asyncIterator](): AsyncGenerator<T>

    result: () => Promise<T[]>
  }

  export interface FilteringEvents {
    predicating: (fnAssess: FnAssess<AnyEvent>) => Awaited<FilteringEvents>
    taking: (count: number) => Awaited<FilteringEvents>
    tracing: (fnTrace: FnTrace<AnyEvent>) => Awaited<FilteringEvents>
    onlyMetaEvents: (count?: number) => Awaited<FilteringEvents>
    onlyTakeSnapshotEvents: (count?: number) => Awaited<FilteringEvents>
    since: (epoch: number) => Awaited<FilteringEvents>
    after: (epoch: number) => Awaited<FilteringEvents>
    before: (epoch: number) => Awaited<FilteringEvents>
    until: (epoch: number) => Awaited<FilteringEvents>
    only: (query: string) => Awaited<FilteringEvents>
    except: (query: string) => Awaited<FilteringEvents>
    [Symbol.asyncIterator](): AsyncGenerator<AnyEvent>

    result: () => Promise<AnyEvent[]>
  }

  type AnyEvent = MetaEvent | PropagatedEvent

  export interface DeserializingEvents {
    deserializers: Record<MetaEventName, (source: SerialEvent) => MetaEvent>
    filtering: () => FilteringEvents
    [Symbol.asyncIterator](): AsyncGenerator<AnyEvent>
  }

  export interface Streaming extends AsyncIterable<object> {
    deserializingEvents: () => DeserializingEvents
    [Symbol.asyncIterator](): AsyncGenerator<object>
  }

  interface SerialSettings {
    checksumAlgorithm: ChecksumAlgorithm
  }

  interface SerialAliases {
    [key: string]: UUID
  }

  interface SerialContingentPaths {
    [key: Criterion]: UUID[]
  }

  interface SerialRelations {
    [key: UUID]: SerialContingentPaths
  }

  interface SerialReceipts {
    [key: UUID]: UUID[]
  }

  interface SerialSnapshot {
    settings: SerialSettings
    aliases: SerialAliases
    relations: SerialRelations
    receipts: SerialReceipts
  }

  interface SerialEvent {
    uuid: Billet.UUID
    timestamp: number
    name: string
    context: object
  }
}
