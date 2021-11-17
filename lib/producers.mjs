import { strict as assert } from 'assert'
import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'

import facades from './facades.mjs'

const producers = {
  realiasTopic: produce((draft, alias, newAlias) => {
    const topic = facades.mkTopic(draft, alias)
    assert.ok(topic.optionalUUID !== undefined)

    const { aliasToUUID } = draft
    assert.ok(alias in aliasToUUID)

    // draft changes
    delete aliasToUUID[alias]
    aliasToUUID[newAlias] = topic.optionalUUID
  }),

  defineTopic: produce((draft, alias, uuid) => {
    const topic = facades.mkTopic(draft, alias)
    assert.ok(topic.optionalUUID === undefined)
    assert.ok(topic.optionalOrderedDownstreams === undefined)
    assert.ok(topic.optionalOrderedIndex === undefined)

    // draft changes
    const { aliasToUUID, uuidToOrderedDownstreams, uuidToOrderedIndex } = draft
    aliasToUUID[alias] = uuid
    uuidToOrderedDownstreams[uuid] = []
    uuidToOrderedIndex[uuid] = []
  }),

  undefineTopic: produce((draft, alias) => {
    const topic = facades.mkTopic(draft, alias)
    assert.ok(topic.optionalUUID !== undefined)
    assert.ok(topic.optionalOrderedDownstreams !== undefined)
    assert.ok(topic.optionalOrderedIndex !== undefined)

    // draft changes
    const { aliasToUUID, uuidToOrderedDownstreams, uuidToOrderedIndex } = draft
    delete aliasToUUID[alias]
    delete uuidToOrderedDownstreams[topic.optionalUUID]
    delete uuidToOrderedIndex[topic.optionalUUID]
  }),

  linkDownstreamTopic: produce((draft, src, dst, criteria) => {
    const srcTopic = facades.mkTopic(draft, src)
    const dstTopic = facades.mkTopic(draft, dst)
    assert.ok(srcTopic.optionalUUID !== undefined)
    assert.ok(dstTopic.optionalUUID !== undefined)
    assert.ok(srcTopic.hasDownstream(dstTopic.optionalUUID) === false)

    // draft changes
    // test eval criteria?
    srcTopic.optionalOrderedDownstreams.push([dstTopic.optionalUUID, criteria])
  }),

  unlinkDownstreamTopic: produce((draft, src, dst) => {
    const srcTopic = facades.mkTopic(draft, src)
    const dstTopic = facades.mkTopic(draft, dst)
    assert.ok(srcTopic.optionalUUID !== undefined)
    assert.ok(dstTopic.optionalUUID !== undefined)
    assert.ok(srcTopic.hasDownstream(dstTopic.optionalUUID) === true)

    // draft changes
    const dup = [...srcTopic.optionalOrderedDownstreams]
    dup.splice(srcTopic.downstreamIndex(dstTopic.optionalUUID), 1)
    srcTopic.optionalOrderedDownstreams = dup
  })
}

// naming conflict with "producers" in logging. rename?
const producing = log => {
  const chainable = result => producing(result)

  return {
    result: log,

    realiasTopic: (alias, newAlias) =>
      chainable(producers.realiasTopic(log, alias, newAlias)),

    defineTopic: (alias, optionalUUID = null) =>
      chainable(producers.defineTopic(log, alias, optionalUUID || uuidv4())),

    undefineTopic: (alias) => chainable(producers.undefineTopic(log, alias)),

    linkDownstreamTopic: (src, dst, criteria) =>
      chainable(producers.linkDownstreamTopic(log, src, dst, criteria)),

    unlinkDownstreamTopic: (src, dst) =>
      chainable(producers.unlinkDownstreamTopic(log, src, dst))
  }
}

export default producing
