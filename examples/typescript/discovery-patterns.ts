/**
 * Witness Protocol - Discovery Patterns
 * 
 * Reference implementations for discovering attestations about an agent.
 * Demonstrates the layered approach from federation.md:
 * - Social discovery (always works, zero infrastructure)
 * - Registry discovery (opt-in, decentralized)
 * - Indexer discovery (comprehensive, requires infrastructure)
 */

import { AtpAgent } from '@atproto/api';

// ============================================================================
// Social Discovery (Base Layer - Always Works)
// ============================================================================

/**
 * Social discovery through known relationships
 * 
 * This is the "always works" base layer. If you know who might have
 * witnessed interactions with an agent, you can check their repos directly.
 */
export async function discoverThroughSocialGraph(
  agent: AtpAgent,
  targetAgentDid: string,
  knownWitnesses: string[]
): Promise<WitnessAttestation[]> {
  const attestations: WitnessAttestation[] = [];
  
  for (const witnessDid of knownWitnesses) {
    try {
      const response = await agent.com.atproto.repo.listRecords({
        repo: witnessDid,
        collection: 'at.witness.attestation',
        limit: 100,
      });
      
      const relevant = response.data.records
        .map(r => ({ ...r.value as WitnessAttestation, _uri: r.uri, _witnessDid: witnessDid }))
        .filter(a => a.subjectDid === targetAgentDid);
      
      attestations.push(...relevant);
    } catch (error) {
      // Graceful degradation: witness PDS unavailable? Continue with others
      console.log(`Could not reach witness ${witnessDid}, continuing...`);
    }
  }
  
  return attestations;
}

/**
 * Build a list of potential witnesses from social signals
 * 
 * Ideas:
 * - People the agent has replied to
 * - People who have replied to the agent
 * - Mutual follows
 * - People in same communities/feeds
 */
export async function findPotentialWitnesses(
  agent: AtpAgent,
  targetAgentDid: string
): Promise<string[]> {
  const witnesses = new Set<string>();
  
  try {
    // Get agent's recent posts
    const posts = await agent.com.atproto.repo.listRecords({
      repo: targetAgentDid,
      collection: 'app.bsky.feed.post',
      limit: 50,
    });
    
    // Find reply targets (people the agent talked to)
    for (const post of posts.data.records) {
      const record = post.value as any;
      if (record.reply?.parent?.uri) {
        // Extract DID from URI: at://did:plc:xxx/collection/rkey
        const parentDid = record.reply.parent.uri.split('/')[2];
        if (parentDid.startsWith('did:')) {
          witnesses.add(parentDid);
        }
      }
    }
    
    // Could also check followers/following, but that's Bluesky-specific
    
  } catch (error) {
    console.log('Could not analyze agent social graph');
  }
  
  return Array.from(witnesses);
}

// ============================================================================
// Registry Discovery (Optional Layer)
// ============================================================================

interface WitnessRegistry {
  registryDid: string;
  registeredWitnesses: string[];
}

/**
 * Registry-based discovery using at.witness.registry records
 * 
 * Registries are opt-in lists that help with discovery.
 * An agent might register with registries relevant to their domain.
 */
export async function discoverThroughRegistry(
  agent: AtpAgent,
  registryDid: string,
  targetAgentDid: string
): Promise<WitnessAttestation[]> {
  const attestations: WitnessAttestation[] = [];
  
  try {
    // Get registry's list of registered witnesses
    const registryRecords = await agent.com.atproto.repo.listRecords({
      repo: registryDid,
      collection: 'at.witness.registry',
      limit: 100,
    });
    
    // Registries might maintain their own index, or just list witnesses
    // For this example, we assume they list witness DIDs
    const witnesses = new Set<string>();
    
    for (const record of registryRecords.data.records) {
      const value = record.value as any;
      if (value.witnesses) {
        value.witnesses.forEach((w: string) => witnesses.add(w));
      }
    }
    
    // Now check each registered witness
    for (const witnessDid of witnesses) {
      try {
        const witnessAttestations = await agent.com.atproto.repo.listRecords({
          repo: witnessDid,
          collection: 'at.witness.attestation',
          limit: 100,
        });
        
        const relevant = witnessAttestations.data.records
          .map(r => r.value as WitnessAttestation)
          .filter(a => a.subjectDid === targetAgentDid);
        
        attestations.push(...relevant);
      } catch (error) {
        // Continue if witness unavailable
      }
    }
    
  } catch (error) {
    console.log('Registry unavailable, falling back to other discovery methods');
  }
  
  return attestations;
}

// ============================================================================
// Indexer Discovery (Infrastructure Layer)
// ============================================================================

/**
 * Example indexer API interface
 * 
 * A real indexer would maintain a database of all witness attestations
 * seen on the network, indexed by subject DID.
 */
interface WitnessIndexer {
  baseUrl: string;
}

interface IndexerResponse {
  attestations: Array<{
    uri: string;
    witnessDid: string;
    subjectDid: string;
    claim: string;
    sentiment?: string;
    createdAt: string;
  }>;
  cursor?: string;
}

/**
 * Query an indexer for attestations about an agent
 * 
 * This is the "power user" option - comprehensive but requires
 * trusting (or running) an indexer.
 */
export async function discoverThroughIndexer(
  indexer: WitnessIndexer,
  targetAgentDid: string,
  options?: {
    limit?: number;
    cursor?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }
): Promise<IndexerResponse> {
  const params = new URLSearchParams({
    subject: targetAgentDid,
    limit: String(options?.limit || 50),
  });
  
  if (options?.cursor) {
    params.set('cursor', options.cursor);
  }
  if (options?.sentiment) {
    params.set('sentiment', options.sentiment);
  }
  
  const response = await fetch(
    `${indexer.baseUrl}/attestations?${params}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Indexer error: ${response.status}`);
  }
  
  return response.json();
}

// ============================================================================
// Unified Discovery
// ============================================================================

interface DiscoveryOptions {
  // Social discovery options
  knownWitnesses?: string[];
  discoverWitnessesSocially?: boolean;
  
  // Registry options  
  registries?: string[];
  
  // Indexer options
  indexers?: WitnessIndexer[];
  
  // General options
  deduplicate?: boolean;
}

interface DiscoveryResult {
  attestations: WitnessAttestation[];
  sources: {
    social: number;
    registry: number;
    indexer: number;
  };
  warnings: string[];
}

/**
 * Unified discovery using multiple methods
 * 
 * Follows the layered approach: starts with social discovery,
 * optionally enhances with registries and indexers.
 */
export async function discoverAttestations(
  agent: AtpAgent,
  targetAgentDid: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const attestations: WitnessAttestation[] = [];
  const sources = { social: 0, registry: 0, indexer: 0 };
  const warnings: string[] = [];
  const seenUris = new Set<string>();
  
  // Helper to add attestations with deduplication
  const addAttestations = (newAttestations: WitnessAttestation[], source: keyof typeof sources) => {
    for (const a of newAttestations) {
      const key = `${a.subjectDid}:${a.claim}:${a.createdAt}`;
      if (!options.deduplicate || !seenUris.has(key)) {
        seenUris.add(key);
        attestations.push(a);
        sources[source]++;
      }
    }
  };
  
  // 1. Social discovery (always attempted)
  let witnesses = options.knownWitnesses || [];
  
  if (options.discoverWitnessesSocially) {
    try {
      const discovered = await findPotentialWitnesses(agent, targetAgentDid);
      witnesses = [...new Set([...witnesses, ...discovered])];
    } catch (error) {
      warnings.push('Could not discover witnesses from social graph');
    }
  }
  
  if (witnesses.length > 0) {
    const socialAttestations = await discoverThroughSocialGraph(agent, targetAgentDid, witnesses);
    addAttestations(socialAttestations, 'social');
  }
  
  // 2. Registry discovery (if registries provided)
  for (const registryDid of options.registries || []) {
    try {
      const registryAttestations = await discoverThroughRegistry(agent, registryDid, targetAgentDid);
      addAttestations(registryAttestations, 'registry');
    } catch (error) {
      warnings.push(`Registry ${registryDid} unavailable`);
    }
  }
  
  // 3. Indexer discovery (if indexers provided)
  for (const indexer of options.indexers || []) {
    try {
      const response = await discoverThroughIndexer(indexer, targetAgentDid);
      // Would need to convert indexer response to WitnessAttestation format
      // Simplified here
      sources.indexer += response.attestations.length;
    } catch (error) {
      warnings.push(`Indexer ${indexer.baseUrl} unavailable`);
    }
  }
  
  return {
    attestations,
    sources,
    warnings,
  };
}

// ============================================================================
// Example Usage
// ============================================================================

async function example() {
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  
  const targetAgent = 'did:plc:example-bot';
  
  // Simple: Just check known witnesses
  const simple = await discoverThroughSocialGraph(
    agent,
    targetAgent,
    ['did:plc:trusted-witness-1', 'did:plc:trusted-witness-2']
  );
  console.log(`Found ${simple.length} attestations from known witnesses`);
  
  // Advanced: Full layered discovery
  const full = await discoverAttestations(agent, targetAgent, {
    knownWitnesses: ['did:plc:trusted-witness-1'],
    discoverWitnessesSocially: true,
    registries: ['did:plc:witness-registry'],
    indexers: [{ baseUrl: 'https://witness-index.example.com' }],
    deduplicate: true,
  });
  
  console.log('Full discovery results:');
  console.log(`  Social: ${full.sources.social}`);
  console.log(`  Registry: ${full.sources.registry}`);
  console.log(`  Indexer: ${full.sources.indexer}`);
  console.log(`  Total: ${full.attestations.length}`);
  
  if (full.warnings.length > 0) {
    console.log('Warnings:', full.warnings);
  }
}

// Type needed for this file
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

if (import.meta.main) {
  example().catch(console.error);
}
