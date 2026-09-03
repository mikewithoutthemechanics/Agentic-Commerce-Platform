---
name: Payment provider boundary
description: Requested payment providers must remain explicit when an integration is unavailable.
---

Do not silently replace a requested payment provider with another provider; keep the adapter explicit and fail clearly until the requested provider is configured or the user approves a supported alternative.

**Why:** Payment behavior changes affect merchant operations, settlement, callbacks, and compliance boundaries.

**How to apply:** Resolve integrations before enabling checkout, and require a deliberate provider choice before changing the gateway contract.