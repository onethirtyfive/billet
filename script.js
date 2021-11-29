import { readFileSync } from 'fs'
import { enableMapSet } from 'immer'
import { modify } from './lib/producers.mjs'
import { fronting, registering } from './lib/facades.mjs'
import { graphing } from './lib/graph.mjs'

enableMapSet()

const persistedLog = JSON.parse(readFileSync('log.json'))
const facade = fronting(persistedLog)

let registry
let newFacade = modify(facade)
  .define('joel')
  .define('joshua')
  .freeze()

// print joel uuid
registry = registering(newFacade)

newFacade = modify(newFacade)
  .realias('joel', 'stephanie')
  .relate('root', 'joshua', "$match(event,'gavePresent')")
  .relate('joshua', 'stephanie', "$match(event,'gavePresent')")
  .freeze()

registry = registering(newFacade)
const graph = graphing(registry)

newFacade.aliases.forEach((uuid, alias) => {
  console.log(alias)
  console.log(registry.topicAt(uuid))
})

console.log('hello')
