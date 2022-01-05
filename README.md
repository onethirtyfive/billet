
All events in the log MUST, at a minimum:
  1. be of a type which extends Billet.BasicEvent, which requires that they
  2. have a `name` field; furthermore,
  3. `name` must not start with the string `__billet__`

Additionally, all app events are propagated through the topics graph, so their
shape MUST extend Billet.PropagatedEvent.

Developers are free to use their own derived type hierarchies, so long as they
meet these requirements. Since Typescript types are not accessible at runtime,
and since interpretation of the type is contingent on its `name`, some runtime
casting accommodations (and leaps of faith) are required.

Billet consumers SHOULD perform their own casting. Any validation of
app-specified events' contents' is also up to the app.
