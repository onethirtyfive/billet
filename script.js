import { readFileSync } from 'fs'
import { enableMapSet } from 'immer'

import { loadLog } from './lib/log.mjs'

enableMapSet()

const data = JSON.parse(readFileSync('log.json'))

let log = loadLog(data)
  .revising()
  .define('joel')
  .define('joshua')
  .realias('joel', 'stephanie')
  .relate('root', 'joshua', 'false')
  .relate('joshua', 'stephanie', 'false')
  .done()
const { state, topics, graph } = log

console.log('\n\n*** Log ***\n\n')
state.aliases.forEach((uuid, alias) => {
  console.log(alias)
  console.log(topics.topicAt(uuid))
  console.log()
})

console.log('\n\n*** GRAPH NODES ***\n\n')
for (const [value, node] of graph.nodes) {
  const fnGetUUID = node => node.value.uuid
  console.log(value.uuid)
  console.log(`adjacents: ${node.getAdjacents().map(fnGetUUID).join(', ')}`)
  console.log()
}

console.log('\n\n*** EVENT PLANNING (GRAPH TRAVERSAL) ***\n')

const event = { uuid: uuidv4(), event: 'anticipations.foo', context: {} }
console.log(`traversing with: ${JSON.stringify(event, null, 2)}\n`)

const rootNode = graph.nodes.get(topics.rootTopic)
const plan = log.plan(event)
console.log('plan:')
console.log(plan.map(topic => topic.uuid))

import { v4 as uuidv4 } from 'uuid'

log = log
  .revising()
  .append(plan, event)
  .done()

const { state: { universe } } = log
console.log(universe)

console.log(log.state.caches.get('1e3c5d1c-b9db-43fa-a3f6-29f46821d5f6'))