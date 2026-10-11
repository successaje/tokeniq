# 0002 — Deterministic engine decides; AI explains

**Context.** Financial recommendations must be reproducible and auditable, and they must not be steerable by prompt injection hidden in invoice text or venue names.

**Decision.**
- `@tokeniq/core` is pure, deterministic and exhaustively tested. It computes every figure, recommendation and policy check.
- The copilot calls read-only tools that wrap the engine and must cite the records it uses.
- The copilot cannot create, approve, sign or execute anything.
- Model output is never converted into an action. Actions are created by people through the normal proposal flow, and the engine re-validates each one.

**Consequences.**
- Identical inputs produce identical recommendations (fingerprinted, so they are not re-raised).
- The product works fully without the AI.
- Prompt injection can at worst make an explanation wrong; it cannot cause an action.
