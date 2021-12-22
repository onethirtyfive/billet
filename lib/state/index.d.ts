declare namespace Billet {
  export type Aliases = Map<Alias, UUID> // uuid designates topic

  export type ChecksumAlgorithm = 'sha1' | 'md5'
  export type ExpressionEngine = 'jsonata'

  export type Predicate = string // designates jsonata query
  export type Predicates = Map<Predicate, UUID> // predicate gatekeeps propagation topic
  export type Propagations = Map<UUID, Predicates> // uuid designates upstream topic

  export type EntryIndex = number
  export type Cache = Map<UUID, EntryIndex> // uuid designates event
  export type Caches = Map<UUID, Cache> // uuid designates topic

  export type Checksum = string
  export type Entry = [Checksum, Event]
  export type Universe = Entry[]

  export interface Revision {
    define: (alias: Alias, uuid?: UUID) => Revision
    realias: (alias: Alias, newAlias: Alias) => Revision
    propagate: (from: Alias, to: Alias, predicate: Predicate) => Revision
    done: () => State
  }

  export interface State {
    readonly checksumAlgorithm: ChecksumAlgorithm
    readonly expressionEngine: ExpressionEngine
    readonly aliases: Aliases
    readonly propagations: Propagations
    readonly caches: Caches
    readonly universe: Universe
  }
}