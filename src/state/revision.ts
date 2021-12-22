import { strict as assert } from 'assert'
import { createHash } from 'crypto'
import { produce, Draft } from 'immer'
import { v4 as uuidv4 } from 'uuid'
import hashObj from 'object-hash'

const curriedSeed = ({ universe }: Billet.State) => {
  return () => (universe.length > 0)
    ? universe[(universe.length - 1)][0]
    : '00000000-0000-0000-0000-000000000000'
}

function curriedChecksum ({ checksumAlgorithm: algorithm }: Billet.State) {
  return (seed: string, event: any) => {
    const hash = createHash(algorithm)
    hash.write(seed)
    hash.write(hashObj(event, { algorithm }))
    return hash.digest('hex')
  }
}

function onto (draft: Draft<Billet.State>) {
  const {
    aliases,
    propagations,
    caches,
    universe
  } = draft

  assert(aliases.size > 0, 'no aliases')

  return {
    define: (alias: Billet.Alias, uuid: Billet.UUID) => {
      assert(aliases.get(alias) === undefined, `alias exists: ${alias}`)
      assert(
        propagations.get(uuid) === undefined,
        `downstreams exist: ${alias}`
      )
      assert(caches.get(uuid) === undefined, `cache exists: ${alias}`)
      aliases.set(alias, uuid)
      propagations.set(uuid, new Map<Billet.UUID, Billet.Predicate>())
      caches.set(uuid, new Map<Billet.UUID, Billet.EntryIndex>())
    },

    realias: (alias: Billet.Alias, newAlias: Billet.Alias) => {
      const uuid = aliases.get(alias)!
      assert(aliases.get(newAlias) === undefined, `alias exists: ${newAlias}`)
      aliases.delete(alias)
      aliases.set(newAlias, uuid)
    },

    propagate: (
      from: Billet.Alias,
      to: Billet.Alias,
      predicate: Billet.Predicate
    ) => {
      const fromUUID = aliases.get(from)!
      const expression = `$boolean(${predicate || true})`
      const toUUID = aliases.get(to)!
      const criteria = propagations.get(fromUUID)!
      assert(
        criteria.get(expression) === undefined,
        `propagation exists: ${from} -> ${predicate} -> ${to}`
      )
      criteria.set(expression, toUUID)
    },

    // append: (propagations: Propagations, event: any, checksum: Checksum) => {
    //   const newUniverseLen = universe.push([checksum, event]) // mutating!

    //   // write to root?
    //   propagations.forEach(({ from, predicate, to }) => {
    //     // don't we add to the upstream?
    //     const cache = caches.get(predicate.uuid)!
    //     cache.set(event.uuid, newUniverseLen - 1)
    //   })
    // }
  }
}

function revise (state: Billet.State): Billet.Revision {
  return {
    define: (alias: Billet.Alias, uuid: Billet.UUID = uuidv4()) =>
      revise(produce(state, draft => onto(draft).define(alias, uuid))),

    realias: (alias: Billet.Alias, newAlias: Billet.Alias) =>
      revise(produce(state, draft => onto(draft).realias(alias, newAlias))),

    propagate: (
      from: Billet.Alias,
      to: Billet.Alias,
      predicate: Billet.Predicate = 'true',
    ) =>
      revise(
        produce(state, draft => onto(draft).propagate(from, to, predicate))
      ),

    // append: (
    //   propagations: Propagations,
    //   event: any,
    //   checksum = curriedChecksum(state),
    //   seed = curriedSeed(state)
    // ) =>
    //   revise(
    //     produce(state, draft => {
    //       const digest = checksum(seed(), event)
    //       onto(draft).append(propagations, event, digest)
    //     })
    //   ),

    done: () => state
  }
}

export { revise as revising }
