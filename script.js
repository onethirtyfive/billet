import { readFileSync } from 'fs'
import { enableMapSet } from 'immer'
import { prepare, changing, sourcing } from './lib/lom.mjs'
import { graph } from './lib/graph.mjs'

enableMapSet()

const persisted = JSON.parse(readFileSync('log.json'))

const lom = changing(prepare(persisted))
  .define('joel')
  .define('joshua')
  .realias('joel', 'stephanie')
  .relate('root', 'joshua')
  .relate('joshua', 'stephanie')
  .freeze()

const topics = sourcing(lom)
const nodes = graph(topics).nodes

console.log('\n*** GRAPH NODES ***\n\n')
for (const [_, node] of nodes) {
  console.log(node.value.uuid)
  console.log(`adjacents: ${node.getAdjacents().map(n => n.value.uuid).join(', ')}`)
  console.log()
}

console.log('\n*** LOM ***\n\n')
lom.aliases.forEach((uuid, alias) => {
  console.log(alias)
  console.log(topics.topicAt(uuid))
  console.log()
})
