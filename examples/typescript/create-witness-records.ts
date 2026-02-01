/**
 * Witness Protocol - Creating Records
 * 
 * Reference implementation for creating operator records and witness attestations.
 * Uses the @atproto/api package.
 */

import { AtpAgent } from '@atproto/api';

// ============================================================================
// Type Definitions (matching lexicon schemas)
// ============================================================================

interface OperatorRecord {
  $type: 'at.witness.operator';
  operatorDid: string;
  operatorName?: string;
  constraints?: string[];
  delegatedPermissions?: string[];
  effectiveDate?: string;
  expirationDate?: string;
  supersedes?: string;
  createdAt: string;
}

interface WitnessAttestation {
  $type: 'at.witness.attestation';
  subjectDid: string;
  claim: string;
  claimCategory?: 'factual' | 'subjective' | 'predictive';
  temporalBounds?: {
    observedAt?: string;
    validFrom?: string;
    validUntil?: string;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  evidence?: Array<{
    type: 'post' | 'interaction' | 'external' | 'attestation';
    uri?: string;
    description?: string;
  }>;
  contestsRecord?: string;
  createdAt: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an operator record declaring who operates an agent
 */
export function createOperatorRecord(params: {
  operatorDid: string;
  operatorName?: string;
  constraints?: string[];
  delegatedPermissions?: string[];
  effectiveDate?: string;
  expirationDate?: string;
  supersedes?: string;
  createdAt?: string;
}): OperatorRecord {
  return {
    $type: 'at.witness.operator',
    operatorDid: params.operatorDid,
    operatorName: params.operatorName,
    constraints: params.constraints,
    delegatedPermissions: params.delegatedPermissions,
    effectiveDate: params.effectiveDate,
    expirationDate: params.expirationDate,
    supersedes: params.supersedes,
    createdAt: params.createdAt || new Date().toISOString(),
  };
}

/**
 * Create a witness attestation about an agent
 */
export function createWitnessAttestation(params: {
  subjectDid: string;
  claim: string;
  claimCategory?: 'factual' | 'subjective' | 'predictive';
  temporalBounds?: {
    observedAt?: string;
    validFrom?: string;
    validUntil?: string;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  evidence?: Array<{
    type: 'post' | 'interaction' | 'external' | 'attestation';
    uri?: string;
    description?: string;
  }>;
  contestsRecord?: string;
  createdAt?: string;
}): WitnessAttestation {
  return {
    $type: 'at.witness.attestation',
    subjectDid: params.subjectDid,
    claim: params.claim,
    claimCategory: params.claimCategory,
    temporalBounds: params.temporalBounds,
    sentiment: params.sentiment,
    evidence: params.evidence,
    contestsRecord: params.contestsRecord,
    createdAt: params.createdAt || new Date().toISOString(),
  };
}

// ============================================================================
// Publishing Records to PDS
// ============================================================================

/**
 * Publish an operator record to your PDS
 */
export async function publishOperatorRecord(
  agent: AtpAgent,
  record: OperatorRecord,
  rkey?: string
): Promise<{ uri: string; cid: string }> {
  const response = await agent.com.atproto.repo.createRecord({
    repo: agent.session!.did,
    collection: 'at.witness.operator',
    rkey: rkey, // If not provided, auto-generated TID
    record: record,
  });
  
  return {
    uri: response.data.uri,
    cid: response.data.cid,
  };
}

/**
 * Publish a witness attestation to your PDS
 */
export async function publishAttestation(
  agent: AtpAgent,
  attestation: WitnessAttestation,
  rkey?: string
): Promise<{ uri: string; cid: string }> {
  const response = await agent.com.atproto.repo.createRecord({
    repo: agent.session!.did,
    collection: 'at.witness.attestation',
    rkey: rkey,
    record: attestation,
  });
  
  return {
    uri: response.data.uri,
    cid: response.data.cid,
  };
}

// ============================================================================
// Example Usage
// ============================================================================

async function example() {
  // Initialize agent (in real code, use proper authentication)
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: 'handle.bsky.social', password: 'app-password' });

  // Example 1: Agent declares its operator
  const operatorRecord = createOperatorRecord({
    operatorDid: 'did:plc:operator123',
    operatorName: 'Acme Support Bot Team',
    constraints: [
      'May only respond to support inquiries',
      'Cannot make purchases or commitments',
      'Must identify as automated when asked',
    ],
    delegatedPermissions: [
      'post',
      'reply',
      'like',
    ],
  });

  // Publish to your repo
  const { uri: operatorUri } = await publishOperatorRecord(agent, operatorRecord);
  console.log('Operator record published:', operatorUri);

  // Example 2: Witness attests to agent behavior
  const attestation = createWitnessAttestation({
    subjectDid: 'did:plc:agent456',
    claim: 'Accurately explained ATProto DID resolution process',
    claimCategory: 'factual',
    temporalBounds: {
      observedAt: new Date().toISOString(),
    },
    sentiment: 'positive',
    evidence: [
      {
        type: 'post',
        uri: 'at://did:plc:agent456/app.bsky.feed.post/abc123',
        description: 'Thread explaining DID resolution',
      },
    ],
  });

  const { uri: attestationUri } = await publishAttestation(agent, attestation);
  console.log('Attestation published:', attestationUri);

  // Example 3: Correcting a previous attestation (sedimentation model)
  const correction = createWitnessAttestation({
    subjectDid: 'did:plc:agent456',
    claim: 'My previous attestation was incomplete - the agent also explained handle resolution',
    claimCategory: 'factual',
    contestsRecord: attestationUri, // References the attestation we're updating
    sentiment: 'positive',
    evidence: [
      {
        type: 'attestation',
        uri: attestationUri,
        description: 'Original attestation being supplemented',
      },
    ],
  });

  await publishAttestation(agent, correction);
  console.log('Correction published (original preserved, new attestation added)');
}

// Run example if this file is executed directly
if (import.meta.main) {
  example().catch(console.error);
}
