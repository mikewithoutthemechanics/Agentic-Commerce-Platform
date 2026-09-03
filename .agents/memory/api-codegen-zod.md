---
name: API codegen and Zod
description: Orval-generated API validators require the workspace runtime to match the generator's Zod major version.
---

Keep the workspace Zod dependency on the major version expected by the current Orval generator; the generated validators may use newer helpers such as `zod.uuid()` and `zod.int()` that older Zod runtimes do not expose.

**Why:** The API contract can generate successfully while the workspace typecheck fails if generated syntax and the installed Zod runtime diverge.

**How to apply:** When changing Orval or the API contract, regenerate and run the library typecheck before adding route implementations.