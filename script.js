import { readFileSync } from 'fs'
import { modify } from './lib/producers.mjs'
import { fronting } from './lib/facades.mjs'

const persistedLog = JSON.parse(readFileSync('log.json'))

const log = modify(persistedLog)
  .define('joel')
  .define('joshua')
  .realias('joel', 'stephanie')
  .relate('joshua', 'stephanie', "$match(event,'gavePresent')")
  .freeze()

const facade = fronting(log)

console.log(facade.topicFor('stephanie'))
