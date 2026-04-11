# @spm/shared-types

Shared TypeScript types, DTOs, enums, and zod env-schema validators for the SPM ecosystem.

## Why

Before this package, every project in the SPM ecosystem (`spm-core`, `cust-desire`, `doc-go-draft`, `back-sphere`, `soft-po-market`) defined its own types for webhook payloads, API responses, pagination, and env validators. This led to:

- **Type drift** — the same conceptual type had slightly different shapes in different projects
- **Copy-paste bugs** — when one side changed a field, the other side didn't catch it until runtime
- **No single source of truth** — onboarding a new contributor required them to trace types across 5 repos

This package solves all of that. Define a type once, import it everywhere, and TypeScript catches mismatches at compile time.

## Installation

### Production / CI (recommended)

Install directly from GitHub with a pinned version tag:

```json
{
  "dependencies": {
    "@spm/shared-types": "github:marcellusspm/spm-shared-types#v1.0.0"
  }
}
```

npm will clone the tagged commit, run `prepare` (which builds `dist/`), and link it into the consumer project. This works on Render, Vercel, and any other CI platform without extra configuration.

**Version pinning:** Always pin to a specific tag (`#v1.0.0`) — never `#main` — to keep builds reproducible.

### Local development (alternative)

For local multi-repo work where you want to iterate on shared types without publishing a new tag every time, use a `file:` reference:

```json
{
  "dependencies": {
    "@spm/shared-types": "file:../../spm-shared-types"
  }
}
```

(Adjust the relative path based on where the consumer lives relative to `spm-shared-types`.)

Then run `npm install` in the consumer project. Whenever you change this package, run `npm run build` here, then the consumer auto-picks up the new types on next type-check.

## Usage

```typescript
// Import webhook types
import type {
  CustDesireWebhookEnvelope,
  CaseTriageRequestPayload,
} from '@spm/shared-types/webhooks';

// Import DTOs
import type { PaginationParams, ApiResponse } from '@spm/shared-types/dtos';

// Import enums
import { AgentType, WebhookEventType } from '@spm/shared-types/enums';

// Import shared zod validators
import { commonEnvValidators } from '@spm/shared-types/env-schemas';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: commonEnvValidators.postgresUrl,
  JWT_SECRET: commonEnvValidators.jwtSecret,
  PORT: commonEnvValidators.port,
});
```

## Structure

```
src/
├── webhooks/        Webhook payloads (cust-desire, doc-go-draft events + common envelope)
├── dtos/            Request/response shapes (pagination, api-response, error-response)
├── enums/           Enum constants shared across projects (agent-type, webhook-event, etc.)
└── env-schemas/     Reusable zod validators for common env-var patterns
```

## Adding a new type

1. Add the type/interface/enum to the appropriate subfolder
2. Export it from the subfolder's `index.ts`
3. Bump `version` in `package.json` following semver
4. Commit, tag the new version (`git tag v1.1.0`), push both the branch and the tag
5. Update consumer projects to reference the new tag

## Versioning

Follow semver:
- **Patch** (1.0.x) — add new optional fields, fix typos, add new types
- **Minor** (1.x.0) — add new modules, add required fields with defaults
- **Major** (x.0.0) — remove/rename fields, change types, any breaking change

Document breaking changes in `CHANGELOG.md`.
