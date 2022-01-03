type FnDeserialize<T extends Billet.BaseEvent> = (source: unknown) => T

const metaEventDeserializers = {
  '__billet__.settings:update': (source: unknown) =>
    // TODO: assert properties of underlying data
    source as Billet.UpdateSettings,

  '__billet__.graph.topic:upsert': (source: unknown) =>
    // TODO: assert properties of underlying data
    source as Billet.UpsertGraphTopic,

  // n.b. To be JSON-compatible, the snapshot's relations are serialized as
  //      Record<UUID,[Criterion, UUID][]>. We must transform this into the
  //      more usable Record<UUID, Map<Criterion, UUID>> type at runtime for:
  //        1. guaranteed iteration in insertion order, which enables
  //        2. deterministically-ordered event propagations
  '__billet__:snapshot': (source: unknown) => {
    const serializedRepresentation = source as Billet.TakeSnapshot

    // TODO: assert properties of underlying data

    const relationsRepr = Object.fromEntries(
      Object
        .entries(serializedRepresentation.context.relations)
        .map(([topicUUID, entries]) => [topicUUID, new Map(entries)]
      )
    )

    return {
      ...serializedRepresentation,
      name: '__billet__:snapshot',
      context: {
        ...serializedRepresentation.context,
        relations: relationsRepr
      }
    }
  }
}

function deserializeMetaEvent<T extends Billet.MetaEvent> (
  eventName: Billet.MetaEventName,
  source: unknown
) {
  return metaEventDeserializers[eventName](source as Billet.MetaEvent)
}

function deserializePropagatedEvent (source: unknown) {
  return source as Billet.PropagatedEvent
}

export { deserializeMetaEvent, deserializePropagatedEvent }
