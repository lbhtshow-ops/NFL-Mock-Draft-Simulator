# Canonical Prospect Identifier Supabase Test Project Primary-Branch Authorization Amendment

## Stage 1 blocker and resolution

Stage 1 was blocked because the controlled-deployment runbook required an explicit non-production classification while Supabase Dashboard displayed `PRODUCTION` for `main`. Existing repository authority did not distinguish Supabase’s platform branch topology from LBHT’s governed deployment environment. This additive amendment makes both axes explicit without weakening any production prohibition.

## Terminology and classification

`platformBranchRole` records Supabase topology. For this exact project, `main` has role `PRODUCTION_PRIMARY_BRANCH`, is primary rather than preview, and has the observed platform label `PRODUCTION`.

`governedDeploymentEnvironment` records LBHT operational authority. It remains `DEDICATED_NON_PRODUCTION_TEST`: dedicated, non-production, test-only, production-prohibited, and prohibited from creating canonical identities or canonical records or using production data.

Both axes are independently required. The platform label is not meaningless and is not ignored. It also cannot, by itself, grant LBHT production authority or override the exact project authorization.

## Exact target and scope

- Organization: `Lunch Break Hot Take`
- Project: `LBHT FID Persistence Test`
- Project ID: `ahmorpzcaapvoymiqlkv`
- Region: `us-east-1`
- Branch: `main`
- Platform branch role: `PRODUCTION_PRIMARY_BRANCH`
- Observed platform label: `PRODUCTION`
- Governed environment: `DEDICATED_NON_PRODUCTION_TEST`
- Authorization scope: `CANONICAL_PROSPECT_IDENTIFIER_NON_PRODUCTION_PERSISTENCE_TRANSACTION_DEPLOYMENT`
- Migration: `014`
- Approved SHA-256: `18EC78EE6F820CE5E47DE5F71AEB2ADE413046487FFC0CA5BAC7CC2E6BF574AD`
- Prohibited SHA-256: `3B271BC994D82C8109CDE4E62E6A1F85A67E49F86C5D98FBD0EBA46D6D214F13`

The project ID is authoritative because display names can be duplicated or changed. A matching display name with a different project ID is blocked. No field supports a wildcard, and this authorization cannot transfer to another project, branch, migration, runtime, or deployment.

## Exact authorization statement

The Supabase Dashboard PRODUCTION label observed on branch main identifies the primary branch role within project ahmorpzcaapvoymiqlkv. It does not reclassify the containing LBHT FID Persistence Test project as an LBHT production environment. This exact branch is authorized solely as the primary branch of the dedicated non-production test project for the controlled deployment of corrected migration 014.

## Production prohibition

The amendment does not authorize the LBHT website production database, any user-facing production project, production Edge Functions, production secrets, production traffic, production prospect issuance, production data, canonical identity or record creation, FIIS promotion, simulator registration, or reuse for another project or migration. It does not authorize SQL, deployment, database access, Supabase access, persistence, UUID generation, candidate generation, or collision checks.

## Stage 1 decision procedure

The deterministic evaluator requires exact organization, project name, project ID, region, branch, observed platform label, both classification axes, migration ID, corrected hash, active and unpaused state, and the operator’s test-only confirmation. Any mismatch blocks. An absent platform-label observation requires review. The prohibited original hash always blocks.

Passing evaluation restores only `READY_TO_REPEAT_CONTROLLED_DEPLOYMENT_STAGE_1`. The operator must repeat Stage 1 against the observed target. Stage 2 remains prohibited until Stage 1 actually passes and separate authorization is given. The remaining read-only target preflight is mandatory after that authorization.

## External review evidence

These references explain Supabase terminology but are not repository authority:

- Supabase, Deployment & Branching: https://supabase.com/docs/guides/deployment
- Supabase, Managing Environments: https://supabase.com/docs/guides/deployment/managing-environments

## Exact next action

Repeat Controlled Deployment Stage 1 against the authorized exact target. Verify every value in the additive Stage 1 supplement, record the sanitized result, and stop. Do not begin Stage 2 without separate authorization.
