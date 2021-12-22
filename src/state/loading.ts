import { strict as assert } from 'assert'

function mapWithUniqueConstraint<T, U> (entries: [T, U][]): Map<T, U> {
  return entries.reduce((acc, [key, value]) => {
    assert(!acc.has(key), `key not unique: ${key}`)
    acc.set(key, value)
    return acc
  }, new Map())
}

type InnerEntries<U, V> = [U, V][]
type OuterEntries<T, U, V> = [T, InnerEntries<U, V>][]

function nestedMap<T, U, V> (outerEntries: OuterEntries<T, U, V>) {
  return new Map(
    outerEntries.map(
      ([key, [...innerEntries]]: [T, InnerEntries<U, V>]) =>
        [key, mapWithUniqueConstraint<U, V>(innerEntries)]
    )
  )
}

function load (data: any): Billet.State {
  const {
    checksumAlgorithm,
    expressionEngine,
    aliases,
    propagations,
    caches,
    universe
  } = data

  assert(!!checksumAlgorithm, 'no checksum algorithm')
  assert(!!expressionEngine, 'no expression engine')
  assert(!!aliases, 'no aliases')
  assert(!!propagations, 'no propagations')
  assert(!!caches, 'no caches')
  assert(!!universe, 'no universe')

  const mapAliases = mapWithUniqueConstraint<Billet.Alias, Billet.UUID>(aliases)
  const mapPropagations =
    nestedMap<Billet.UUID, Billet.Predicate, Billet.UUID>(
      Object.entries(propagations)
    )
  const mapCaches =
    nestedMap<Billet.UUID, Billet.UUID, Billet.EntryIndex>(
      Object.entries(caches)
    )

  return {
    checksumAlgorithm: checksumAlgorithm!,
    expressionEngine: expressionEngine!,
    aliases: mapAliases!,
    propagations: mapPropagations!,
    caches: mapCaches!,
    universe: [...universe]!
  }
}

export { load as loadState }
