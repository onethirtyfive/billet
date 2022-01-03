import { strict as assert } from 'assert'
import jsonata from 'jsonata'

function curriedLookups({ aliases, relations, receipts }: Billet.Snapshot) {
  const byAlias = [...Object.entries(aliases)].reduce((acc, [alias, uuid]) => {
    const topic: Billet.Topic = 
    acc[alias] = {
      alias,
      uuid,
      contingentPaths: relations[uuid]!,
      propagations: receipts[uuid]!
    }
    return acc
  }, <Billet.ByAlias>{})

  const byUUID = [...Object.entries(byAlias)].reduce((acc, [alias, topic]) => {
    acc[topic.uuid] = byAlias[alias]
    return acc
  }, <Billet.ByUUID>{})

  return { byAlias, byUUID } // n.b. lookups share object references
}

function curriedTraversals (
  { byAlias, byUUID }: Billet.Lookups
) {
  const root = byAlias['root']

  return {
    plan: (event: Billet.BaseEvent): Billet.Propagations => {
      const recursivePlan = (visitee: Billet.Topic, acc: Billet.Propagations) => {
        const propagations =
          [...visitee.contingentPaths.entries()].filter(([expr, ]) => {
            const [engine, query] = expr.split(':')
            assert(engine === 'jsonata')
            return jsonata(query).evaluate(event) === true
          }).map(([, uuid]) => byUUID[uuid]!)
        for (const topic of propagations) {
          acc.push(topic.uuid)
          recursivePlan(topic, acc)
        }
      }
      const propagations = <Billet.Propagations>[root.uuid]
      recursivePlan(root, propagations)
      return propagations
    },

    validate: (): void => {
      const recursiveValidate = (
        visitee: Billet.Topic,
        crumbs: Billet.Propagations
      ) => {
        const uuids = [...visitee.contingentPaths.values()]
        const cycles = [...uuids].filter(uuid => uuid in crumbs)
        if (cycles.length > 0) {
          throw new Error(`cycles: ${cycles} (at: ${[...crumbs].join('➤')})`)
        } else {
          uuids.forEach(uuid => {
            crumbs.push(uuid)
            recursiveValidate(byUUID[uuid]!, crumbs)
            crumbs.pop()
          })
        }
      }
      recursiveValidate(root, [root.uuid])
    }
  }
}

function construct (snapshot: Billet.Snapshot) {
  const lookups = curriedLookups(snapshot)
  const traversals = curriedTraversals(lookups)
  return {
    ...lookups,
    ...traversals
  }
}

const lib = { curriedLookups, curriedTraversals }

export { construct, lib }
