import { strict as assert } from 'assert'

const buildFnTopicAt = (
  { downstreams: _downstreams, caches: _caches },
  registry
) => {
  return uuid => {
    // Memoize in registry:
    registry.set(
      uuid,
      registry.get(uuid) ||
      (() => {
        const downstreams = _downstreams.get(uuid)
        const cache = _caches.get(uuid)
        assert(!!downstreams, `no downstreams: ${uuid}`)
        assert(!!cache, `no cache: ${uuid}`)
        return { uuid, downstreams, cache}
      })()
    )
    return registry.get(uuid)
  }
}

const buildFnTopicFor = ({ aliases }, fnTopicAt) => {
  return alias => {
    const uuid = aliases.get(alias)
    assert(!!uuid, `no uuid: ${alias}`)
    return fnTopicAt(uuid)
  }
}

const make = (lom, optionalRegistry = null) => {
  const fnTopicAt = buildFnTopicAt(lom, optionalRegistry || new Map())
  const fnTopicFor = buildFnTopicFor(lom, fnTopicAt)

  return {
    rootTopic: fnTopicFor('root'),
    topicAt: fnTopicAt,
    topicFor: fnTopicFor
  }
}

export { make as mkTopics }
