# Pathfinder Friction Log — Ethereum Dev → Canton/Daml Onboarding Audit

**Track:** Track 2 — Sub-Track B (“Pathfinder” Friction Logs)  
**Author:** <your name/handle>  
**Date:** <YYYY-MM-DD>  
**Target persona:** Ethereum dev (Hardhat/Foundry), new to Daml/Canton  
**Scope:** Documentation + onboarding journey: local setup → first app → ledger API integration → attempt DevNet deploy → ecosystem tools (wallet/explorer)

---

## Table of Contents
1. Executive Summary  
2. Submission Checklist (Hackathon Requirements Mapping)  
3. Environment & Reproducibility  
4. Journey Map (Onboarding Steps + Friction Heatmap)  
5. Resources Audited  
6. Walkthrough Audit: Setup → First Run → First Contract  
7. Friction Log (Issue-by-Issue)  
8. Technical Cliffs (Minimum 3)  
9. What the Docs Do Well  
10. What the Docs Do Poorly  
11. Actionable Recommendations (Separated from Analysis)  
12. Proposed Documentation Restructure (Single “Golden Path”)  
13. Proposed Doc Patches (Before/After Snippets)  
14. Validation & Retest Plan  
15. Evidence Links (Videos / Screenshots / Logs)  
16. Appendix (Logs, Error Catalog, Glossary)

---

## 1) Executive Summary

### 1.1 What I audited
I evaluated the Canton developer onboarding experience from the perspective of an Ethereum developer trying to:
- understand the core Canton/Daml concepts,
- build a minimal Daml project,
- connect to a ledger API from a backend/frontend,
- and migrate from a local setup to DevNet tooling and ecosystem apps.

### 1.2 Key findings (Top friction points)
1) **Documentation is fragmented across multiple sources**, making it hard to discover the correct “starting point” and forcing constant context-switching.  
2) **No true from-scratch Quickstart:** the easiest path is a full-stack dApp tutorial, but it still relies on “bootstrap from an existing quickstart repo” rather than teaching a clean “start from 0” approach.  
3) **DevNet deployment path is brittle**: many steps, non-trivial prerequisites, inconsistent outcomes (works sometimes, fails sometimes).  
4) **Gated ecosystem tooling (wallets/apps)** requires invite/access codes; there is limited open-source integration guidance and fewer public sample repos.

### 1.3 Highest-impact fixes (Top actionable recommendations)
- Publish a single **“Golden Path: Start from Scratch → Local → DevNet”** doc section with no circular loops.  
- Provide **official minimal templates** (Daml-only, Backend-only, Frontend-only, Full-stack) that are generated via CLI (or a documented “init” flow).  
- Add a **DevNet Deploy Troubleshooting playbook** with error catalog + validation checkpoints.  
- Publish **open ecosystem integration guides** and a set of **public, runnable sample repos** for wallets/explorer + auth patterns.

### 1.4 Expected impact
These changes reduce onboarding time by:
- decreasing “search time” (finding the right doc/page),
- reducing reliance on pre-baked repos without teaching fundamentals,
- improving reliability and debuggability of DevNet deployment,
- and allowing developers to test integration without gated access.

---

## 2) Submission Checklist (Hackathon Requirements Mapping)

- ✅ **Open Source Repo:** contains this report + reproducibility notes + artifacts  
- ✅ **Meaningful Daml Engagement:** attempted project setup + ledger API integration + DevNet attempt  
- ✅ **Documentation Quality:** structured Markdown with actionable fixes and before/after patches  
- ⬜ **Terminal Screenshot with timestamp:** add screenshot here: `evidence/terminal_timestamp.png`  
- ⬜ **Demo video (2–5 min):** add link: `<link>`  
- ⬜ **Hurdle video (5–10 min):** add link: `<link>`

---

## 3) Environment & Reproducibility

> Replace with your actual environment info.

- OS: <macOS / Ubuntu / Windows WSL>  
- Toolchain: Java <version>, Docker <version>, Daml SDK/dpm <version>  
- Node/Python (if used): Node <version>, Python <version>  
- Network constraints: <VPN / corporate firewall / ports>  

### 3.1 Clean-room setup approach
- Started from a clean environment / new machine / clean Docker state  
- Followed official docs + official quickstart guidance  
- Logged errors and dead-ends encountered

---

## 4) Journey Map (Onboarding Steps + Friction Heatmap)

### Stage A — Discovery (Where do I start?)
**Goal:** identify “the canonical quickstart.”  
**Observed outcome:** multiple sources exist, each partially overlapping, making it unclear which is authoritative.

**High-friction indicators:**
- Different domains and “entry points” for docs/resources  
- No single “Start Here if you are new” page that links everything in a linear flow

### Stage B — Installation / prerequisites
**Goal:** install required components and validate they work.  
**Observed friction:** steps exist, but validation checkpoints and “known-good” expected outputs are not consistently provided.

### Stage C — First contract / first app
**Goal:** create a minimal Daml project and run it end-to-end.  
**Observed friction:** the path that “works fastest” is the full-stack tutorial, but it instructs bootstrapping from a quickstart repo instead of teaching from scratch.

### Stage D — Integrate backend/frontend
**Goal:** connect via ledger API (gRPC / JSON Ledger API) from an API server and a UI.  
**Observed friction:** fewer minimal integration examples; explanations can be abstract, while runnable samples are limited.

### Stage E — DevNet deployment
**Goal:** move from local to DevNet.  
**Observed friction:** many steps, brittle outcomes, “works sometimes,” unclear troubleshooting.

### Stage F — Ecosystem tooling (wallets/explorer/apps)
**Goal:** use wallets/apps to test real flows.  
**Observed friction:** several items are gated with invite/access codes; not enough open/public integration paths.

---

## 5) Resources Audited

### 5.1 Primary resources visited
- Digital Asset Build docs (Canton build docs): https://docs.digitalasset.com/build/3.4/index.html  [oai_citation:0‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  
- Canton docs landing (gated login redirect encountered): https://docs.canton.network/landing/landing  [oai_citation:1‡docs.canton.network](https://docs.canton.network/landing/landing)  
- Canton Foundation SV network status + DevNet/TestNet/MainNet doc links: https://canton.foundation/sv-network-status/  [oai_citation:2‡Canton Foundation](https://canton.foundation/sv-network-status/)  

### 5.2 Observed structure
The Build docs contain multiple tutorial entry points including “Getting started” and quickstart references  [oai_citation:3‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html), but the overall onboarding experience still feels non-linear when a dev is trying to go from zero → local → devnet.

---

## 6) Walkthrough Audit: Setup → First Run → First Contract

> Replace with the exact commands you ran and the exact stopping points.

### 6.1 What worked / fastest “happy path”
- The easiest path was a full-stack tutorial approach (frontend + backend + Daml), but it still instructs bootstrapping from an existing quickstart repo rather than building from scratch.

### 6.2 What I expected
A beginner-friendly flow that teaches:
1) init a Daml project,
2) write first template + choice,
3) build a DAR,
4) run locally,
5) connect backend to ledger API,
6) connect frontend to backend,
7) migrate to DevNet with clear checkpoints.

### 6.3 What happened
- The onboarding experience repeatedly loops back into “use the quickstart repo” rather than showing a from-scratch path.

---

## 7) Friction Log (Issue-by-Issue)

> Format used by each issue:
> - **Where**
> - **Symptom**
> - **Expected vs Actual**
> - **Why it matters**
> - **Suggested fix**
> - **Before/After patch idea**
> - **Evidence**

---

### Friction #1 — Fragmented documentation across multiple sources (HIGH)

**Where:** multiple doc entry points across domains  
- Build docs (Digital Asset)  [oai_citation:4‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  
- Canton docs landing (requires login / gated)  [oai_citation:5‡docs.canton.network](https://docs.canton.network/landing/landing)  
- Network status page linking to DevNet/TestNet/MainNet docs  [oai_citation:6‡Canton Foundation](https://canton.foundation/sv-network-status/)  

**Symptom:** As a new developer, it is unclear:
- which site is canonical,
- where the start-to-finish onboarding path lives,
- and where DevNet deploy steps should be learned.

**Expected vs actual:**
- Expected: one “Start Here” page that sequences everything linearly.
- Actual: knowledge is spread across multiple sites with different navigation styles, and one entry point can be gated.

**Why it matters:** Developers lose time and confidence before they even build anything. This is “search friction,” not technical learning.

**Suggested fix:** Create a single official “Start Here” doc that:
- links to the minimum set of pages,
- explains which docs are authoritative for what,
- and provides a linear “Golden Path” (local → integration → DevNet).

**Evidence:** Link redirect/gating observed on docs landing  [oai_citation:7‡docs.canton.network](https://docs.canton.network/landing/landing).

---

### Friction #2 — No true from-scratch Quickstart (HIGH)

**Where:** onboarding/tutorial paths lean toward quickstart repos and “Getting started” lists  [oai_citation:8‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  

**Symptom:** The easiest runnable approach is a full-stack tutorial that still asks you to bootstrap from a quickstart repo.

**Expected vs actual:**
- Expected: “init from zero” tutorial (Daml init + minimal API + minimal UI).
- Actual: “start from quickstart repo,” which works, but doesn’t teach how to assemble the project from first principles.

**Why it matters:** Bootstrapping accelerates demos but slows real learning: developers don’t understand how to create a new project without copying an existing repo.

**Suggested fix:** Add a “Start From Scratch” tutorial series:
- Part 1: Daml project init + first template/choice + DAR build  
- Part 2: Local ledger run + parties + upload  
- Part 3: Minimal backend (Node/TS/Python) integration via JSON Ledger API  
- Part 4: Minimal frontend that calls backend  
- Part 5: Migration from local to DevNet (with checklists)

---

### Friction #3 — DevNet deployment is high-effort and unreliable (HIGH)

**Where:** DevNet deployment information is surfaced indirectly (network status page + links)  [oai_citation:9‡Canton Foundation](https://canton.foundation/sv-network-status/)  

**Symptom:** Many steps; sometimes it doesn’t work at all (hard to diagnose why).

**Expected vs actual:**
- Expected: a “DevNet Deploy Guide” with step-by-step validation checkpoints and troubleshooting.
- Actual: deployment feels brittle; failure modes aren’t strongly documented for new devs.

**Why it matters:** If DevNet is unreliable to new devs, they can’t finish an end-to-end hackathon demo.

**Suggested fix:** Publish:
- a DevNet “preflight” script/checklist (ports, versions, auth, configs),
- a “known-good smoke test” and expected output,
- a troubleshooting guide mapping common errors → fixes.

---

### Friction #4 — Gated ecosystem apps/wallets + limited open integrations (MED-HIGH)

**Where:** ecosystem exploration  
**Symptom:** Many wallets/apps require access/invite codes; fewer open-source integration examples.

**Expected vs actual:**
- Expected: open sandbox tools or public test wallets for builders.
- Actual: gating blocks experimentation; sample repos and integration guides are limited.

**Why it matters:** Developers cannot validate real user flows quickly; third-party integration is slower.

**Suggested fix:**
- Provide public dev-mode wallets / demo accounts / non-gated “builder access”
- Publish open-source “wallet integration examples” (auth, signing, tx submission patterns)
- Curate a list of “fully open” sample dApps and libs.

---

## 8) Technical Cliffs (Minimum 3)

> A “Technical Cliff” = a point where devs are likely to get stuck hard without a clear escape route.

### Cliff #1 — “Where do I start?” is unclear (DOC ARCHITECTURE CLIFF)
- **Root cause:** multiple doc sources; no single canonical onboarding flow.  
- **Fix:** “Start Here” + Golden Path guide; explain doc boundaries.  
- **Impact:** prevents onboarding from even beginning.

### Cliff #2 — From-scratch path is missing (LEARNING CLIFF)
- **Root cause:** onboarding relies on quickstart repos; insufficient “init from zero” tutorial.
- **Fix:** from-scratch series + minimal templates generated via CLI.
- **Impact:** devs can demo, but struggle to build original projects.

### Cliff #3 — DevNet deploy lacks strong validation + troubleshooting (OPERATIONS CLIFF)
- **Root cause:** many steps; weak debug surface for beginners.
- **Fix:** preflight checklist, smoke test, error catalog, “expected output” screenshots.
- **Impact:** blocks end-to-end demos.

---

## 9) What the Docs Do Well

- **Conceptual explanation quality is strong:** Daml concepts, key ideas, patterns, and use cases are generally well covered in the Build docs structure (key concepts, patterns, references).  [oai_citation:10‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  
- The Build docs have a broad tutorial and reference navigation covering smart contract development, patterns, and APIs.  [oai_citation:11‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  

---

## 10) What the Docs Do Poorly (From a Beginner’s POV)

- **Hard to start as a beginner:** onboarding lacks a linear “start from scratch” route; “Getting started” options exist, but it’s not a true from-zero build path.  [oai_citation:12‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  
- **Hard to navigate between sources:** multiple sites, different navigation, and at least one gated landing that redirects to login.  [oai_citation:13‡docs.canton.network](https://docs.canton.network/landing/landing)  
- **Circular linking:** pages tend to route back into quickstart repos rather than teaching foundations.  
- **Less runnable integration guidance:** fewer minimal sample repos for ledger API integration and wallet/explorer patterns.

---

## 11) Actionable Recommendations (Separated from Analysis)

### 11.1 Documentation flow (Highest priority)
**Create a single onboarding section** with this sequence (no circular loops):
1) **Intro (What is Canton? What is Daml? Mental model for EVM devs)**  
2) **Installation & prerequisites (with a verification checklist)**  
3) **Start-from-scratch tutorial (Daml-only → backend → frontend)**  
4) **Wallet/explorer integration (public dev tooling)**  
5) **Migration: localnet → DevNet (with validation + troubleshooting)**  

### 11.2 Reduce fragmentation
- Put a canonical “Start Here” page in one place, link outward only when needed.
- On every external link, add a “You are leaving the main onboarding flow” callout.

### 11.3 Improve DevNet reliability and support
- Add a **DevNet deployment playbook** with:
  - checkpoints (what should be true at each step),
  - smoke test script,
  - error catalog (common error text → root cause → fix).

### 11.4 Un-gate the builder experience (or provide open alternatives)
- Provide non-gated dev wallets / demo accounts.
- Publish open-source integration examples and templates.

---

## 12) Proposed Documentation Restructure (Single “Golden Path”)

### Proposed “Canton Builder Guide” (one section)
**Canton Builder Guide**
- 0. Start Here (10 min)
- 1. Install & Verify Toolchain (15 min)
- 2. Daml From Scratch (30–45 min)
- 3. Connect a Backend (JSON Ledger API) (30–60 min)
- 4. Connect a Frontend (15–30 min)
- 5. Local Testing & Debugging (30 min)
- 6. Deploy to DevNet (60–120 min)
- 7. Wallet/Explorer Integration (30–60 min)
- 8. Troubleshooting & Error Catalog (living doc)
- 9. Reference Appendices (links to deeper docs)

Key rule: **each chapter ends with a validation checkpoint** (commands + expected outputs).

---

## 13) Proposed Doc Patches (Before/After Snippets)

### Patch #1 — Add a canonical “Start Here” page
**Before:** multiple entry points across domains; unclear canonical start.  [oai_citation:14‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  
**After (proposed text):**
> “New to Canton? Start here. This guide takes you from zero to deploying your first Daml app locally, integrating a backend, and migrating to DevNet. If you only follow one doc, follow this one.”

### Patch #2 — Add “Start From Scratch” tutorial (explicitly not a quickstart repo)
**Before:** tutorial paths often rely on bootstrapped quickstart repos.  [oai_citation:15‡docs.digitalasset.com](https://docs.digitalasset.com/build/3.4/index.html)  
**After (proposed structure):**
- Step 1: create Daml project (init)
- Step 2: write template + choice
- Step 3: build DAR
- Step 4: run locally + allocate parties
- Step 5: call JSON Ledger API from a minimal backend
- Step 6: call backend from minimal frontend

### Patch #3 — DevNet deployment validation checkpoints
**After (proposed checklist format):**
- Checkpoint A: “You can query ledger endpoint”
- Checkpoint B: “You can allocate a party”
- Checkpoint C: “You can upload a DAR”
- Checkpoint D: “You can submit a transaction”
- If any fails → link to troubleshooting entry

### Patch #4 — Publish open integration sample repos
**After (proposed):**
- `canton-min-daml` (Daml only)
- `canton-min-backend-json-ledger` (backend only)
- `canton-min-frontend` (frontend only)
- `canton-min-fullstack` (end-to-end)
- `canton-wallet-integration-examples` (auth/sign/submit patterns)

---

## 14) Validation & Retest Plan

When these doc changes are applied, validate via:
1) A fresh machine can complete “Start Here” in under 2 hours  
2) DevNet deploy is reproducible with checkpoints  
3) Wallet/explorer integration can be tested without gated access  
4) At least 3 real Ethereum devs can complete it without mentor help

---

## 15) Evidence Links (Videos / Screenshots / Logs)

- 2–5 min demo video: <link>
- 5–10 min hurdle explanation: <link>
- Timestamp terminal screenshot: `evidence/terminal_timestamp.png`
- Key screenshots:
  - `evidence/docs_fragmentation.png`
  - `evidence/devnet_failure.png`
  - `evidence/gated_wallet.png`
- Full logs:
  - `evidence/logs/setup.log`
  - `evidence/logs/devnet_attempt.log`

---

## 16) Appendix

### A) Error Catalog (template)
| Error snippet | Likely cause | Fix | Doc link |
|---|---|---|---|
| `<paste>` | `<cause>` | `<fix>` | `<link>` |

### B) Glossary (template)
- **Participant:** …
- **Party:** …
- **DAR:** …
- **JSON Ledger API:** …
- **gRPC Ledger API:** …

---

## 17) Mental Model for Ethereum Developers (Canton Terms ↔ EVM Terms)

> Goal: help an EVM (Solidity/Hardhat/Foundry) developer build an accurate mental model quickly, without forcing them to unlearn everything at once.

### 17.1 One-paragraph intuition
If Ethereum is “a global shared computer where anyone can read state and call contracts,” Canton is closer to “a **confidential multi-party business network** where **only the parties to an agreement see that agreement’s data**, and smart contracts (Daml) define **rights, obligations, and workflows** between parties. Instead of writing a public contract that manages shared state for everyone, you model **contracts-as-agreements** and **choices-as-authorized actions** that specific parties can execute, with privacy baked into the platform.

### 17.2 Key mindset shifts (what to unlearn / relearn)
1) **State is not globally readable by default.**  
   - EVM: most on-chain state is public.  
   - Canton: data is scoped to participants/parties; privacy is the default design goal.

2) **Model “agreements” not “storage.”**  
   - EVM: you design storage variables + functions that mutate them.  
   - Daml: you define contract templates (agreements) and choices (transitions), and let the ledger manage lifecycle.

3) **Authorization is first-class.**  
   - EVM: `msg.sender` checks, roles, modifiers; data is still publicly visible.  
   - Daml/Canton: every choice has explicit controllers/signatories/observers; visibility and permission are linked.

4) **“Transactions” are workflow transitions.**  
   - EVM: transactions call functions; logs/events used for off-chain indexing.  
   - Daml: exercising a choice creates archived/created contracts; the ledger API is how apps observe and react.

5) **Integration feels more like enterprise systems than DeFi tooling.**  
   - Expect more emphasis on identities/parties, participant nodes, ledger APIs, and governance/permissions.

---

### 17.3 Canton Terms ↔ EVM Terms Mapping Table

| Canton / Daml Term | Closest EVM / Solidity Mental Model | What’s Similar | What’s Different (Important) |
|---|---|---|---|
| **Daml template** | `contract` + “data schema” | Defines structure + allowed actions | Not a deployed address; it’s a *type* of agreement, instantiated as contracts |
| **Contract instance** (created from template) | Deployed contract state / struct instance | Represents stateful object | Visibility is private to involved parties; lifecycle is create/archive, not mutable storage variables |
| **Choice** | `function` / method call | Action that changes state | Must define controllers (who can call); often results in create/archive of contracts |
| **Exercise a choice** | Sending a tx calling a function | Executes logic | Produces ledger transactions affecting contracts; privacy and authorization enforced by ledger |
| **Signatory** | Owner role / required signer | “Must approve / is a principal” | Determines who must sign and who sees the contract; deeper than role checks |
| **Observer** | Event subscriber / read-permission role | Can “see” | Observers can view contract but may not be able to act on it |
| **Controller** (of a choice) | `msg.sender` authorization check | Who can call | Explicitly defined per choice; enforced by platform |
| **Party** | EOA / identity / account | Entity that acts | Not just a keypair; a ledger identity used across workflows |
| **Participant node** | RPC provider + state execution context | Runs system for clients | Participant hosts ledger API and manages party’s interaction with ledger; more “node per org” flavor |
| **Ledger** | Blockchain state / chain | Source of truth | Not public-by-default; confidentiality and participant governance are central |
| **Transaction** (ledger tx) | Ethereum transaction | State transition | Often represents multi-party workflow step; results are scoped to parties |
| **Contract key** | Mapping key / unique id | Uniqueness constraint | Used to locate contracts; think “unique index” rather than address |
| **Archive** | Burn / delete / finalize | Ends lifecycle | Archiving is normal and explicit; often paired with creating a successor contract (state machine) |
| **Create** | Deploy / mint / instantiate | New object/state | Creates a new contract instance with defined stakeholders |
| **Disclosed contracts** | Off-chain proofs / private state sharing | Sharing limited info | Some data may be shared selectively; confidentiality controls matter |
| **gRPC Ledger API** | JSON-RPC / Ethereum client API | App ↔ chain interface | Different primitives: contracts, choices, events; not EVM calls |
| **JSON Ledger API** | REST-ish abstraction | Easier integration | Still speaks ledger concepts, not EVM ABI calls |
| **DAR package** | Compiled contract artifact (bytecode) | Deployable unit | Not EVM bytecode; it’s a Daml archive of packages uploaded to the ledger |
| **Sandbox / localnet** | Anvil/Hardhat node | Local dev chain | Developer “ledger” for testing workflows and integrations |

---

### 17.4 “Solidity instinct” translations (quick examples)

#### A) “I want a global registry mapping address → balance”
- **EVM instinct:** `mapping(address => uint256) balances;`
- **Canton/Daml mental model:** model **Balance** as a contract held by a party (or pair of parties) with authorized choices to transfer/adjust.  
  - Instead of a single global mapping, you create contract instances where stakeholders can see and act.

#### B) “I emit an event so frontend can index it”
- **EVM instinct:** `emit Transfer(from, to, amount);`
- **Canton/Daml mental model:** apps **stream transactions/events from the ledger API** filtered by party visibility; “events” are effectively contract create/archive/exercise events scoped to parties.

#### C) “I use `onlyOwner` modifier for admin actions”
- **EVM instinct:** `require(msg.sender == owner)`
- **Canton/Daml mental model:** define a choice with `controller adminParty` (or signatories) and optionally restrict visibility to stakeholders.

---

### 17.5 Suggested doc addition (high leverage)
Add this mapping section directly inside the “Start Here / Golden Path” onboarding so Ethereum developers:
- understand privacy-by-default early,
- stop searching for “contract address” equivalents,
- and understand ledger APIs as the main integration surface.
