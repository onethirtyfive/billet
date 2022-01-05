declare namespace Billet {
  export type UUID = string
  export type Alias = string
  export type Digest = string

  type RequireAtLeastOne<T extends object> = {
    [K in keyof T]-?:
      Required<Pick<T, K>> &
      Partial<Pick<T, Exclude<keyof T, K>>>;
  } [keyof T]

  export type ChecksumAlgorithm = 'md5' | 'sha1'
  export type Checksum = `${ChecksumAlgorithm}:${Digest}`

  interface Settings {
    checksumAlgorithm: ChecksumAlgorithm
  }
  export type Aliases = Record<Alias, UUID>
  export type Relations = Record<UUID, ContingentPaths>
  export type Receipts = Record<UUID, Propagations>

  export interface Snapshot {
    settings: Settings
    aliases: Aliases
    relations: Relations
    receipts: Receipts
  }

  export type ContingentPaths = Map<string, UUID>
  export type Propagations = UUID[]

  export interface Topic {
    alias: Alias
    uuid: UUID
    contingentPaths: ContingentPaths
    propagations: Propagations
  }

  export type ByAlias = Record<Alias, Topic>
  export type ByUUID = Record<UUID, Topic>

  export interface Lookups {
    topicsByAlias: ByAlias
    topicsByUUID: ByUUID
  }

  export interface Traversals {
    propagate: (event: BaseEvent) => Propagations
    validate: () => void
  }

  export type Topics = Lookups & Traversals 

  export interface Document {
    stateVersion: string
    checksums: Checksum[]
    events: BaseEvent[]
  }

  export type PropagatedEventName = string
  export type EventName = MetaEventName | PropagatedEventName

  export interface BaseEvent {
    uuid: UUID
    timestamp: number
    name: string
    context: object
  }

  export type MetaEventName =
    '__billet__.settings:update' |
    '__billet__.graph.topic:upsert' |
    '__billet__:snapshot'

  export interface MetaEvent extends BaseEvent {
    name: MetaEventName
  }

  export interface UpdateSettings extends MetaEvent {
    name: '__billet__.settings:update'
    context: RequireAtLeastOne<Settings>
  }

  export interface UpsertGraphTopic extends MetaEvent {
    name: '__billet__.graph.topic:upsert'
    context: {
      alias: string
      uuid: string
    }
  }

  export interface TakeSnapshot extends MetaEvent {
    name: '__billet__:snapshot'
    context: Snapshot
  }

  export interface PropagatedEvent extends BaseEvent {
    propagations: UUID[]
  }
}
