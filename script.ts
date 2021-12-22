// stdlib
import { readFileSync } from 'fs'

// 3rd party
import { enableMapSet } from 'immer'
import { v4 as uuidv4 } from 'uuid'

// billet
import { loadState } from './src/state/loading.js'
import { revising } from './src/state/revision.js'
import { mkTopics } from './src/topics.js'

enableMapSet()

const data = JSON.parse(readFileSync('log.json').toString())

let state = loadState(data)
state = revising(state)
  .define('joel')
  .define('joshua')
  .realias('joel', 'stephanie')
  .propagate('root', 'joshua', '$match(event, /anticipations.foo/)[]')
  .propagate('joshua', 'stephanie')
  .done()

let topics = mkTopics(state)

console.log('\n\n*** Log ***\n\n');

(state.aliases as Billet.Aliases).forEach((uuid, alias) => {
  console.log(alias)
  console.log(topics.byUUID.get(uuid))
  console.log()
})

console.log('\n\n*** EVENT PLANNING (GRAPH TRAVERSAL) ***\n')

const event = {
  uuid: uuidv4(),
  timestamp: 1245,
  event: 'anticipations.foo',
  context: {}
}
console.log(`traversing with: ${JSON.stringify(event, null, 2)}\n`)

const rootNode = topics.byAlias.get('root')!
const plan = topics.plan(event)
console.log('plan:')
console.log([...plan].map(topic => topic.uuid))

// state = revising(state)
//   .append(plan, event)
//   .done()
// console.log(state.universe)

// console.log(state.caches.get('1e3c5d1c-b9db-43fa-a3f6-29f46821d5f6'))
