import { strict as assert } from 'assert'
import { v4 as uuidv4 } from 'uuid'
import { produce } from 'immer'

const using = draft => {
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
  const revise = fn => produce(lom, fn)

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

export { changing }
