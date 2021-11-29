import { strict as assert } from 'assert'

const ingesting = ({ aliases, downstreams, caches }) => {
  assert(!!aliases, 'no aliases')
  assert(!!downstreams, 'no downstreams')
  assert(!!caches, 'no caches')

  const mapWithUniqueConstraint = entries => {
    return entries.reduce((acc, [key, value]) => {
      assert(!acc.has(key), `key not unique: ${key}`)
      acc.set(key, value)
      return acc
    }, new Map())
  }

  const nestedMap = (entries) => {
    return new Map(
      [...entries].map(
        ([uuid, [...entries]]) => [uuid, mapWithUniqueConstraint(entries)]
      )
    )
  }

  return {
    aliases: mapWithUniqueConstraint(aliases),
    downstreams: nestedMap(Object.entries(downstreams)),
    caches: nestedMap(Object.entries(caches))
  }
}

export { ingesting }
