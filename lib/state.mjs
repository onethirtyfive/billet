import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'
import hashObj from 'object-hash'
import { createHash } from 'crypto'

import { strict as assert } from 'assert'
import { mkLog } from './log.mjs'

const buildFnSeed = ({ universe }) => {
  return () => (universe.length > 0)
    ? universe[(universe.length - 1)][1]
    : '00000000-0000-0000-0000-000000000000'
}

function buildFnChecksum ({ checksumAlgorithm: algorithm }) {
  return (seed, event) => {
    const hash = createHash(algorithm)
    hash.write(seed)
    hash.write(hashObj(event, { algorithm }))
    return hash.digest('hex')
  }
}

function mapWithUniqueConstraint (entries) {
  return entries.reduce((acc, [key, value]) => {
    assert(!acc.has(key), `key not unique: ${key}`)
    acc.set(key, value)
    return acc
  }, new Map())
}

function nestedMap (entries) {
  return new Map(
    [...entries].map(
      ([uuid, [...entries]]) => [uuid, mapWithUniqueConstraint(entries)]
    )
  )
}

function bootstrap (data) {
  const {
    checksumAlgorithm,
    expressionEngine,
    aliases,
    downstreams,
    caches,
    universe
  } = data

  assert(!!checksumAlgorithm, 'no checksum algorithm')
  assert(!!expressionEngine, 'no expression engine')
  assert(!!aliases, 'no aliases')
  assert(!!downstreams, 'no downstreams')
  assert(!!caches, 'no caches')
  assert(!!universe, 'no universe')

  return {
    checksumAlgorithm,
    expressionEngine,
    aliases: mapWithUniqueConstraint(aliases),
    downstreams: nestedMap(Object.entries(downstreams)),
    caches: nestedMap(Object.entries(caches)),
    universe: [...universe]
  }
}

function onto (draft) {
  const {
    checksumAlgorithm,
    expressionEngine,
    aliases,
    downstreams: _downstreams,
    caches,
    universe
  } = draft

  assert(aliases.size > 0, 'no aliases')

  return {
    define: (alias, uuid) => {
      assert(aliases.get(alias) === undefined, `alias exists: ${alias}`)
      assert(_downstreams.get(uuid) === undefined, `downstreams exist: ${alias}`)
      assert(caches.get(uuid) === undefined, `cache exists: ${alias}`)

      aliases.set(alias, uuid)
      _downstreams.set(uuid, new Map())
      caches.set(uuid, new Map())
    },

    realias: (alias, newAlias) => {
      const uuid = aliases.get(alias)
      assert(!!uuid, `no alias: ${alias}`)
      assert(aliases.get(newAlias) === undefined, `alias exists: ${newAlias}`)

      aliases.delete(alias)
      aliases.set(newAlias, uuid)
    },

    relate: (upstreamAlias, downstreamAlias, criteria) => {
      const booleanCriteria = `$boolean(${criteria})` // coercion
      const upstreamUUID = aliases.get(upstreamAlias)
      const downstreamUUID = aliases.get(downstreamAlias)

      // test jsonata criteria evaluates?
      assert(!!upstreamUUID, `no upstream alias: ${upstreamAlias}`)
      assert(!!downstreamUUID, `no downstream alias: ${downstreamAlias}`)

      const downstreams = _downstreams.get(upstreamUUID)
      assert(downstreams !== undefined, `no downstreams: ${upstreamAlias}`)
      assert(
        downstreams.get(downstreamUUID) === undefined,
        `downstream exists for ${upstreamAlias}: ${downstreamAlias}`
      )

      downstreams.set(downstreamUUID, booleanCriteria)
    },

    append: (plan, event, checksum) => {
      const newUniverseLen = universe.push([event, checksum]) // mutating!

      plan.forEach(topic => {
        const cache = caches.get(topic.uuid)
        assert(!!cache, `no cache: ${topic}`)

        cache.set(event.uuid, newUniverseLen - 1)
      })
    }
  }
}

function revising (state) {
  return {
    define: (alias, optionalUUID = null) =>
      revising(
        produce(state, draft => {
          const uuid = optionalUUID || uuidv4()
          onto(draft).define(alias, uuid)
        })
      ),

    realias: (alias, newAlias) =>
      revising(produce(state, draft => onto(draft).realias(alias, newAlias))),

    relate: (upstreamAlias, downstreamAlias, optionalCriteria = null) =>
      revising(
        produce(state, draft => {
          const criteria = optionalCriteria || 'true'
          onto(draft).relate(upstreamAlias, downstreamAlias, criteria)
        })
      ),

    append: (plan, event, optionalFnChecksum = null, optionalFnSeed = null) =>
      revising(
        produce(state, draft => {
          const fnChecksum = optionalFnChecksum || buildFnChecksum(state)
          const fnSeed = optionalFnSeed || buildFnSeed(state)
          const checksum = fnChecksum(fnSeed(), event)
          onto(draft).append(plan, event, checksum)
        })
      ),

    done: () => mkLog(state)
  }
}

export { bootstrap as mkState, revising as revisingState }
