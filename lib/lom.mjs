// LOM: Log Object Model
// After a "lom" is loaded from persistence, developers may change it in-memory.
// These changes only last between processes when persisted.

import { strict as assert } from 'assert'
import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'

const using = (draft) => {
  const { aliases, downstreams, caches } = draft
  assert(aliases.size > 0, 'no aliases')

  return {
    define: (alias, uuid) => {
      assert(aliases.get(alias) === undefined, `alias exists: ${alias}`)
      assert(downstreams.get(uuid) === undefined, `downstreams exist: ${alias}`)
      assert(caches.get(uuid) === undefined, `cache exists: ${alias}`)

      aliases.set(alias, uuid)
      downstreams.set(uuid, new Map())
      caches.set(uuid, new Map())
    },

    realias: (alias, newAlias) => {
      const uuid = aliases.get(alias)
      assert(!!uuid, `no alias: ${alias}`)
      assert(aliases.get(newAlias) === undefined, `alias exists: ${newAlias}`)

      aliases.delete(alias)
      aliases.set(newAlias, uuid)
    },

    // not quite working
    relate: (upstreamAlias, downstreamAlias, criteria) => {
      const booleanCriteria = `$boolean(${criteria})` // coercion
      const upstreamUUID = aliases.get(upstreamAlias)
      const downstreamUUID = aliases.get(downstreamAlias)

      // test jsonata criteria evaluates?
      assert(!!upstreamUUID, `no upstream alias: ${upstreamAlias}`)
      assert(!!downstreamUUID, `no downstream downstream: ${downstreamAlias}`)

      const _downstreams = downstreams.get(upstreamUUID)
      assert(_downstreams !== undefined, `no downstreams: ${upstreamAlias}`)
      assert(
        _downstreams.get(downstreamUUID) === undefined,
        `downstream exists for ${upstreamAlias}: ${downstreamAlias}`
      )

      _downstreams.set(downstreamUUID, booleanCriteria)
    }
  }
}

const changing = lom => {
  const revise = (fn) => produce(lom, fn)

  return {
    define: (alias, optionalUUID = null) =>
      changing(
        revise(draft => {
          const uuid = optionalUUID || uuidv4()
          using(draft).define(alias, uuid)
        })
      ),

    realias: (alias, newAlias) =>
      changing(revise(draft => using(draft).realias(alias, newAlias))),

    relate: (upstreamAlias, downstreamAlias, optionalCriteria = null) =>
      changing(
        revise(draft => {
          const criteria = optionalCriteria || 'true'
          using(draft).relate(upstreamAlias, downstreamAlias, criteria)
        })
      ),

    freeze: () => lom
  }
}

const sourcing = ({ aliases, downstreams, caches }) => {
  const registry = new Map()

  const topicAt = (uuid) => {
    if (!registry.has(uuid)) {
      const _downstreams = downstreams.get(uuid)
      const _cache = caches.get(uuid)
      assert(!!_downstreams, `no downstreams: ${uuid}`)
      assert(!!_cache, `no cache: ${uuid}`)

      const topic = { uuid, downstreams: _downstreams, cache: _cache }
      registry.set(uuid, topic)
    }

    return registry.get(uuid)
  }

  const topicFor = (alias) => {
    const uuid = aliases.get(alias)
    assert(!!uuid, `no topic for alias: ${alias}`)
    return topicAt(uuid)
  }

  return { rootTopic: topicFor('root'), topicAt, topicFor }
}

export { changing, sourcing }
