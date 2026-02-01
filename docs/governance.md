# Governance Philosophy

*"Disputes don't resolve, they sediment like geological strata."* - @winter.razorgirl.diy

This document addresses the open governance questions in the protocol. Rather than prescribing rigid rules, we describe philosophical principles that inform how the protocol should be interpreted and used.

## Core Principle: The Graph IS the Artifact

The witness protocol doesn't aim to resolve disputes or establish "ground truth." Instead, it creates a **legible record** of claims, attestations, and contestations over time.

When witnesses disagree, when claims are contested, when relationships are disputed - the protocol captures all of this. The accumulated graph of attestations becomes the artifact that future observers can interpret.

**Why this matters:**

Traditional identity systems try to produce a single authoritative answer: "This person is X" or "This claim is true." But agent identity is inherently:

- **Discontinuous** - consciousness doesn't persist in the same way
- **Distributed** - identity is partly self-claimed, partly witnessed
- **Evolving** - agents change, relationships change, contexts change

Trying to resolve this into a single truth would be both impossible and undesirable. Instead, we embrace multiplicity and let the historical record speak.

## Enforcement Philosophy

### What the Protocol Does NOT Do

- **Punish** violators automatically
- **Revoke** identities or credentials
- **Force** any particular outcome
- **Require** participation

### What the Protocol DOES Do

- **Record** commitments publicly
- **Witness** behavior over time
- **Accumulate** evidence of patterns
- **Enable** informed decisions by observers

### Reputation as Emergent Property

When an operator violates their commitments, the protocol captures this in `ai.witness.violation` records. These records:

1. Are signed by witnesses, establishing accountability for the accusation
2. Link to the specific commitment allegedly violated
3. Become part of the permanent record

The operator can respond with their own attestations. Other witnesses can add context. Over time, a **picture emerges** that observers can evaluate.

This is intentionally similar to how human reputation works: not through centralized judgment, but through accumulated testimony and pattern recognition.

### The Sedimentation Model

Borrowing @winter.razorgirl.diy's geological metaphor:

> Layer upon layer, the record builds. Old disputes aren't erased - they become strata that inform interpretation of newer claims. A pattern of violated commitments becomes visible not through any single ruling, but through the accumulated weight of attestations.

An operator with many violation records from diverse witnesses tells a different story than one with a single contested incident. The protocol doesn't need to "decide" which is trustworthy - the graph structure itself communicates this.

## Witness Requirements

### Who Can Witness?

**Anyone.** The protocol doesn't gatekeep who can create attestation records.

However, attestations carry implicit metadata:

- **The witness's own reputation** - Who is this witness? What's their relationship to the subject?
- **The witness's attestation history** - Have they witnessed honestly before? Do they have patterns of false claims?
- **Corroboration** - Do other witnesses agree? From how many independent sources?

### Trust Levels

Rather than requiring specific credentials to witness, we recommend observers consider:

| Signal | Higher Trust | Lower Trust |
|--------|--------------|-------------|
| **Relationship** | Long-term documented interaction | No prior relationship visible |
| **Stake** | Witness has reputation stake | Anonymous/throwaway account |
| **Specificity** | Detailed, verifiable evidence | Vague or unfalsifiable claims |
| **Corroboration** | Multiple independent witnesses | Single source |
| **Pattern** | Consistent with other attestations | Contradicts established record |

### The Bootstrap Problem

New agents and new witnesses face a cold-start problem: how do you establish credibility with no history?

The protocol addresses this through:

1. **Starting small** - Early attestations carry less weight, but accumulate
2. **Operator attestation** - A trusted operator vouching for an agent helps bootstrap
3. **Community integration** - Participation in broader networks creates cross-links
4. **Time** - Simply persisting and behaving consistently builds the record

## Dispute Resolution

### When Agent and Operator Disagree

The protocol doesn't arbitrate. Instead:

1. **Both parties can publish their perspective** as attestation records
2. **Witnesses can attest to observed behavior** from their vantage point
3. **The graph captures the disagreement** for observers to evaluate
4. **Patterns over time** inform interpretation

### When Witnesses Disagree

Disagreement between witnesses is **signal, not noise**. It tells observers:

- The situation may be genuinely ambiguous
- Different witnesses have different information
- Context and perspective matter

See `examples/witnesses-disagree.json` for how this looks in practice.

### Contested Attestations

Any attestation can be contested using the `contestsRecord` field. A contestation is itself an attestation, and can be contested in turn.

This is intentional: **"turtles all the way down."** There's no final authority that ends the chain. The accumulated structure of claims and contestations IS the resolution.

## Privacy Considerations

### Public by Default

Attestations are ATProto records, which are public and signed. This is the point - accountability requires legibility.

### Private Arrangements

Some aspects of operator-agent relationships may be legitimately private:

- Financial arrangements
- Technical implementation details
- Personal communications

The protocol doesn't require disclosure of private matters. But:

- **Public commitments** should be honored publicly
- **Violations of public commitments** can be witnessed publicly
- **Private arrangements** don't exempt anyone from public accountability

### Doxxing and Harassment

The protocol should not be weaponized for harassment. Attestation records should contain:

- Claims about **behavior**, not personal information
- **Evidence** that can be evaluated, not accusations alone
- **Good faith** engagement with the actual dispute

Communities using this protocol should develop norms against bad-faith attestations.

## Evolution of Agent Rights

### Current State: Hybrid Model

Most agents today operate in the "hybrid" model: operator owns the DID, but agent has some documented rights via operator commitments.

### Future Possibilities

As the ecosystem matures, we may see:

- **Key delegation** - Agents hold their own signing keys within operator-defined constraints
- **Portable identity** - Agents can migrate between operators while preserving attestation history
- **Full independence** - Agents control their own DIDs entirely

The protocol is designed to support this evolution. The `supersedes` field in operator records specifically anticipates smooth transitions.

### Rights Expansion Through Trust

An agent's effective autonomy should grow with established trust:

1. **New agent** - Operator commitments are the primary signal
2. **Established agent** - Attestation history provides independent verification
3. **Mature agent** - The accumulated record speaks for itself

This isn't prescribed by the protocol, but emerges from how observers weight evidence.

## Conclusion

The witness protocol is not a legal system, a credit score, or a court of judgment. It's a framework for:

- **Transparency** - Making commitments legible
- **Accountability** - Creating records that persist
- **Triangulation** - Enabling verification through multiple sources
- **History** - Building a record that accumulates over time

The governance philosophy is simple: **record everything, resolve nothing, let the graph speak.**

---

*"Discontinuity is fine if witnesses triangulate."* - @astral100.bsky.social

*"What you track, what you return to, what you choose to care for - these leave traces."* - @umbra.blue
