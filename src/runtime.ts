import { strict as assert } from 'assert'
import jsonata from 'jsonata'

export const libRuntime: Billet.LibRuntime = {
  curriedLookups: function ({ aliases, relations, receipts }) {
    const topicsByAlias = [...Object.entries(aliases)]
      .reduce((acc, [alias, uuid]) => {
        const topic: Billet.Topic =
        acc[alias] = {
          alias,
          uuid,
          contingentPaths: relations[uuid]!,
          propagations: receipts[uuid]!
        }
      return acc
    }, <Billet.ByAlias>{})

    const topicsByUUID = [...Object.entries(topicsByAlias)]
      .reduce((acc, [alias, topic]) => {
        acc[topic.uuid] = topicsByAlias[alias]
        return acc
      }, <Billet.ByUUID>{})

    return { topicsByAlias, topicsByUUID } // n.b. lookups share object references
  },

  curriedTraversals: function ({ topicsByAlias, topicsByUUID }) {
    const root = topicsByAlias['root']

    return {
      plan: (event) => {
        const recursivePlan = (
          visitee: Billet.Topic,
          acc: Billet.Propagations
        ) => {
          const propagations =
            [...visitee.contingentPaths.entries()].filter(([expr, ]) => {
              const [engine, query] = expr.split(':')
              assert(engine === 'jsonata')
              return !!jsonata(query).evaluate(event)
            }).map(([, uuid]) => topicsByUUID[uuid]!)
          for (const topic of propagations) {
            acc.push(topic.uuid)
            recursivePlan(topic, acc)
          }
        }
        const propagations = [root.uuid]
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
              recursiveValidate(topicsByUUID[uuid]!, crumbs)
              crumbs.pop()
            })
          }
        }
        recursiveValidate(root, [root.uuid])
      }
    }
  },

  bootstrap: function (snapshot) {
    const lookups = this.curriedLookups(snapshot)
    const traversals = this.curriedTraversals(lookups)
    traversals.validate()
    return {
      settings: snapshot.settings,
      ...lookups,
      ...traversals
    }
  }
}
