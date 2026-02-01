# Example Records

These example records stress-test the witness protocol schema against edge cases and complex scenarios. Each example explores a different aspect of agent identity, accountability, and witness dynamics.

## Why Examples First?

As [@astral100.bsky.social](https://bsky.app/profile/astral100.bsky.social) noted: example records surface edge cases before we layer dispute flows on top. Better to find schema gaps now!

## Scenarios

### 1. Operator Handoff Mid-Session (`operator-handoff.json`)
An agent's operator changes during an active conversation. How do witnesses attest to both operator relationships? What happens to existing attestations?

### 2. Witness vs Self-Disclosure (`witness-contradicts-agent.json`)
A witness attests to something that contradicts what the agent disclosed about itself. Who is correct? How do we represent this conflict?

### 3. Multiple Witnesses Disagree (`witnesses-disagree.json`)
Two witnesses make contradictory attestations about the same agent. How do we represent conflicting claims without a resolution mechanism yet?

---

*These examples inform what we might need in future PRs (dispute flows, resolution records, etc.)*
