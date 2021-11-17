import { readFileSync } from 'fs'

import producing from './lib/producers.mjs'

let log

log = JSON.parse(readFileSync('log.json'))

log = producing(log)
log = log.defineTopic('foo')
log = log.defineTopic('bar')
log = log.linkDownstreamTopic('foo', 'bar', 'true')
log = log.unlinkDownstreamTopic('foo', 'bar')
log = log.realiasTopic('foo', 'newTopic')

console.log(JSON.stringify(log, null, 2))

// console.log(JSON.stringify(log, null, 2))

// log = ['joel', 'joshua', 'chiquita'].reduce(
//   (modifying, topic) => modifying.define(topic),
//   log
// ).result

// console.log(JSON.stringify(log, null, 2))

// log = modifyDownstreams(log)
//   .link('joel', 'joshua', '$true')
//   .unlink('joel', 'joshua')
//   .result

// console.log(JSON.stringify(log, null, 2))

// // need to make a plan

// log = modifyEntries(log)
//   .append(
//     {
//       timestamp: 1632974404123,
//       event: 'anticipation.create',
//       context: {
//         uuid: '123e4567-e89b-12d3-a456-426614174000',
//         attributes: {
//           name: 'Lindsey Repayment',
//           wealthEffect: 'gain',
//           eventuality: 'imminent',
//           amount: 1234.56
//         }
//       }
//     }
//   )