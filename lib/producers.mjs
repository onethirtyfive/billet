import { strict as assert } from 'assert'
import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'

import { fronting as frontingLog } from './facades.mjs'

const using = (draft, optionalFacade = null) => {
  const { aliases, downstreams, caches } = draft

  assert(!!aliases, 'no aliases')
  assert(!!downstreams, 'no downstreams')
  assert(!!caches, 'no caches')

  const facade = optionalFacade || frontingLog(draft)

  return {
    define: (alias, uuid) => {
      assert(
        facade.aliases.get(alias) === undefined,
        `topic already defined: ${alias}`
      )

      draft.aliases = [...aliases, [alias, uuid]]
      downstreams[uuid] = []
      caches[uuid] = []
    },

    realias: (alias, newAlias) => {
      const uuid = facade.aliases.get(alias)
      assert(!!uuid, `unknown topic: ${alias}`)
      assert(
        facade.aliases.get(newAlias) === undefined,
        `proposed alias exists: ${newAlias}`
      )

      const newAliases = new Map(aliases)
      newAliases.delete(alias)
      draft.aliases = [...newAliases, [newAlias, uuid]]
    },

    relate: (upstream, downstream, criteria) => {
      // both upstream and downstream aliases must exist
      const booleanCriteria = `$boolean(${criteria || 'true'})`
      const upstreamUUID = facade.aliases.get(upstream)
      const downstreamUUID = facade.aliases.get(downstream)

      assert(!!upstreamUUID, `unknown upstream: ${upstreamUUID}`)
      assert(!!downstreamUUID, `unknown downstream: ${downstreamUUID}`)

      // test criteria for evaluation?
      const newDownstreams = new Map(downstreams[upstreamUUID])
      assert(
        newDownstreams.get(downstreamUUID) === undefined,
        `proposed downstream exists for ${upstream}: ${downstream}`
      )
      draft.downstreams[upstreamUUID] =
        [...newDownstreams, [downstreamUUID, booleanCriteria]]
    }
  }
}

const modify = log => {
  const changed = (fn) => produce(log, fn)

  return {
    define: (alias, optionalUUID = null) => {
      const uuid = optionalUUID || uuidv4()
      return modify(changed(draft => using(draft).define(alias, uuid)))
    },

    realias: (alias, newAlias) =>
      modify(changed(draft => using(draft).realias(alias, newAlias))),

    relate: (upstream, downstream, optionalCriteria = null) => {
      const criteria = optionalCriteria || 'true'
      return modify(
        changed(draft => using(draft).relate(upstream, downstream, criteria))
      )
    },

    freeze: () => log
  }
}

export { modify }
