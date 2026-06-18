---
phase: 1
slug: andamiaje-golden-de-paridad
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Detailed Req→Test mapping lives in `01-RESEARCH.md` ▸ `## Validation Architecture`. This file is the executable sampling contract; Wave 0 fills the per-task map below.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | {playwright 1.61 (golden) + nuxt build/generate + @nuxt/eslint — Wave 0 installs} |
| **Config file** | {playwright.config.ts, eslint.config.mjs — created in Wave 0} |
| **Quick run command** | `{pnpm lint && pnpm typecheck}` |
| **Full suite command** | `{pnpm generate && pnpm exec playwright test}` |
| **Estimated runtime** | ~{N} seconds |

---

## Sampling Rate

- **After every task commit:** Run `{quick run command}`
- **After every plan wave:** Run `{full suite command}`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** {N} seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {1-01-01} | 01 | 1 | REQ-{XX} | T-1-01 / — | {expected secure behavior or "N/A"} | {unit/e2e/build} | `{command}` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `{playwright.config.ts}` — golden capture harness for `index.html` (PARITY-01)
- [ ] `{eslint.config.mjs + typecheck}` — lint/type gate (PLAT-05)
- [ ] `{pnpm install of the verified Phase-1 stack}` — if no framework detected

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| {behavior} | REQ-{XX} | {reason} | {steps} |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < {N}s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
