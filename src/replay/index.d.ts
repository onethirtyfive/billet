declare namespace Billet {
  type FnAssess<T> = (item: T) => boolean
  type FnTrace<T> = (event: T) => void
  type FnApply<T, U> = (item: T) => U

  type Awaitedλ<T> = λ<Awaited<T>>

  export interface λ<T> {
    filtering: (fnAssess: FnAssess<T>) => Awaitedλ<T>
    taking: (count: number) => Awaitedλ<T>
    tracing: (fnTrace: FnTrace<T>) => Awaitedλ<T>
    [Symbol.asyncIterator](): AsyncGenerator<T>

    // n.b. all below exit the current λEvents context
    result: () => Promise<T[]>
    mapping: <U>(fnApply: FnApply<T, U>) => Awaitedλ<U>
  }

  type AwaitedλEvents<T> = λEvents<Awaited<T>>

  export interface λEvents<T> {
    filtering: (fnAssess: FnAssess<T>) => AwaitedλEvents<T>
    taking: (count: number) => AwaitedλEvents<T>
    tracing: (fnTrace: FnTrace<T>) => AwaitedλEvents<T>
    onlyMetaEvents: (count?: number) => AwaitedλEvents<T>
    onlyTakeSnapshotEvents: (count?: number) => AwaitedλEvents<T>
    since: (epoch: number) => AwaitedλEvents<T>
    after: (epoch: number) => AwaitedλEvents<T>
    before: (epoch: number) => AwaitedλEvents<T>
    until: (epoch: number) => AwaitedλEvents<T>
    only: (query: string) => AwaitedλEvents<T>
    except: (query: string) => AwaitedλEvents<T>
    [Symbol.asyncIterator](): AsyncGenerator<T>

    // n.b. all below exit the current λEvents context
    result: () => Promise<T[]>
    mapping: <U>(fnApply: FnApply<T, U>) => Awaitedλ<U>
  }
}
