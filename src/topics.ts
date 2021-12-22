import jsonata from 'jsonata'

function curriedLookups(
  { aliases, propagations, caches }: Billet.State
) {
  const byAlias = [...aliases.entries()].reduce((acc, [alias, uuid]) => {
    const predicates = propagations.get(uuid)!
    const cache = caches.get(uuid)!
    return new Map([...acc.entries(), [alias, { uuid, predicates, cache }]])
  }, new Map<Billet.Alias, Billet.Topic>())

  const byUUID = [...byAlias.values()].reduce(
    (acc, topic) => new Map([...acc.entries(), [topic.uuid, topic]]),
    new Map<Billet.UUID, Billet.Topic>()
  )

  return { byAlias, byUUID } // n.b. lookups share object references
}

function curriedTraversals (
  { byAlias, byUUID }: Billet.Lookups
) {
  const root = byAlias.get('root')!

  return {
    plan: (event: Billet.Event): Billet.Plan => {
      const recursivePlan = (visitee: Billet.Topic, acc: Set<Billet.Topic>) => {
        const propagations =
          [...visitee.predicates.entries()]
            .filter(
              ([predicate, ]) =>jsonata(predicate).evaluate(event) === true
            )
            .map(([predicate, uuid]) => byUUID.get(uuid)!)
        for (const topic of propagations) {
          acc.add(topic)
          recursivePlan(topic, acc)
        }
      }
      const propagations = new Set<Billet.Topic>()
      recursivePlan(root, propagations)
      return propagations
    },

    validate: (): void => {
      const recursiveValidate = (
        visitee: Billet.UUID,
        crumbs: Set<Billet.UUID>
      ) => {
        const topic = byUUID.get(visitee)!
        const uuids = [...topic.predicates.values()]
        const cycles = [...uuids].filter(uuid => crumbs.has(uuid))
        if (cycles.length > 0) {
          const trace = [...crumbs]
          throw new Error(`cycles: ${cycles} (crumbs: ${trace.join('➤')})`)
        } else {
          uuids.forEach(uuid => {
            crumbs.add(uuid)
            recursiveValidate(uuid, crumbs)
            crumbs.delete(uuid)
          })
        }
      }
      const { uuid } = root
      recursiveValidate(uuid, new Set([uuid]))
    }
  }
}

function make (state: Billet.State): Billet.Topics {
  const lookups = curriedLookups(state)
  const traversals = curriedTraversals(lookups)
  return {
    ...lookups,
    ...traversals
  }
}

export { make as mkTopics }
