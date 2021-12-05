import { strict as assert } from 'assert'

// LOM: Log Object Model
// After a "lom" is loaded from persistence, developers may change it in-memory.
// These changes only last between processes when persisted.

const mapWithUniqueConstraint = entries => {
  return entries.reduce((acc, [key, value]) => {
    assert(!acc.has(key), `key not unique: ${key}`)
    acc.set(key, value)
    return acc
  }, new Map())
}

const nestedMap = entries => {
  return new Map(
    [...entries].map(
      ([uuid, [...entries]]) => [uuid, mapWithUniqueConstraint(entries)]
    )
  )
}

const make = ({ aliases, downstreams, caches, entries }) => {
  assert(!!aliases, 'no aliases')
  assert(!!downstreams, 'no downstreams')
  assert(!!caches, 'no caches')
  assert(!!entries, 'no entries')

  return {
    aliases: mapWithUniqueConstraint(aliases),
    downstreams: nestedMap(Object.entries(downstreams)),
    caches: nestedMap(Object.entries(caches)),
    entries: mapWithUniqueConstraint(entries)
  }
}

export { make as mkLOM }
