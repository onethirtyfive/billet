import { strict as assert } from 'assert'
import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'

const destructuring = (draft) => {
  const { aliases, downstreams } = draft

  assert(aliases.size > 0, 'no aliases')

  return {
    define: (alias, uuid) => {
      assert(
        aliases.get(alias) === undefined,
        `topic already defined: ${alias}`
      )
      aliases.set(alias, uuid)
    },

    realias: (alias, newAlias) => {
      const uuid = aliases.get(alias)
      assert(!!uuid, `unknown topic: ${alias}`)
      assert(
        aliases.get(newAlias) === undefined,
        `proposed alias exists: ${newAlias}`
      )

      aliases.delete(alias)
      aliases.set(newAlias, uuid)
    },

    // not quite working
    relate: (upstream, downstream, criteria) => {
      // both upstream and downstream aliases must exist
      const booleanCriteria = `$boolean(${criteria || 'true'})`
      const upstreamUUID = aliases.get(upstream)
      const downstreamUUID = aliases.get(downstream)

      assert(!!upstreamUUID, `unknown upstream: ${upstreamUUID}`)
      assert(!!downstreamUUID, `unknown downstream: ${downstreamUUID}`)

      // test criteria for evaluation?
      downstreams.set(upstreamUUID, downstreams.get(upstreamUUID) || new Map())
      const topicDownstreams = downstreams.get(upstreamUUID)
      assert(
        topicDownstreams.get(downstreamUUID) === undefined,
        `proposed downstream exists for ${upstream}: ${downstream}`
      )
      topicDownstreams.set(downstreamUUID, booleanCriteria)
    }
  }
}

const modify = facade => {
  const changed = (fn) => produce(facade, fn)

  return {
    define: (alias, optionalUUID = null) => {
      const uuid = optionalUUID || uuidv4()
      return modify(changed(draft => destructuring(draft).define(alias, uuid)))
    },

    realias: (alias, newAlias) =>
      modify(changed(draft => destructuring(draft).realias(alias, newAlias))),

    relate: (upstream, downstream, optionalCriteria = null) => {
      const criteria = optionalCriteria || 'true'
      return modify(
        changed(
          draft => destructuring(draft).relate(upstream, downstream, criteria)
        )
      )
    },

    freeze: () => facade
  }
}

export { modify }
