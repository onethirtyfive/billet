import { strict as assert } from 'assert'

const mapWithUniqueConstraint = entries => {
  return entries.reduce((acc, [key, value]) => {
    assert(!acc.has(key), `key not unique: ${key}`)
    acc.set(key, value)
    return acc
  }, new Map())
}

const registering = ({ aliases, downstreams, caches }) => {
  const registry = new Map()

  const topicAt = (uuid) => {
    if (registry.has(uuid)) {
      return registry.get(uuid)
    } else {
      const topic = {
        uuid,
        downstreams: new Map(downstreams.get(uuid) || []),
        cache: new Map(caches.get(uuid) || [])
      }
      registry.set(uuid, topic)
      return topic
    }
  }

  const topicFor = (alias) => {
    const uuid = aliases.get(alias)
    assert(!!uuid, `no topic for alias: ${alias}`)
    return topicAt(uuid)
  }

  return { rootTopic: topicFor('root'), topicAt, topicFor }
}

const fronting = ({ aliases, downstreams, caches }) => {
  assert(!!aliases, 'no aliases')
  assert(!!downstreams, 'no downstreams')
  assert(!!caches, 'no caches')

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

export { fronting, registering }
