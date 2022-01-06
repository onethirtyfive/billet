declare namespace Billet {
  export interface LibRuntime {
    curriedLookups: (snapshot: Snapshot) => Lookups
    curriedTraversals: (lookups: Lookups) => Traversals
    bootstrap: (snapshot: Snapshot) => Runtime
  }
}
