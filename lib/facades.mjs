import { strict as assert } from 'assert'

const fronting = ({ aliases, downstreams, caches }) => {
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

  const _aliases = mapWithUniqueConstraint(aliases)

  const topicFor = (alias) => {
    const uuid = _aliases.get(alias)

    assert(downstreams[uuid], 'no downstreams for uuid')
    assert(caches[uuid], 'no cache for uuid')

    return {
      uuid,
      downstreams: mapWithUniqueConstraint(downstreams[uuid]),
      cache: mapWithUniqueConstraint(caches[uuid])
    }
  }

  return { aliases: _aliases, topicFor }
}

export { fronting }
