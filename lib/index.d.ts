declare namespace Billet {
  export type UUID = string
  export type Alias = string

  export interface Topic {
    readonly uuid: Billet.UUID
    readonly predicates: Predicates
    readonly cache: Cache
  }

  export interface Lookups {
    byAlias: Map<Alias, Topic>
    byUUID: Map<UUID, Topic>
  }

  export type Plan = Set<Topic>

  export interface Traversals {
    validate: () => void,
    plan: (event: Event) => Plan
  }

  export type Topics = Lookups & Traversals

  export interface Context {
    readonly [key: string]: any
  }

  export interface Event {
    readonly uuid: UUID
    readonly timestamp: number
    readonly event: string
    readonly context: Context
  }
}
