import jsonata from 'jsonata'

import libLogEntry from './logEntry.mjs'

const expr = {
  SORTED_ROSTER_INDICES: () => jsonata('$sort(*[])')
}

const make = (object, basisObject = {}) => {
  return { ...basisObject, object }
}

const materialize = (view, universe) => {
  if (view.keys().length === universe.length) {
    return [...universe]
  } else {
    const sortedRosterIndices = expr.SORTED_ROSTER_INDICES().evaluate(view)
    return sortedRosterIndices.reduce((acc, viewIndex) => {
      acc.push(universe[viewIndex])
      return acc
    }, [])
  }
}

const filter = (view, query) =>
  view.filter((logEntry) => libLogEntry.test(logEntry, query))

export default { make, materialize, filter }

// view: view.reduce((acc, reference) => {
//   const [referenceDigest, sequence] = reference
//   const [entryDigest, substance] = entries[sequence]
//   assert.ok(referenceDigest === entryDigest)
//   acc.push(substance)
//   return acc
// }, []),