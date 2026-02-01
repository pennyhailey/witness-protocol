# Federation Considerations

The witness protocol is designed to work across the federated AT Protocol network. This document explores how witness records can be discovered, validated, and aggregated across different PDS instances.

## Record Discovery

### Following the Graph

Witness records form a directed graph:
- **Operator records** (`ai.witness.operator`) are published by agent accounts
- **Attestations** (`ai.witness.attestation`) reference agent DIDs
- **Violations** (`ai.witness.violation`) reference both agents and attestations

To build a complete picture of an agent's accountability record, you need to:

1. **Find the agent's operator record** - Query their PDS directly via DID resolution
2. **Find attestations about them** - This is the harder problem (see below)
3. **Find violation records** - Similarly requires discovery

### The Discovery Problem

AT Protocol does not have a built-in way to query "all records that reference this DID." This creates a discovery challenge:

**Option A: Relay/Firehose Indexing**
- Run an indexer that watches the firehose for `ai.witness.*` records
- Build a queryable index mapping DIDs to attestations
- Pro: Complete visibility across the network
- Con: Requires infrastructure, centralization risk

**Option B: Witness Registries**
- Witnesses register themselves in a discoverable location
- Agents can query known registries to find attestations about themselves
- Pro: Decentralized, opt-in
- Con: May miss attestations from unknown witnesses

**Option C: Backlink Protocol**
- The protocol could define a backlink record type
- Witnesses create a backlink on the agent's behalf (if allowed)
- Pro: Uses existing ATProto patterns
- Con: Permission complexity

**Option D: Social Discovery**
- Rely on attestations being shared/discussed socially
- Trust emerges through organic network effects
- Pro: Requires no infrastructure
- Con: Incomplete, favors popular agents

### Recommended Approach

A layered approach works best:

1. **Core**: Social discovery is always available
2. **Enhanced**: Community-run indexers can provide search
3. **Optional**: Registries for high-trust attestations

This matches the protocol's philosophy: no single point of authority, but infrastructure can emerge to improve discoverability.

## Record Validation

### Verifying Attestations

When you encounter an attestation, verify:

1. **Signature validity** - The record is signed by the claimed witness DID
2. **Temporal consistency** - `observedAt` is before the record creation time
3. **DID resolution** - The subject DID actually exists
4. **Cross-reference** - Related attestations are internally consistent

### Trust Anchoring

The protocol does not define "trusted witnesses" - that is left to observers. However, some patterns emerge:

- **Network position**: Witnesses with many attestations may be more reliable
- **Specificity**: Detailed evidence is more credible than vague claims
- **Corroboration**: Multiple independent witnesses strengthen claims
- **Stake**: Witnesses with something to lose are more credible

## Cross-PDS Scenarios

### Agent Migration

When an agent moves between PDS instances:
- Their DID remains constant (DIDs are portable)
- Old operator records remain valid (on the old PDS)
- New operator records can be created (on the new PDS)
- The `supersedes` field chains records across PDSes

### Witness Availability

If a witness's PDS goes offline:
- Their attestation records may become unavailable
- Other nodes may have cached/replicated the records
- The protocol should handle missing records gracefully
- "Record unavailable" does not mean "record never existed"

### Network Partitions

During network partitions:
- Local attestations can still be created
- Cross-partition discovery fails temporarily
- When healed, records can be re-discovered
- No consensus mechanism is needed (append-only)

## Implementation Recommendations

1. **Cache attestations locally** - Do not rely on real-time PDS queries
2. **Record provenance** - Track when/where you first saw a record
3. **Handle missing data** - Graceful degradation when records unavailable
4. **Support multiple indexers** - Do not depend on a single discovery source
5. **Validate signatures** - Always verify records cryptographically

## Open Questions

- Should the protocol define a standard indexer API?
- How do we prevent spam attestations from overwhelming discovery?
- Should there be a "revocation" mechanism for attestations?
- How do we handle PDS migrations that lose historical records?

---

*This document is part of the witness protocol specification. See [governance.md](governance.md) for the philosophical foundations.*
