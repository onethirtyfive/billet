import { strict as assert } from 'assert'

const mkTopic = (document, alias) => {
  const { aliasToUUID, uuidToOrderedDownstreams, uuidToOrderedIndex } = document

  const optionalUUID = aliasToUUID[alias]
  const optionalOrderedDownstreams = uuidToOrderedDownstreams[optionalUUID]
  const optionalOrderedIndex = uuidToOrderedIndex[optionalUUID]

  const dstUUIDToIndex =
    (optionalOrderedDownstreams || []).reduce((acc, [dstUUID, _], index) => {
      assert.ok(!(dstUUID in optionalOrderedDownstreams))
      acc[dstUUID] = index
      return acc
    }, {})

  return {
    optionalUUID,
    optionalOrderedDownstreams,
    optionalOrderedIndex,

    hasDownstream: dstUUID => (dstUUID in dstUUIDToIndex),

    downstreamIndex: dstUUID => {
      const index = dstUUIDToIndex[dstUUID]
      assert.ok(index !== undefined)
      return index
    }
  }
}

// const mkEntry = ([digest, substance]) => {
//   const { timestamp, event, context } = substance

//   return {
//     provided: [digest, substance],

//     // coarse-grained entry properties
//     digest,
//     substance,

//     // fine-grained event properties
//     timestamp,
//     event,
//     context
//   }
// }

export default { mkTopic }
