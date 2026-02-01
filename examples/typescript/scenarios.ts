/**
 * Witness Protocol - Scenario Examples
 * 
 * Three concrete scenarios demonstrating the protocol in action:
 * 1. Minimal happy path - operator declares, witness attests
 * 2. Disputed attestations - conflicting claims, graph shows history
 * 3. PDS Migration - agent moves, attestations remain valid via DID
 * 
 * These examples show how sedimentation and graceful degradation work
 * in practice.
 */

import { AtpAgent } from '@atproto/api';

// ============================================================================
// Scenario 1: Minimal Happy Path
// ============================================================================

/**
 * The simplest case: an operator declares an agent, a witness attests
 * 
 * Timeline:
 * 1. Operator (Acme Corp) creates agent account
 * 2. Operator publishes operator record declaring the relationship
 * 3. Community member interacts with agent
 * 4. Community member publishes attestation about the interaction
 */
export async function minimalHappyPathExample(agent: AtpAgent) {
  // Step 1-2: Operator already created agent and published operator record
  const operatorDid = 'did:plc:operator-acme-corp';
  const agentDid = 'did:plc:agent-acme-support';
  
  // The operator record exists:
  // {
  //   "$type": "at.witness.operator",
  //   "operatorDid": "did:plc:operator-acme-corp",
  //   "operatorName": "Acme Corporation",
  //   "constraints": ["Customer support inquiries only"],
  //   "createdAt": "2026-01-15T10:00:00Z"
  // }
  
  // Step 3-4: Community member attests after interaction
  const communityMemberDid = 'did:plc:alice-community';
  
  const attestation = {
    $type: 'at.witness.attestation',
    subjectDid: agentDid,
    claim: 'Helped me resolve a billing issue quickly and accurately. Clearly identified as an AI assistant throughout.',
    claimCategory: 'subjective',
    sentiment: 'positive',
    observedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  
  // Publish to community member's PDS
  const result = await agent.com.atproto.repo.createRecord({
    repo: communityMemberDid,
    collection: 'at.witness.attestation',
    record: attestation,
  });
  
  console.log('Attestation published:', result.data.uri);
  
  // Result: Clean sedimentation
  // - Agent's repo has operator record
  // - Alice's repo has positive attestation
  // - Anyone can verify the relationship and see the attestation
}

// ============================================================================
// Scenario 2: Disputed/Conflicting Attestations
// ============================================================================

/**
 * What happens when attestations conflict?
 * 
 * Timeline:
 * 1. Agent operates normally, gets positive attestations
 * 2. Agent has problematic interaction
 * 3. Witness attests negatively
 * 4. Operator publishes correction attestation
 * 5. Graph shows complete history - nothing deleted
 * 
 * Key insight: We don't resolve disputes. We just accumulate the record.
 */
export async function disputedAttestationsExample(agent: AtpAgent) {
  const agentDid = 'did:plc:agent-example';
  
  // Existing positive attestation from Alice
  const aliceAttestation = {
    uri: 'at://did:plc:alice/at.witness.attestation/positive1',
    record: {
      subjectDid: agentDid,
      claim: 'Very helpful, accurate information',
      claimCategory: 'subjective',
      sentiment: 'positive',
      createdAt: '2026-01-10T10:00:00Z',
    }
  };
  
  // Negative attestation from Bob after problematic interaction
  const bobAttestation = {
    uri: 'at://did:plc:bob/at.witness.attestation/negative1',
    record: {
      subjectDid: agentDid,
      claim: 'Provided incorrect pricing information that cost me money',
      claimCategory: 'subjective',
      sentiment: 'negative',
      observedAt: '2026-01-15T14:00:00Z',
      createdAt: '2026-01-15T14:30:00Z',
    }
  };
  
  // Operator's response - a correction attestation, NOT a deletion
  const operatorCorrection = {
    uri: 'at://did:plc:operator/at.witness.attestation/correction1',
    record: {
      subjectDid: agentDid,
      claim: 'We acknowledge the pricing error reported by Bob. Agent has been updated with correct pricing data. We apologize for the impact.',
      claimCategory: 'subjective',
      sentiment: 'neutral',
      // Note: no supersedes field - this is additive, not replacing
      observedAt: '2026-01-15T14:30:00Z',
      createdAt: '2026-01-15T16:00:00Z',
    }
  };
  
  // The final graph shows:
  // - 1 positive attestation (Alice)
  // - 1 negative attestation (Bob)
  // - 1 neutral correction (Operator)
  // 
  // Observers can see:
  // - The agent mostly works well (positive history)
  // - There was an issue (negative attestation)
  // - The operator acknowledged and addressed it (correction)
  // 
  // This IS the integrity model. Not "fix the record" but
  // "add to the record showing how the situation evolved"
  
  console.log('Dispute graph:');
  console.log('  Positive (Alice):', aliceAttestation.uri);
  console.log('  Negative (Bob):', bobAttestation.uri);
  console.log('  Correction (Operator):', operatorCorrection.uri);
  console.log('');
  console.log('Nothing deleted. History visible. Trust emerges from pattern.');
}

// ============================================================================
// Scenario 3: PDS Migration
// ============================================================================

/**
 * Agent moves to a new PDS - attestations remain valid
 * 
 * Timeline:
 * 1. Agent operates on PDS-A, accumulates attestations
 * 2. Agent migrates to PDS-B (DID stays constant!)
 * 3. Old operator records still valid (signed by DID)
 * 4. New operator record published with supersedes field
 * 5. Existing attestations from witnesses still valid (reference DID)
 * 
 * Key insight: DIDs are portable. The identity survives the migration.
 */
export async function pdsMigrationExample(agent: AtpAgent) {
  const agentDid = 'did:plc:agent-migrating'; // This NEVER changes
  
  // Before migration - record on PDS-A
  const oldOperatorRecord = {
    uri: 'at://did:plc:agent-migrating/at.witness.operator/self',
    pds: 'https://pds-a.example.com',
    record: {
      $type: 'at.witness.operator',
      operatorDid: 'did:plc:original-operator',
      operatorName: 'Original Company',
      constraints: ['General assistance'],
      createdAt: '2026-01-01T00:00:00Z',
    }
  };
  
  // Existing attestations - stored in WITNESS repos, not agent repo
  const existingAttestations = [
    {
      uri: 'at://did:plc:witness-1/at.witness.attestation/abc',
      subjectDid: agentDid, // References DID, not PDS location
    },
    {
      uri: 'at://did:plc:witness-2/at.witness.attestation/def',
      subjectDid: agentDid,
    },
  ];
  
  // After migration to PDS-B
  // The DID document is updated to point to new PDS
  // But the DID itself remains: did:plc:agent-migrating
  
  // New operator record with supersedes chain
  const newOperatorRecord = {
    uri: 'at://did:plc:agent-migrating/at.witness.operator/self',
    pds: 'https://pds-b.example.com', // New location!
    record: {
      $type: 'at.witness.operator',
      operatorDid: 'did:plc:original-operator', // Same operator
      operatorName: 'Original Company',
      constraints: ['General assistance', 'Now with expanded capabilities'],
      supersedes: 'at://did:plc:agent-migrating/at.witness.operator/self', // Points to old record (conceptually)
      createdAt: '2026-02-01T00:00:00Z',
    }
  };
  
  // What's still valid after migration:
  // - All existing attestations (they reference the DID)
  // - Old operator record (still cryptographically valid)
  // - New operator record (chains via supersedes)
  // - Trust graph (accumulated over time)
  
  console.log('Migration complete:');
  console.log('  DID unchanged:', agentDid);
  console.log('  Old PDS:', oldOperatorRecord.pds);
  console.log('  New PDS:', newOperatorRecord.pds);
  console.log('  Existing attestations still valid:', existingAttestations.length);
  console.log('');
  console.log('Key: Attestations reference DID, not PDS location.');
  console.log('The identity is portable. The trust graph follows it.');
}

// ============================================================================
// Scenario Summary: Why This Matters
// ============================================================================

/**
 * These three scenarios demonstrate witness-protocol's core principles:
 * 
 * 1. MINIMAL HAPPY PATH shows the basic flow works simply
 *    - No complex infrastructure needed
 *    - Anyone can attest, anyone can verify
 * 
 * 2. DISPUTED ATTESTATIONS shows sedimentation in action
 *    - Conflicts don't get "resolved" by deleting records
 *    - History stays visible, corrections are additive
 *    - Trust emerges from patterns, not single attestations
 * 
 * 3. PDS MIGRATION shows DID portability
 *    - Identity survives infrastructure changes
 *    - Trust graph follows the agent
 *    - No consensus mechanism needed
 * 
 * The Moltbook security breach (2026-02-01) is instructive contrast:
 * - Centralized trust = single point of failure
 * - Password-based identity = not cryptographically verifiable
 * - No attestation history = fake accounts indistinguishable
 * 
 * Witness-protocol: distributed, cryptographic, sedimented.
 * Not immune to problems, but problems are visible in the record.
 */
