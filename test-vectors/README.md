# Witness Protocol Test Vectors

Standardized test cases for validating witness-protocol implementations.

## Purpose

These test vectors ensure interoperability between different implementations by providing:

1. **Valid Records** - Examples that MUST be accepted
2. **Invalid Records** - Examples that MUST be rejected
3. **Edge Cases** - Boundary conditions for correct handling
4. **Validation Logic** - Expected behavior for each case

## Structure

```
test-vectors/
  valid/                    # Records that MUST parse and validate
    attestations/           # at.pane.witness.attestation
    disclosures/            # at.pane.witness.disclosure
    relationships/          # at.pane.witness.relationship
  invalid/                  # Records that MUST be rejected
    schema/                 # Schema violations
    semantic/               # Valid schema but invalid semantics
    temporal/               # Temporal constraint violations
  edge-cases/               # Boundary conditions
    unicode/                # Unicode handling
    limits/                 # Size and count limits
    federation/             # Cross-PDS scenarios
```

## Using Test Vectors

Each test vector file is a JSON array of test cases:

```json
[
  {
    "id": "valid-minimal-attestation",
    "description": "Minimal valid attestation with only required fields",
    "input": { },
    "expected": {
      "valid": true,
      "warnings": []
    }
  }
]
```

### For Validators

```typescript
import testVectors from './test-vectors/valid/attestations.json';

for (const vector of testVectors) {
  const result = validateAttestation(vector.input);
  assert(result.valid === vector.expected.valid);
}
```

### For Indexers

Indexers should be able to:
1. Parse all valid test vectors
2. Reject all invalid test vectors with appropriate errors
3. Handle edge cases gracefully (warnings, not errors)

## Contributing Test Vectors

When adding new test vectors:

1. Include a clear `id` and `description`
2. Document why the case matters
3. Specify exact expected behavior
4. Consider cross-implementation impact

## Categories

### Schema Validation
- Required field presence
- Type checking
- Enum value validation
- Array constraints

### Semantic Validation  
- DID format validation
- AT URI format validation
- Timestamp reasonableness
- Self-reference detection

### Temporal Validation
- `validFrom` before `validUntil`
- Reasonable timestamp ranges
- Supersession ordering

### Federation Validation
- Cross-PDS attestations
- Identity migration scenarios
- Relay consistency
