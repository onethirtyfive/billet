import { Queue } from 'dsa.js'
import jsonata from 'jsonata'
import { strict as assert } from 'assert'

import { mkState, revisingState } from './state.mjs'
import { mkTopics } from './log/topics.mjs'
import { mkGraph } from './log/graph.mjs'

function buildFnTraverse (rootNode) {
  return function * (event) {
    const visited = new Map()
    const visitList = new Queue() // breadth-first
    visitList.add(rootNode)

    while (!visitList.isEmpty()) {
      const node = visitList.remove()

      if (node && !visited.has(node)) {
        yield node
        visited.set(node)

        const downstreams = node.getAdjacents().reduce((acc, prospect) => {
          const topic = prospect.value
          const query = jsonata(node.value.downstreams.get(topic.uuid))
          if (query.evaluate(event) === true) {
            acc.push(prospect)
          }
          return acc
        }, [])

        downstreams.forEach(adj => visitList.add(adj))
      }
    }
  }
}

function buildFnPlan (fnTraverse) {
  return event => [...fnTraverse(event)].map(node => node.value)
}

function make (state, optionalFnTraverse = null) {
  const topics = mkTopics(state) // consider using bind for memoization
  const graph = mkGraph(topics)
  const rootNode = graph.nodes.get(topics.rootTopic)
  assert(!!rootNode, 'no root node')

  const fnTraverse = optionalFnTraverse || buildFnTraverse(rootNode)
  console.log('foo')
  console.log(fnTraverse)

  const fnRevising = () => revisingState(state)
  const fnPlan = buildFnPlan(fnTraverse)

  return { state, topics, graph, revising: fnRevising, plan: fnPlan }
}

function load (data) {
  const state = mkState(data)
  return make(state)
}

export { make as mkLog, load as loadLog }
