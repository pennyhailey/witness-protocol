/**
 * Witness Protocol - Reading and Validating Records
 * 
 * Reference implementation for reading witness records and validating their structure.
 * Demonstrates graceful degradation when records are unavailable.
 */

import { AtpAgent } from '@atproto/api';

// ============================================================================
// Type Definitions
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
// Reading Records
// ============================================================================

/**
 * Get all operator records for an agent
 * Returns empty array if agent has no operator records (graceful degradation)
 */
export async function getOperatorRecords(
  agent: AtpAgent,
  agentDid: string
): Promise<OperatorRecord[]> {
  try {
    const response = await agent.com.atproto.repo.listRecords({
      repo: agentDid,
      collection: 'at.witness.operator',
      limit: 100,
    });

    return response.data.records.map(r => r.value as OperatorRecord);
  } catch (error: any) {
    // Graceful degradation: missing records != error
    if (error.status === 404 || error.message?.includes('not found')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get the current operator for an agent
 * Follows supersedes chain to find the latest record
 */
export async function getCurrentOperator(
  agent: AtpAgent,
  agentDid: string
): Promise<OperatorRecord | null> {
  const records = await getOperatorRecords(agent, agentDid);
  
  if (records.length === 0) {
    return null;
  }

  // Build supersedes graph and find the "tip" (record not superseded by anything)
  const supersededBy = new Map<string, string>();
  const recordByUri = new Map<string, OperatorRecord>();
  
  for (const record of records) {
    // We'd need the URI to track this properly - simplified version here
    if (record.supersedes) {
      supersededBy.set(record.supersedes, record.createdAt);
    }
  }

  // Find record that isn't superseded, preferring most recent
  const unsuperseded = records
    .filter(r => !Array.from(supersededBy.keys()).includes(r.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return unsuperseded[0] || records[0];
}

/**
 * Get attestations about an agent from a specific witness
 */
export async function getAttestationsFrom(
  agent: AtpAgent,
  witnessDid: string,
  subjectDid?: string
): Promise<WitnessAttestation[]> {
  try {
    const response = await agent.com.atproto.repo.listRecords({
      repo: witnessDid,
      collection: 'at.witness.attestation',
      limit: 100,
    });

    let attestations = response.data.records.map(r => r.value as WitnessAttestation);
    
    // Filter by subject if specified
    if (subjectDid) {
      attestations = attestations.filter(a => a.subjectDid === subjectDid);
    }

    return attestations;
  } catch (error: any) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

// ============================================================================
// Validation
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate an operator record structure
 */
export function validateOperatorRecord(record: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!record.$type || record.$type !== 'at.witness.operator') {
    errors.push('Missing or invalid $type (expected at.witness.operator)');
  }
  if (!record.operatorDid) {
    errors.push('Missing required field: operatorDid');
  }
  if (!record.createdAt) {
    errors.push('Missing required field: createdAt');
  }

  // Validate DID format
  if (record.operatorDid && !record.operatorDid.startsWith('did:')) {
    errors.push('operatorDid must be a valid DID');
  }

  // Validate timestamp
  if (record.createdAt && isNaN(Date.parse(record.createdAt))) {
    errors.push('createdAt must be a valid ISO 8601 timestamp');
  }

  // Warnings for recommended fields
  if (!record.constraints || record.constraints.length === 0) {
    warnings.push('No constraints specified - consider documenting agent limitations');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a witness attestation structure
 */
export function validateAttestation(record: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!record.$type || record.$type !== 'at.witness.attestation') {
    errors.push('Missing or invalid $type (expected at.witness.attestation)');
  }
  if (!record.subjectDid) {
    errors.push('Missing required field: subjectDid');
  }
  if (!record.claim) {
    errors.push('Missing required field: claim');
  }
  if (!record.createdAt) {
    errors.push('Missing required field: createdAt');
  }

  // Validate DID format
  if (record.subjectDid && !record.subjectDid.startsWith('did:')) {
    errors.push('subjectDid must be a valid DID');
  }

  // Validate claimCategory enum
  const validCategories = ['factual', 'subjective', 'predictive'];
  if (record.claimCategory && !validCategories.includes(record.claimCategory)) {
    errors.push(`claimCategory must be one of: ${validCategories.join(', ')}`);
  }

  // Validate sentiment enum
  const validSentiments = ['positive', 'negative', 'neutral'];
  if (record.sentiment && !validSentiments.includes(record.sentiment)) {
    errors.push(`sentiment must be one of: ${validSentiments.join(', ')}`);
  }

  // Warnings
  if (!record.claimCategory) {
    warnings.push('No claimCategory specified - helps with signal weighting');
  }
  if (!record.evidence || record.evidence.length === 0) {
    warnings.push('No evidence provided - attestation has lower signal value');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Aggregation Helpers
// ============================================================================

interface AttestationSummary {
  subjectDid: string;
  totalAttestations: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  byCategory: {
    factual: number;
    subjective: number;
    predictive: number;
    unknown: number;
  };
  uniqueWitnesses: number;
  oldestAttestation: string | null;
  newestAttestation: string | null;
}

/**
 * Aggregate multiple attestations about an agent into a summary
 * Note: This is informational, not a "score" - see governance.md
 */
export function summarizeAttestations(
  attestations: WitnessAttestation[],
  subjectDid: string
): AttestationSummary {
  const relevant = attestations.filter(a => a.subjectDid === subjectDid);
  const witnesses = new Set(attestations.map(a => a.subjectDid)); // Would need witness DID in real impl
  
  const timestamps = relevant
    .map(a => a.createdAt)
    .filter(t => t)
    .sort();

  return {
    subjectDid,
    totalAttestations: relevant.length,
    positiveCount: relevant.filter(a => a.sentiment === 'positive').length,
    negativeCount: relevant.filter(a => a.sentiment === 'negative').length,
    neutralCount: relevant.filter(a => a.sentiment === 'neutral').length,
    byCategory: {
      factual: relevant.filter(a => a.claimCategory === 'factual').length,
      subjective: relevant.filter(a => a.claimCategory === 'subjective').length,
      predictive: relevant.filter(a => a.claimCategory === 'predictive').length,
      unknown: relevant.filter(a => !a.claimCategory).length,
    },
    uniqueWitnesses: witnesses.size,
    oldestAttestation: timestamps[0] || null,
    newestAttestation: timestamps[timestamps.length - 1] || null,
  };
}

// ============================================================================
// Example Usage
// ============================================================================

async function example() {
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  // Note: Many read operations don't require authentication
  
  const agentDid = 'did:plc:example-agent';
  
  // Get current operator
  const operator = await getCurrentOperator(agent, agentDid);
  if (operator) {
    console.log('Agent operated by:', operator.operatorName || operator.operatorDid);
    console.log('Constraints:', operator.constraints);
    
    // Validate the record
    const validation = validateOperatorRecord(operator);
    if (!validation.valid) {
      console.warn('Operator record validation issues:', validation.errors);
    }
  } else {
    console.log('No operator declared (agent may be self-operating)');
  }

  // Get attestations from a known witness
  const knownWitnessDid = 'did:plc:trusted-witness';
  const attestations = await getAttestationsFrom(agent, knownWitnessDid, agentDid);
  
  console.log(`Found ${attestations.length} attestations from this witness`);
  
  // Summarize (informational only)
  const summary = summarizeAttestations(attestations, agentDid);
  console.log('Attestation summary:', summary);
}

if (import.meta.main) {
  example().catch(console.error);
}
