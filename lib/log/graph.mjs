import { strict as assert } from 'assert'
import { Graph } from 'dsa.js'

function buildFnRecurse (topics, graph) {
  const fn = (upstream, downstreams, pathSet) => {
    downstreams.forEach((_, uuid) => {
      if (pathSet.has(uuid)) {
        const pathSetRepr = [...pathSet].join(' > ')
        throw new Error(`would cycle: ${uuid} (path: ${pathSetRepr})`)
      } else {
        const downstream = topics.topicAt(uuid)
        graph.addEdge(upstream, downstream)

        const { downstreams: downstreamDownstreams } = downstream
        if (downstreamDownstreams.size > 0) {
          pathSet.add(downstream.uuid)
          fn(downstream, downstreamDownstreams, pathSet)
        }
      }
    })
  }

  return fn
}

function make (topics) {
  const { rootTopic } = topics
  assert(!!rootTopic, 'no root topic')

  const graph = new Graph()
  graph.addVertex(rootTopic)

  const fnRecurse = buildFnRecurse(topics, graph)
  fnRecurse(rootTopic, rootTopic.downstreams, new Set([rootTopic.uuid]))

  return graph
}

export { make as mkGraph }
