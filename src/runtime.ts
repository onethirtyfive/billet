import { strict as assert } from 'assert'
import jsonata from 'jsonata'

export const libRuntime: Billet.LibRuntime = {
  curriedLookups: function ({ aliases, relations, receipts }) {
    const topicsByAlias = [...aliases.entries()].reduce(
      (acc, [alias, uuid]) => {
        const topic = {
          alias, uuid,
          contingentPaths: relations.get(uuid)!,
          propagations: receipts.get(uuid)!
        }
        acc.set(alias, topic)
        return acc
      },
      new Map()
    )

    const topicsByUUID = [...topicsByAlias.entries()].reduce(
      (acc, [alias, topic]) => {
        acc.set(topic.uuid, topicsByAlias.get(alias)!)
        return acc
      },
      new Map()
    )

    return { topicsByAlias, topicsByUUID } // n.b. lookups share obj refs
  },

  curriedTraversals: function ({ topicsByAlias, topicsByUUID }) {
    const root = topicsByAlias.get('root')!

    return {
      plan: (event) => {
        const recursivePlan = (
          visitee: Billet.Topic,
          acc: Billet.Propagations
        ) => {
          const propagations =
            new Set(
              ...(
                [...visitee.contingentPaths.entries()].filter(([expr, ]) => {
                  const [engine, query] = expr.split(':')
                  assert(engine === 'jsonata')
                  return !!jsonata(query).evaluate(event)
                }).map(([, _propagations]) =>
                  [..._propagations].map(uuid => topicsByUUID.get(uuid)!)
                )
              )
            )

          for (const topic of propagations) {
            acc.add(topic.uuid)
            recursivePlan(topic, acc)
          }
        }
        const propagations = new Set([root.uuid])
        recursivePlan(root, propagations)
        return propagations
      },

      validate: (): void => {
        const recursiveValidate = (
          visitee: Billet.Topic,
          crumbs: Billet.Propagations
        ) => {
          const uuids =
            [...visitee.contingentPaths.values()].reduce(
              (acc, set) => new Set([...acc, ...set]),
              new Set()
            )

          const cycles = [...uuids].filter(uuid => crumbs.has(uuid))
          if (cycles.length > 0) {
            throw new Error(`cycles: ${cycles} (at: ${[...crumbs].join('➤')})`)
          } else {
            uuids.forEach(uuid => {
              crumbs.add(uuid)
              recursiveValidate(topicsByUUID.get(uuid)!, crumbs)
              crumbs.delete(uuid)
            })
          }
        }
        recursiveValidate(root, new Set([root.uuid]))
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
