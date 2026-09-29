# Quellight Vision

**Status:** Greenfield product vision, proposed baseline  
**Repository:** radz2291/VICT-Quellight

## Product sentence

Quellight is a persistent cognitive partner: a distinct intelligence that maintains useful continuity with a user across time, helps understand and act on an evolving shared world, and remains inspectable, bounded, and subordinate to user authority.

## Product promise

Quellight should feel light to use even if sophisticated machinery exists underneath it.

The user should experience:
- continuity without repeatedly re-explaining everything;
- relevant memory without a giant hidden profile;
- clear distinction between what was said, inferred, proposed, confirmed, changed, or unresolved;
- useful initiative without noisy or presumptuous autonomy;
- reasoning that can use durable knowledge and current context;
- actions that remain governed and attributable;
- correction and recovery when the system is wrong.

## Engineering philosophy

Quellight is not the place to invent infrastructure that mature frameworks already provide.

We prefer:
1. existing proven framework capability;
2. VICT-native wrapper/capability boundary;
3. composition inside Quellight;
4. custom implementation only for a demonstrated unsatisfied requirement.

The product should therefore remain mostly:
- Quellight semantics;
- Quellight policies;
- Quellight prompts/instructions;
- Quellight UI;
- composition of reusable VICT capabilities.

## Greenfield rule

This repository does not preserve compatibility with any previous Quellight implementation.

Older implementations may be studied only if an explicit owner decision requests it. They are not an architectural source of truth.

## Success direction

A successful Quellight can eventually:
- converse naturally;
- retrieve relevant durable knowledge;
- distinguish grounded state from interpretation;
- preserve evolving meaning across time;
- surface unresolved or important matters appropriately;
- propose durable changes without silently making them true;
- use tools/actions through governed VICT capabilities;
- survive model/provider changes without losing its product identity.

## Non-goals

Quellight is not:
- a new general-purpose agent framework;
- a replacement for Mastra;
- a replacement for Cognee;
- a new graph/vector database;
- a universal AI framework every app must use;
- an excuse to duplicate VICT runtime/control semantics;
- an autonomous system with self-granted authority.
