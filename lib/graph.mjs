import { strict as assert } from 'assert'
import { Graph } from 'dsa.js'

const graphing = (registry) => {
  const { rootTopic } = registry
  assert(!!rootTopic, 'no root topic')

  const graph = new Graph()
  const lookup = { [rootTopic.uuid]: rootTopic }
  graph.addVertex(lookup[rootTopic.uuid])

  const recurse = (upstreamUUID, downstreams, pathSet) => {
    downstreams.forEach((_, uuid) => {
      const { downstreams } = registry.topicAt(uuid)
      lookup[uuid] = lookup[uuid] || { uuid, downstreams }
      if (pathSet.has(uuid)) {
        const msg = `would cycle: ${uuid} (path: ${[...pathSet].join(' > ')})`
        throw new Error(msg)
      } else {
        graph.addEdge(lookup[upstreamUUID], lookup[uuid])
        if (downstreams.size > 0) {
          pathSet.add(uuid)
          recurse(uuid, downstreams, pathSet)
        }
      }
    })
  }

  recurse(rootTopic.uuid, rootTopic.downstreams, new Set([rootTopic.uuid]))
  return graph
}

export { graphing }
