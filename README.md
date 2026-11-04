# Family Intelligence OS

Deployable runtime for the Family Intelligence System initiative.

This repo is the orchestration layer: Next.js portal, MCP gateway, connector contracts, policy engine, audit layer, and deployment scaffolding for self-hosted family infrastructure.

## Architecture

- `apps/web`: Next.js App Router portal for family overview, connectors, audit, and security posture.
- `apps/mcp-gateway`: controlled MCP gateway with static tool allowlist.
- `apps/admin`: placeholder internal admin surface.
- `packages/family-core`: domain roles, sensitivity, action, member, resource, and policy types.
- `packages/family-security`: deny-by-default policy engine plus opaque, server-resolved trusted-transition admission for federation, community authority, jurisdiction, and deaccession.
- `packages/family-audit`: audit event types and writers.
- `packages/family-claims`: claim lifecycle and steward-only authority transitions.
- `packages/family-evidence`: source, rights, sensitivity, and publication checks.
- `packages/family-consent`: purpose-specific, revocable consent receipts.
- `packages/family-succession`: separate emergency, incapacity, and death release gates.
- `packages/family-gedcom`: deterministic GEDCOM 7 interoperability projection for already-approved export data.
- `packages/family-export`: encrypted export-manifest and scope/exclusion authorization contract.
- `packages/family-intake`: one-time intake tokens, quarantine-first cases, attachment policy, and human-only decision transitions.
- `packages/family-jurisdiction`: strict canonical snake-case pack parsing, versioned validation, and fail-closed routing to qualified human review.
- `packages/family-config`: machine-readable manifests and action allowlists for all governed family agents.
- `packages/family-connectors`: adapter contract and manifest schema.
- `packages/family-mcp`: strict tool schemas, trusted server-side actor binding, safe handlers, and sanitizers.
- `agent-packs/family-guardian-network`: Guardian, documentation, research, household, gathering, elder, contact, and personal-hub agent concept.

## Defaults

- Adapter-first; no upstream app code is vendored.
- Read-only connectors in MVP.
- Writes and exports are blocked or confirmation-required.
- Raw sensitive data should remain in family-owned systems.
- MCP is a controlled gateway, not an open tool buffet.
- MCP callers cannot supply their family, actor, or role. A trusted server binding resolves identity before policy evaluation.
- Personal hubs are private-first; contributions to family or public libraries require approval and Guardian review.
- Family history enters as a claim, never as an accepted fact.
- Living people are private by default; children cannot enter the public archive.
- AI cannot accept claims, merge identities, contact relatives, publish, verify death, release access, deaccession artifacts, or override community authority.
- Publication fails closed unless child impact and living-person consent review inputs are explicitly supplied.
- Research-only, missing, invalid, expired, conflicting, superseded, unsupported, or repository-unresolved jurisdiction packs block processing; portable receipt fields are not trusted, and a reviewed pack only routes to qualified human review.
- Agent actions require a fresh, one-operation opaque authorization context bound to the authoritative operation timestamp plus tenant, authenticated actor, agent, action, resource, scope, issuer, policy version, validity, and revocation. Consumption re-queries the deployment-owned authoritative repository before admitting the operation; cached contexts, later-recorded revocations, and caller-authored scope flags are rejected. The Open-Source Maintainer Agent has no private-tenant access and cannot merge its own work or use real family fixtures.
- The ordinary `@family/security` package exports no repository, issuer, resolver, or server constructor. Its non-exported resolver seam is restricted to internal tests until a sovereign deployment-owned authorization service and dependency boundary are independently reviewed; request handlers and agents therefore cannot bootstrap trust through package imports.
- Persisted audit metadata uses a bounded positive allowlist of scalar fields; unknown keys, nested containers, cycles, oversized values, and raw private text are rejected.
- Succession trigger evidence requires a strict timezone-bearing RFC 3339 instant and rejects future verification times.

## German portal

`/de/portal` is the German-first private surface. Production is locked until a real family-scoped session is wired. A synthetic zero-record preview is available only outside production when `FAMILY_PORTAL_DEMO=true`.

No real relative names or family records belong in repository fixtures. The UI demonstrates circles and review states with generic labels only.

## Secure intake

`@family/intake` turns submissions into quarantined cases. It can generate hashed, expiring, single-use tokens and assess baseline attachment eligibility, but it never accepts a claim. Actual upload storage, magic-byte inspection, malware scanning, identity re-verification, and notification delivery remain adapter boundaries that must fail closed.

## Reusable templates

- `templates/vercel-family-portal`: Vercel project settings and environment contract.
- `templates/v0-family-portal`: a safety-bounded v0 prompt and acceptance checklist.
- `templates/private-family-pilot`: a policy-only German pilot manifest with no personal records.
- `vercel.json`: one-path monorepo build for `@family/web`.

[Deploy the locked template to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Ffamily-intelligence-os%2Ftree%2Fcodex%2Ffamily-intelligence-2026-10-02&project-name=family-intelligence-portal&repository-name=family-intelligence-portal). The clone is intentionally not a production-ready family vault: it stays locked until identity, private storage, scanning, audit persistence, export/restore, and human approval gates are connected.

## Local Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @family/web dev
```

## Deployment

The first deployment target is a Vercel preview for `apps/web`. Production promotion requires authentication, privacy, restore, accessibility, and audit review. See `templates/vercel-family-portal/README.md`.

## Family legacy workspace (2026-10-02)

The dashboard now connects capture, source-linked graph concepts, next-generation learning, workflow packs and runtime setup. [Architecture and actual maturity](docs/sovereign-family-workspace.md) · [Library OS bridge](docs/library-bridge.md) · [Ontology](docs/ontology-engineering.md) · [Portable plugin](plugins/family-intelligence/) · [Railway](infra/railway/README.md). Capture downloads a local private draft; private vault persistence and runtime connectors are not yet activated.

### Sunday Stories founder kit

[Sunday Stories](templates/sunday-stories/README.md) is a separately deployable, MIT-licensed fieldbook. Prepare an activity for a phone, schedule a visit in a calendar, record and export a story locally, or review a teacher’s learning card. The kit has no family identity, archive or model credentials. Its setup codes carry no portal permissions. [Product and deployment decisions](docs/sunday-stories-release.md).
