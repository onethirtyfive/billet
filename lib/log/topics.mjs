import { strict as assert } from 'assert'

function buildFnTopicAt (
  { downstreams: _downstreams, caches: _caches },
  registry
) {
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
        return { uuid, downstreams, cache }
      })()
    )
    return registry.get(uuid)
  }
}

function buildFnTopicFor ({ aliases }, fnTopicAt) {
  return alias => {
    const uuid = aliases.get(alias)
    assert(!!uuid, `no uuid: ${alias}`)
    return fnTopicAt(uuid)
  }
}

function make (logInputs, optionalRegistry = null) {
  const fnTopicAt = buildFnTopicAt(logInputs, optionalRegistry || new Map())
  const fnTopicFor = buildFnTopicFor(logInputs, fnTopicAt)

  return {
    rootTopic: fnTopicFor('root'),
    topicAt: fnTopicAt,
    topicFor: fnTopicFor
  }
}

export { make as mkTopics }
