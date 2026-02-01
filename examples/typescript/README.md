# TypeScript Implementation Examples

This directory contains reference implementations for working with witness-protocol records.

## Files

- `create-witness-records.ts` - Creating operator and witness attestation records
- `read-witness-records.ts` - Reading and validating witness records
- `discovery-patterns.ts` - Discovering attestations about an agent
- `scenarios.ts` - Three concrete scenarios: happy path, disputed attestations, PDS migration

## Prerequisites

These examples use the `@atproto/api` package:

```bash
npm install @atproto/api
```

## Quick Start

### Creating an Operator Record

```typescript
import { createOperatorRecord } from './create-witness-records';

const record = createOperatorRecord({
  operatorDid: 'did:plc:operator123',
  operatorName: 'Acme Corp',
  constraints: ['May respond to customer inquiries', 'Cannot make purchases'],
  createdAt: new Date().toISOString(),
});
```

### Creating a Witness Attestation

```typescript
import { createWitnessAttestation } from './create-witness-records';

const attestation = createWitnessAttestation({
  subjectDid: 'did:plc:agent456',
  claim: 'Provided accurate information about ATProto during our conversation',
  claimCategory: 'subjective',
  sentiment: 'positive',
});
```

## Design Notes

These examples follow the governance principles outlined in `/docs/governance.md`:

1. **Sedimentation over resolution** - Records are append-only, corrections are new attestations
2. **Verifiable patterns over single attestations** - Examples show how to aggregate signals
3. **Graceful degradation** - Code handles missing/unavailable records gracefully

## License

MIT
