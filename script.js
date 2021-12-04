import { readFileSync } from 'fs'
import { enableMapSet } from 'immer'
import { mkLOM } from './lib/support/model.mjs'
import { changing } from './lib/support/modification.mjs'
import { mkTopics } from './lib/support/topics.mjs'
import { graph } from './lib/graph.mjs'
import { make } from './lib/log.mjs'

enableMapSet()

const persisted = JSON.parse(readFileSync('log.json'))

const lom = changing(mkLOM(persisted))
  .define('joel')
  .define('joshua')
  .realias('joel', 'stephanie')
  .relate('root', 'joshua', 'false')
  .relate('joshua', 'stephanie', 'false')
  .freeze()

console.log(lom)

const topics = mkTopics(lom)
const _graph = graph(topics)
const log = make(_graph, lom.entries)

console.log('\n\n*** GRAPH NODES ***\n\n')
for (const [_, node] of _graph.nodes) {
  console.log(node.value.uuid)
  console.log(`adjacents: ${node.getAdjacents().map(n => n.value.uuid).join(', ')}`)
  console.log()
}

console.log('\n\n*** LOM ***\n\n')
lom.aliases.forEach((uuid, alias) => {
  console.log(alias)
  console.log(topics.topicAt(uuid))
  console.log()
})

console.log('\n\n*** EVENT PLANNING (GRAPH TRAVERSAL) ***\n')
const event = { event: 'anticipations.foo' }
console.log(`traversing with: ${JSON.stringify(event, null, 2)}\n`)
const rootNode = _graph.nodes.get(topics.rootTopic)
const plan = log.plan(rootNode, event)

console.log('plan:')
console.log(plan.map(node => node.value.uuid))
