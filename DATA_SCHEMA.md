# Arkiv Analytics - Data Schema Documentation

> **For Frontend Integration**
>
> This document describes all data types stored in Arkiv DB-chain and how to query them from your Next.js dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Types](#entity-types)
3. [Protocol Events](#protocol-events)
4. [Aggregated Metrics](#aggregated-metrics)
5. [Price Snapshots](#price-snapshots)
6. [TypeScript Types](#typescript-types)
7. [Query Examples](#query-examples)
8. [Chart Suggestions](#chart-suggestions)
9. [Best Practices](#best-practices)

---

## Overview

The enhanced event generator pushes three main types of entities to Arkiv:

| Entity Type | Purpose | Percentage | Use Case |
|-------------|---------|------------|----------|
| **Protocol Events** | Raw transaction data from Aave V3 & Uniswap V3 | 70% | Detailed event lists, transaction history |
| **Aggregated Metrics** | Hourly summaries by protocol | 20% | Charts, trends, protocol comparison |
| **Price Snapshots** | Token price history | 10% | USD calculations, price charts |

### Data Distribution

```
Protocol Events (70%)
├── Aave V3 (50%)
│   ├── Supply (25%)
│   ├── Borrow (20%)
│   ├── Withdraw (15%)
│   ├── Repay (8%)
│   └── LiquidationCall (2%)
└── Uniswap V3 (20%)
    └── Swap (20%)

Aggregated Metrics (20%)
├── Aave V3 Hourly Summary (10%)
└── Uniswap V3 Hourly Summary (10%)

Price Snapshots (10%)
└── Token Prices (10%)
```

---

## Entity Types

All entities have a common `entityType` attribute for filtering:

```typescript
type EntityType = 'protocol_event' | 'aggregated_metric' | 'price_snapshot';
```

### Querying by Entity Type

```typescript
// Get all protocol events
const events = await client
  .buildQuery()
  .where(eq('entityType', 'protocol_event'))
  .fetch();

// Get all aggregated metrics
const metrics = await client
  .buildQuery()
  .where(eq('entityType', 'aggregated_metric'))
  .fetch();

// Get all price snapshots
const prices = await client
  .buildQuery()
  .where(eq('entityType', 'price_snapshot'))
  .fetch();
```

---

## Protocol Events

### Aave V3 Events

Aave lending protocol events (supply, borrow, repay, liquidation).

#### Common Fields

All Aave events include:

```typescript
{
  entityType: 'protocol_event',
  protocol: 'aave-v3',
  network: 'ethereum',
  eventType: 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall',

  // Core data
  reserve: string,          // Asset symbol (e.g., 'USDC', 'WETH')
  user: string,             // User address
  amount: string,           // Amount in asset units
  amountUSD: string,        // USD value

  // Blockchain data
  txHash: string,
  blockNumber: number,
  timestamp: string,        // ISO 8601 format
}
```

#### 1. Supply Event

User deposits assets as collateral.

**Fields:**
```typescript
{
  eventType: 'Supply',
  reserve: 'USDC',
  user: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  onBehalfOf: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',  // Beneficiary
  amount: '10000.00',
  amountUSD: '10000.00',
  referralCode: 0,
  // ... common fields
}
```

**Query Example:**
```typescript
// Get all supply events for USDC
const supplies = await client
  .buildQuery()
  .where(eq('eventType', 'Supply'))
  .where(eq('reserve', 'USDC'))
  .withPayload(true)
  .withAttributes(true)
  .fetch();
```

#### 2. Borrow Event

User borrows assets against collateral.

**Fields:**
```typescript
{
  eventType: 'Borrow',
  reserve: 'WETH',
  user: '0x8E5C23e6c59F9e8B4d1a0b98d85d7d7c5c3f12F9',
  onBehalfOf: '0x8E5C23e6c59F9e8B4d1a0b98d85d7d7c5c3f12F9',
  amount: '5.00',
  amountUSD: '12250.00',
  interestRateMode: 2,         // 1 = Stable, 2 = Variable
  borrowRate: '3.5%',
  referralCode: 0,
  // ... common fields
}
```

**Query Example:**
```typescript
// Get all variable rate borrows
const variableBorrows = await client
  .buildQuery()
  .where(eq('eventType', 'Borrow'))
  .where(eq('interestRateMode', '2'))
  .fetch();
```

#### 3. Withdraw Event

User removes supplied collateral.

**Fields:**
```typescript
{
  eventType: 'Withdraw',
  reserve: 'DAI',
  user: '0x1234567890123456789012345678901234567890',
  to: '0x1234567890123456789012345678901234567890',    // Recipient
  amount: '2500.00',
  amountUSD: '2500.00',
  // ... common fields
}
```

#### 4. Repay Event

User repays borrowed assets.

**Fields:**
```typescript
{
  eventType: 'Repay',
  reserve: 'USDT',
  user: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  repayer: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  amount: '5000.00',
  amountUSD: '5000.00',
  useATokens: false,           // Whether aTokens were used for repayment
  // ... common fields
}
```

#### 5. LiquidationCall Event

Liquidator repays debt for under-collateralized position.

**Fields:**
```typescript
{
  eventType: 'LiquidationCall',
  collateralAsset: 'WETH',
  debtAsset: 'USDC',
  user: '0x9876543210987654321098765432109876543210',
  liquidator: '0x5566778899AABBCCDDEEFF0011223344556677',
  debtToCover: '10000.00',
  debtToCoverUSD: '10000.00',
  liquidatedCollateralAmount: '4.50',
  liquidatedCollateralAmountUSD: '11025.00',
  reserve: 'WETH',              // For consistency
  amount: '10000.00',
  amountUSD: '10000.00',
  // ... common fields
}
```

### Uniswap V3 Events

DEX swap events.

#### Swap Event

Token exchange on Uniswap V3.

**Fields:**
```typescript
{
  entityType: 'protocol_event',
  eventType: 'Swap',
  protocol: 'uniswap-v3',
  network: 'ethereum',

  // Swap details
  sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  recipient: '0x8E5C23e6c59F9e8B4d1a0b98d85d7d7c5c3f12F9',
  tokenIn: 'USDC',
  tokenOut: 'WETH',
  amountIn: '10000.00',
  amountOut: '4.08',
  amountInUSD: '10000.00',
  amountOutUSD: '9996.00',

  // Pool state
  sqrtPriceX96: '79228162514264337593543950336',
  liquidity: '5000000.00',
  tick: 12345,

  // Blockchain data
  txHash: string,
  blockNumber: number,
  timestamp: string,
}
```

**Query Examples:**
```typescript
// Get all swaps for a specific token
const ethSwaps = await client
  .buildQuery()
  .where(eq('tokenIn', 'WETH'))
  .fetch();

// Get all swaps by a user
const userSwaps = await client
  .buildQuery()
  .where(eq('sender', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'))
  .fetch();
```

---

## Aggregated Metrics

Pre-computed hourly summaries for fast charting and analytics.

### Hourly Summary

**Fields:**
```typescript
{
  entityType: 'aggregated_metric',
  metricType: 'hourly_summary',
  protocol: 'aave-v3' | 'uniswap-v3',
  timeWindow: '1h',
  timestamp: string,            // Hour timestamp (minutes set to 00)

  // Volume metrics
  totalVolumeUSD: '2500000.00',
  transactionCount: 350,
  uniqueUsers: 125,

  // Asset breakdown
  assetVolumes: {
    'USDC': '800000.00',
    'WETH': '600000.00',
    'DAI': '500000.00',
    'USDT': '400000.00'
  },

  // Event type breakdown
  eventTypeCounts: {
    'Supply': 150,
    'Borrow': 100,
    'Withdraw': 70,
    'Repay': 25,
    'LiquidationCall': 5
  },

  // Average values
  avgTransactionSizeUSD: '7142.86'
}
```

### Use Cases

**Time-series charts:**
```typescript
// Get hourly volume over last 24 hours
const metrics = await client
  .buildQuery()
  .where(eq('metricType', 'hourly_summary'))
  .where(eq('protocol', 'aave-v3'))
  .fetch();

// Sort by timestamp and plot totalVolumeUSD
const chartData = metrics.entities
  .map(e => parseEntity(e))
  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  .map(m => ({
    time: m.timestamp,
    volume: parseFloat(m.totalVolumeUSD)
  }));
```

**Protocol comparison:**
```typescript
// Compare Aave vs Uniswap volumes
const aaveMetrics = await client.buildQuery()
  .where(eq('protocol', 'aave-v3'))
  .fetch();

const uniswapMetrics = await client.buildQuery()
  .where(eq('protocol', 'uniswap-v3'))
  .fetch();
```

---

## Price Snapshots

Token price history for USD calculations.

### Price Snapshot

**Fields:**
```typescript
{
  entityType: 'price_snapshot',
  snapshotType: 'price_snapshot',
  asset: 'WETH',
  priceUSD: '2450.00',
  timestamp: string,

  // Additional data
  change24h: '+3.5%',
  volume24hUSD: '25000000.00',
  marketCapUSD: '295000000000.00'
}
```

### Use Cases

**Current prices:**
```typescript
// Get latest price for each asset
const prices = await client
  .buildQuery()
  .where(eq('entityType', 'price_snapshot'))
  .fetch();

// Group by asset and get most recent
const latestPrices = prices.entities
  .reduce((acc, entity) => {
    const snapshot = parseEntity(entity);
    const existing = acc[snapshot.asset];
    if (!existing || new Date(snapshot.timestamp) > new Date(existing.timestamp)) {
      acc[snapshot.asset] = snapshot;
    }
    return acc;
  }, {} as Record<string, PriceSnapshot>);
```

**Price history chart:**
```typescript
// Get WETH price history
const ethPrices = await client
  .buildQuery()
  .where(eq('asset', 'WETH'))
  .fetch();

const priceChart = ethPrices.entities
  .map(e => parseEntity(e))
  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  .map(p => ({
    time: p.timestamp,
    price: parseFloat(p.priceUSD)
  }));
```

---

## TypeScript Types

Complete type definitions for frontend integration:

```typescript
// ============================================================================
// ENTITY TYPES
// ============================================================================

export type EntityType = 'protocol_event' | 'aggregated_metric' | 'price_snapshot';
export type ProtocolType = 'aave-v3' | 'uniswap-v3';
export type AaveEventType = 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall';
export type UniswapEventType = 'Swap';

// ============================================================================
// AAVE V3 EVENTS
// ============================================================================

export interface AaveEvent {
  entityType: 'protocol_event';
  eventType: AaveEventType;
  protocol: 'aave-v3';
  network: string;
  reserve: string;
  user: string;
  amount: string;
  amountUSD: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;

  // Event-specific fields (optional)
  onBehalfOf?: string;
  to?: string;
  referralCode?: number;
  interestRateMode?: number;
  borrowRate?: string;
  repayer?: string;
  useATokens?: boolean;
  collateralAsset?: string;
  debtAsset?: string;
  liquidator?: string;
  liquidatedCollateralAmount?: string;
  liquidatedCollateralAmountUSD?: string;
  debtToCover?: string;
  debtToCoverUSD?: string;
}

// ============================================================================
// UNISWAP V3 EVENTS
// ============================================================================

export interface UniswapEvent {
  entityType: 'protocol_event';
  eventType: 'Swap';
  protocol: 'uniswap-v3';
  network: string;
  sender: string;
  recipient: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  amountInUSD: string;
  amountOutUSD: string;
  sqrtPriceX96: string;
  liquidity: string;
  tick: number;
  txHash: string;
  blockNumber: number;
  timestamp: string;
}

// ============================================================================
// AGGREGATED METRICS
// ============================================================================

export interface AggregatedMetric {
  entityType: 'aggregated_metric';
  metricType: 'hourly_summary';
  protocol: ProtocolType;
  timeWindow: string;
  timestamp: string;
  totalVolumeUSD: string;
  transactionCount: number;
  uniqueUsers: number;
  assetVolumes: Record<string, string>;
  eventTypeCounts: Record<string, number>;
  avgTransactionSizeUSD: string;
}

// ============================================================================
// PRICE SNAPSHOTS
// ============================================================================

export interface PriceSnapshot {
  entityType: 'price_snapshot';
  snapshotType: 'price_snapshot';
  asset: string;
  priceUSD: string;
  timestamp: string;
  change24h: string;
  volume24hUSD: string;
  marketCapUSD?: string;
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type ProtocolEvent = AaveEvent | UniswapEvent;
export type EntityData = ProtocolEvent | AggregatedMetric | PriceSnapshot;

// ============================================================================
// PARSED ENTITY
// ============================================================================

export interface ParsedEntity<T extends EntityData = EntityData> extends T {
  entityKey: string;
}
```

---

## Query Examples

### Basic Queries

**Get all events:**
```typescript
const allEvents = await client
  .buildQuery()
  .where(eq('entityType', 'protocol_event'))
  .withPayload(true)
  .withAttributes(true)
  .fetch();
```

**Filter by protocol:**
```typescript
const aaveEvents = await client
  .buildQuery()
  .where(eq('protocol', 'aave-v3'))
  .fetch();
```

**Filter by event type:**
```typescript
const supplies = await client
  .buildQuery()
  .where(eq('eventType', 'Supply'))
  .fetch();
```

**Filter by asset:**
```typescript
const usdcEvents = await client
  .buildQuery()
  .where(eq('reserve', 'USDC'))
  .fetch();
```

### Advanced Queries

**Get events by user:**
```typescript
const userEvents = await client
  .buildQuery()
  .where(eq('user', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'))
  .fetch();
```

**Get hourly metrics for specific protocol:**
```typescript
const aaveMetrics = await client
  .buildQuery()
  .where(eq('metricType', 'hourly_summary'))
  .where(eq('protocol', 'aave-v3'))
  .fetch();
```

**Get price history for asset:**
```typescript
const ethPrices = await client
  .buildQuery()
  .where(eq('snapshotType', 'price_snapshot'))
  .where(eq('asset', 'WETH'))
  .fetch();
```

### Client-Side Filtering

Since Arkiv doesn't support complex queries yet, use client-side filtering for:

**Date ranges:**
```typescript
const events = await queryAllEvents();
const recentEvents = events.filter(e =>
  new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
);
```

**Amount thresholds:**
```typescript
const largeTransactions = events.filter(e =>
  parseFloat(e.amountUSD) > 10000
);
```

**Multiple conditions:**
```typescript
const recentLargeSupplies = events.filter(e =>
  e.eventType === 'Supply' &&
  parseFloat(e.amountUSD) > 10000 &&
  new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
);
```

---

## Chart Suggestions

### 1. Protocol Volume Over Time

**Data Source**: Aggregated Metrics
**Chart Type**: Line Chart

```typescript
const metrics = await queryAggregatedMetrics();
const chartData = metrics.map(m => ({
  time: m.timestamp,
  aaveVolume: m.protocol === 'aave-v3' ? parseFloat(m.totalVolumeUSD) : 0,
  uniswapVolume: m.protocol === 'uniswap-v3' ? parseFloat(m.totalVolumeUSD) : 0,
}));
```

### 2. Event Type Distribution

**Data Source**: Aggregated Metrics
**Chart Type**: Pie Chart / Donut Chart

```typescript
const metrics = await queryAggregatedMetrics();
const eventCounts = metrics[0].eventTypeCounts; // Most recent hour

const chartData = Object.entries(eventCounts).map(([type, count]) => ({
  name: type,
  value: count,
}));
```

### 3. Asset Volume Breakdown

**Data Source**: Aggregated Metrics
**Chart Type**: Bar Chart

```typescript
const metrics = await queryLatestMetric();
const assetVolumes = metrics.assetVolumes;

const chartData = Object.entries(assetVolumes).map(([asset, volume]) => ({
  asset,
  volume: parseFloat(volume),
}));
```

### 4. Token Price History

**Data Source**: Price Snapshots
**Chart Type**: Line Chart

```typescript
const prices = await queryPriceSnapshots('WETH');
const chartData = prices.map(p => ({
  time: p.timestamp,
  price: parseFloat(p.priceUSD),
}));
```

### 5. Top Users by Volume

**Data Source**: Protocol Events
**Chart Type**: Bar Chart

```typescript
const events = await queryProtocolEvents();
const userVolumes = events.reduce((acc, event) => {
  const user = event.user;
  const volume = parseFloat(event.amountUSD);
  acc[user] = (acc[user] || 0) + volume;
  return acc;
}, {} as Record<string, number>);

const chartData = Object.entries(userVolumes)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([user, volume]) => ({
    user: `${user.slice(0, 6)}...${user.slice(-4)}`,
    volume,
  }));
```

### 6. Transaction Count Over Time

**Data Source**: Aggregated Metrics
**Chart Type**: Area Chart

```typescript
const metrics = await queryAggregatedMetrics();
const chartData = metrics.map(m => ({
  time: m.timestamp,
  transactions: m.transactionCount,
}));
```

### 7. Liquidation Events Timeline

**Data Source**: Protocol Events
**Chart Type**: Scatter Plot / Timeline

```typescript
const liquidations = await queryEventsByType('LiquidationCall');
const chartData = liquidations.map(l => ({
  time: l.timestamp,
  debtCovered: parseFloat(l.debtToCoverUSD),
  collateralLiquidated: parseFloat(l.liquidatedCollateralAmountUSD),
}));
```

---

## Best Practices

### 1. Use Aggregated Metrics for Charts

**✅ Good:**
```typescript
// Use pre-computed hourly summaries
const metrics = await queryAggregatedMetrics();
// Fast, scales well
```

**❌ Bad:**
```typescript
// Aggregate thousands of events client-side
const events = await queryAllEvents();
const hourlyVolumes = aggregateByHour(events); // Slow, memory-intensive
```

### 2. Cache Price Data

**✅ Good:**
```typescript
// Fetch prices once, cache for 5 minutes
const prices = await getCachedPrices();
```

**❌ Bad:**
```typescript
// Fetch prices for every event
for (const event of events) {
  const price = await getPrice(event.asset); // N+1 queries
}
```

### 3. Filter at Query Time When Possible

**✅ Good:**
```typescript
// Filter with Arkiv query
const usdcEvents = await client
  .buildQuery()
  .where(eq('reserve', 'USDC'))
  .fetch();
```

**❌ Bad:**
```typescript
// Fetch everything, filter client-side
const allEvents = await queryAllEvents();
const usdcEvents = allEvents.filter(e => e.reserve === 'USDC');
```

### 4. Paginate Large Results

**✅ Good:**
```typescript
const result = await client.buildQuery().fetch();
let events = result.entities;

while (result.hasNextPage()) {
  const nextResult = await result.next();
  events = [...events, ...nextResult.entities];
}
```

### 5. Handle Missing Fields

**✅ Good:**
```typescript
const volume = parseFloat(event.amountUSD || '0');
const liquidator = event.liquidator || 'N/A';
```

**❌ Bad:**
```typescript
const volume = parseFloat(event.amountUSD); // May throw
const liquidator = event.liquidator.toLowerCase(); // May crash
```

### 6. Type Guards for Entity Types

```typescript
function isAaveEvent(entity: EntityData): entity is AaveEvent {
  return entity.entityType === 'protocol_event' &&
         (entity as any).protocol === 'aave-v3';
}

function isUniswapEvent(entity: EntityData): entity is UniswapEvent {
  return entity.entityType === 'protocol_event' &&
         (entity as any).protocol === 'uniswap-v3';
}

function isAggregatedMetric(entity: EntityData): entity is AggregatedMetric {
  return entity.entityType === 'aggregated_metric';
}

function isPriceSnapshot(entity: EntityData): entity is PriceSnapshot {
  return entity.entityType === 'price_snapshot';
}
```

---

## Summary

### Available Data

- **Protocol Events**: 7 event types across 2 protocols (Aave V3, Uniswap V3)
- **Aggregated Metrics**: Hourly summaries for both protocols
- **Price Snapshots**: Real-time token prices with market data

### Query Patterns

- Use `eq('entityType', ...)` to filter by entity type
- Use `eq('protocol', ...)` to filter by protocol
- Use `eq('eventType', ...)` to filter by event type
- Use `eq('reserve'/'asset', ...)` to filter by token

### Chart Recommendations

- **Time Series**: Use aggregated metrics
- **Distributions**: Use event type counts from metrics
- **Rankings**: Aggregate protocol events by user/asset
- **Prices**: Use price snapshots for token price history

### Performance Tips

- Favor aggregated metrics over raw events for charts
- Cache price data
- Use Arkiv queries for filtering when possible
- Handle missing optional fields gracefully

---

**Happy Building!** 🚀

For questions or issues, refer to the main `NEXTJS_DASHBOARD_GUIDE.md` or `ARKIV_SUMMARY.md`.
