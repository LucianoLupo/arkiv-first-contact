# Arkiv Network - Technical Summary

## Overview

Arkiv is a **Universal Data Layer for Ethereum** that combines Web2 usability with Web3 trustlessness. It's a decentralized data availability and management layer (L2+L3) built on Ethereum.

**Tagline**: "Database experience with Web3 guarantees"

## Core Architecture (3-Layer Model)

### Layer 1 - Ethereum Mainnet

- Provides final settlement and security
- Verifies proofs and commitments
- Acts as the authoritative source of truth

### Layer 2 - Arkiv Coordination Layer

- Built on OP Stack
- Manages coordination & registry for DB-chains
- Multi-token gas logic (GLM and ETH supported)
- State anchoring to L1
- Resolves queries deterministically

### Layer 3 - Specialized DB-Chains

- High-performance database chains
- CRUD operations via JSON-RPC
- Indexed queries with attributes
- Programmable expiration times
- GLM token-based gas fees

## Entity System

Arkiv stores data as **entities** with three core components:

### 1. Content (Payload)

- The actual data being stored
- Can be any binary data
- Stored with a content type (e.g., `text/plain`, `application/json`)

### 2. Attributes

Key-value pairs that make entities queryable:

```typescript
{ key: 'type', value: 'note' }
{ key: 'priority', value: 5 }
{ key: 'status', value: 'active' }
```

### 3. Expiration

- Automatic deletion timing
- Specified in blocks (`expiresIn: 1000`)
- Pay by bytes × lifetime
- Auto-prune on configurable dates

## Query Language

SQL-like syntax for querying entities:

```typescript
// Simple query
type = "note"

// Compound conditions
type = "note" && priority > 3 && created > 1672531200

// Using the SDK
const result = await publicClient
  .buildQuery()
  .where(eq('type', 'note'))
  .withAttributes(true)
  .withPayload(true)
  .fetch();
```

### Query Operators

- `eq(key, value)` - Equality
- Compound conditions with `&&`
- Numeric comparisons (>, <, >=, <=)

## Key Features

### 1. Queryable by Design

- "CRUD + indexes, not ad-hoc indexers"
- Built-in query capabilities without external services
- Real-time queries without indexing delays

### 2. Time-Scoped Storage

- Pay only for storage duration needed
- Automatic data pruning
- No permanent storage fees
- Configurable expiration dates

### 3. Deterministic & Verifiable

- "Same query → same answer"
- Fully transparent and verifiable
- Compatible with Web3 tools
- Ethereum-backed security

### 4. Cost Efficiency

- Pay by bytes × lifetime
- No need for permanent storage
- Automatic cleanup reduces costs

## Use Cases

### Temporary Data Storage

- Session data
- Clipboards and caches
- Short-lived application state

### Event Logging

- Application events with automatic cleanup
- Audit trails with expiration
- Time-scoped analytics data

### File & Media Metadata

- Metadata management for files
- Content type tracking
- Searchable media libraries

### Real-Time Applications

- Chat applications
- Collaborative tools
- IoT data streams
- Live dashboards

## Developer Tools

### TypeScript SDK

```typescript
import { createPublicClient, createWalletClient } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';
```

**Features:**

- Full type safety
- Simplified CRUD operations
- Query builder
- Entity subscriptions
- WebSocket support

### SDK Operations

**Creating Entities:**

```typescript
const { entityKey, txHash } = await walletClient.createEntity({
  payload: stringToPayload('Hello World'),
  contentType: 'text/plain',
  attributes: [
    { key: 'type', value: 'greeting' },
    { key: 'timestamp', value: new Date().toISOString() },
  ],
  expiresIn: 1000, // blocks
});
```

**Querying Entities:**

```typescript
const result = await publicClient
  .buildQuery()
  .where(eq('type', 'greeting'))
  .withAttributes(true)
  .withPayload(true)
  .fetch();

console.log(result.entities); // Array of entities
```

**Real-Time Subscriptions:**

```typescript
const stop = await publicClient.subscribeEntityEvents({
  onEntityCreated: async (e) => {
    console.log('New entity:', e);
  },
  onEntityExpiresInExtended: (e) => {
    console.log('Entity expiration extended:', e);
  },
  onError: (err) => {
    console.error('Error:', err);
  },
});
```

**Extending Expiration:**

```typescript
await walletClient.extendEntity({
  entityKey: entityKey,
  expiresIn: 150,
});
```

## Testnet Information

### Mendoza Testnet

Used during DevConnect 2025 hackathons in Buenos Aires.

- **Chain ID**: 60138453056
- **RPC**: `https://mendoza.hoodi.arkiv.network/rpc`
- **WebSocket**: `wss://mendoza.hoodi.arkiv.network/rpc/ws`
- **Faucet**: https://mendoza.hoodi.arkiv.network/faucet/
- **Explorer**: https://explorer.mendoza.hoodi.arkiv.network/

## Benefits Over Traditional Solutions

### vs External Indexers (The Graph, etc.)

- ✅ No indexing delays
- ✅ Built-in query capabilities
- ✅ No separate infrastructure
- ✅ Deterministic results

### vs Permanent Storage (IPFS, Arweave)

- ✅ Time-scoped = cost efficient
- ✅ Automatic cleanup
- ✅ Pay only for what you need
- ✅ No eternal storage costs

### vs Centralized Databases

- ✅ Decentralized and verifiable
- ✅ Ethereum security
- ✅ No single point of failure
- ✅ Transparent operations

## Technical Advantages

1. **High Performance**: L3 DB-chains optimized for database operations
2. **Type Safety**: Full TypeScript SDK with IntelliSense
3. **Ethereum Compatible**: Works with existing Web3 tools
4. **Multi-Token Support**: GLM and ETH for gas fees
5. **Built on OP Stack**: Leverages proven infrastructure

## Example Architecture Pattern

```
┌─────────────────────────────────────────┐
│        Your Application (Frontend)       │
│     React, Next.js, or any framework    │
└───────────────┬─────────────────────────┘
                │
                │ Arkiv SDK
                ▼
┌─────────────────────────────────────────┐
│         Arkiv Network (L2+L3)           │
│  • Create/Query entities                │
│  • Subscribe to events                  │
│  • Manage expiration                    │
└───────────────┬─────────────────────────┘
                │
                │ Anchored to
                ▼
┌─────────────────────────────────────────┐
│         Ethereum Mainnet (L1)           │
│         Final Security Layer            │
└─────────────────────────────────────────┘
```

## Best Practices

### 1. Entity Design

- Use descriptive attribute keys
- Keep payloads reasonable in size
- Set appropriate expiration times
- Include timestamps for time-series data

### 2. Querying

- Use compound conditions for precise filtering
- Request only needed data with `withAttributes()` and `withPayload()`
- Use subscriptions for real-time updates

### 3. Cost Optimization

- Set appropriate expiration times
- Don't store data longer than needed
- Use attributes efficiently for queries
- Batch operations when possible

### 4. Security

- Never store private keys on-chain
- Use testnet keys only for development
- Validate data before storing
- Consider data privacy for attributes

## Token Economics

### GLM Token

- Used for gas fees on L3 DB-chains
- Multi-token support (GLM and ETH)
- Pay by bytes × lifetime model

## Resources

- **Website**: https://arkiv.network
- **Documentation**: https://arkiv.network/docs
- **Litepaper**: https://arkiv.network/pdf/ARKIV_Litepaper.pdf
- **TypeScript SDK**: https://www.npmjs.com/package/@arkiv-network/sdk
- **Getting Started**: https://arkiv.network/getting-started/typescript

## Summary

Arkiv provides a unique solution for blockchain data management by combining:

- **Web2 UX**: Familiar database operations (CRUD, queries, indexes)
- **Web3 Guarantees**: Decentralized, verifiable, Ethereum-secured
- **Time-Scoped**: Pay only for the duration you need storage
- **Developer-Friendly**: TypeScript SDK with full type safety

It's ideal for applications that need queryable, temporary data storage with the security and transparency of blockchain technology.
