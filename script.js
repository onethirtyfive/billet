import { readFileSync } from 'fs'
import { enableMapSet } from 'immer'
import { ingesting } from './lib/ingestion.mjs'
import { changing, sourcing } from './lib/lom.mjs'
import { graphing } from './lib/graph.mjs'

enableMapSet()

const logData = JSON.parse(readFileSync('log.json'))
const lom = ingesting(logData)
const newLOM = changing(lom)
  .define('joel')
  .define('joshua')
  .realias('joel', 'stephanie')
  .relate('root', 'joshua')
  .relate('joshua', 'stephanie')
  .freeze()

const source = sourcing(newLOM)
const graph = graphing(source)

console.log('\n*** GRAPH NODES ***\n\n')
for (const [_, node] of graph.nodes) {
  console.log(node.value.uuid)
  console.log(`adjacents: ${node.getAdjacents().map(n => n.value.uuid).join(', ')}`)
  console.log()
}

console.log('\n*** LOM ***\n\n')
newLOM.aliases.forEach((uuid, alias) => {
  console.log(alias)
  console.log(source.topicAt(uuid))
  console.log()
})
