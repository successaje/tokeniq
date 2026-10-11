# Draft: transient storage between external calls in one Foundry test

**Project:** Foundry (forge) 1.8.5
**Type:** question, possibly intended behaviour
**Status:** draft, not filed. Confirm against Foundry's documentation on test isolation (`isolate` mode) first.

## What we saw

A Safe module guard stores a hash in transient storage during `checkModuleTransaction` and reads it in `checkAfterModuleExecution`. In a test function that made those two calls one after the other from the test contract, the second call saw empty transient storage, as if each top-level call were a separate transaction. Inside a real Safe, both hooks run within one transaction.

## Workaround

A small helper contract (`HookSequenceSafe` in `packages/contracts/test/TreasuryReserveGuard.t.sol`) makes both calls inside one external call, matching real execution.

## Question for maintainers

Is clearing transient storage between top-level calls of a test the intended default? If so, a note in the cheatcodes or testing docs would help guard authors.
