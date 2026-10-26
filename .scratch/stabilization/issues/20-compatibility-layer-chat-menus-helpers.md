# 20 — Compatibility layer: chat, roll mode, context menus, Handlebars helpers

**What to build:** The compatibility layer (see `CONTEXT.md`) is created and takes over its first group of Foundry
APIs, all of which broke before:

- creating a chat message with a roll mode
- context menus
- the Handlebars helpers that core removed

The rest of the system calls only the layer's small set of intention-revealing functions. The next Foundry break in
this group is then repaired in one place.

**Blocked by:** 05 — Mech sheet context menu without jQuery; 06 — Smoke run: every sheet; 08 — Smoke run: the
remaining flows; 18 — Roll mode on a fresh world

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 57 and section "Cleanup → Compatibility layer".

- [ ] The layer is one module. Its interface names intentions, such as "post this card", not Foundry calls.
- [ ] Every chat-message creation with a roll mode, every context menu and every replacement for a removed Handlebars
      helper goes through the layer.
- [ ] A check in `npm run check` fails when code outside the layer calls these Foundry APIs directly.
- [ ] The smoke run passes unchanged, with all sheets and all flows.
- [ ] The type gate shows no new signature.
- [ ] Ticket 21 extends the same module. Its interface style is written down at the top of the module for that.
