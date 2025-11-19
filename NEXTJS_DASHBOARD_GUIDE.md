# Next.js Dashboard for Arkiv Analytics - Complete Implementation Guide

## Project Overview

Build a Dune Analytics-style dashboard using Next.js that queries and visualizes blockchain events (Aave protocol events) stored in Arkiv's DB-chain.

**Project Name**: Arkiv Analytics Dashboard
**Tech Stack**: Next.js 15 (App Router), TypeScript, Arkiv SDK, TailwindCSS, Recharts
**Purpose**: Query and visualize Aave protocol events stored on Arkiv

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Arkiv SDK Integration](#arkiv-sdk-integration)
5. [Event Schema](#event-schema)
6. [API Routes](#api-routes)
7. [Components Structure](#components-structure)
8. [Example Queries](#example-queries)
9. [UI Components](#ui-components)
10. [Best Practices](#best-practices)
11. [Deployment](#deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│     Next.js Frontend (App Router)       │
│  • Server Components (data fetching)    │
│  • Client Components (interactivity)    │
│  • API Routes (optional caching)        │
└───────────────┬─────────────────────────┘
                │
                │ Arkiv TypeScript SDK
                │
                ▼
┌─────────────────────────────────────────┐
│         Arkiv Network (L2+L3)           │
│  • Query blockchain events              │
│  • Real-time subscriptions              │
│  • Filter & aggregate data              │
└───────────────┬─────────────────────────┘
                │
                │
                ▼
┌─────────────────────────────────────────┐
│      Stored Aave Protocol Events        │
│  • Supply, Borrow, Withdraw, Repay,     │
│    Liquidation events                   │
└─────────────────────────────────────────┘
```

---

## Prerequisites

### Required Tools
- Node.js 18+ (LTS recommended)
- npm, pnpm, or yarn
- Git
- Code editor (VS Code recommended)

### Required Knowledge
- TypeScript fundamentals
- Next.js 15 (App Router)
- React Server Components
- Basic understanding of blockchain events

### Arkiv Testnet Access
- **Chain ID**: 60138453056
- **RPC URL**: `https://mendoza.hoodi.arkiv.network/rpc`
- **WebSocket URL**: `wss://mendoza.hoodi.arkiv.network/rpc/ws`
- **Explorer**: https://explorer.mendoza.hoodi.arkiv.network/

---

## Project Setup

### 1. Initialize Next.js Project

**Note**: This will install Next.js 15 (latest version as of January 2025).

```bash
npx create-next-app@latest arkiv-analytics-dashboard
# Choose:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes
# ✓ src/ directory: Yes
# ✓ App Router: Yes
# ✓ Turbopack: No (optional)
# ✓ Import alias: Yes (@/*)

cd arkiv-analytics-dashboard
```

### 2. Install Dependencies

```bash
npm install @arkiv-network/sdk dotenv
npm install recharts date-fns
npm install -D @types/node
```

### 3. Environment Variables

Create `.env.local`:

```env
# Arkiv Network Configuration
NEXT_PUBLIC_ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
NEXT_PUBLIC_ARKIV_WS_URL=wss://mendoza.hoodi.arkiv.network/rpc/ws

# Optional: For write operations (not needed for querying)
ARKIV_PRIVATE_KEY=0x...
```

### 4. Project Structure

```
arkiv-analytics-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── events/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── events/
│   │       │   └── route.ts
│   │       └── stats/
│   │           └── route.ts
│   ├── components/
│   │   ├── EventsTable.tsx
│   │   ├── EventsChart.tsx
│   │   ├── StatsCards.tsx
│   │   ├── FilterBar.tsx
│   │   └── EventDetails.tsx
│   ├── lib/
│   │   ├── arkiv.ts
│   │   ├── queries.ts
│   │   └── types.ts
│   └── utils/
│       ├── formatters.ts
│       └── constants.ts
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Arkiv SDK Integration

### 1. Create Arkiv Client (`src/lib/arkiv.ts`)

```typescript
import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';

// Singleton pattern for public client
let publicClientInstance: ReturnType<typeof createPublicClient> | null = null;

export function getArkivPublicClient() {
  if (!publicClientInstance) {
    publicClientInstance = createPublicClient({
      chain: mendoza,
      transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL),
    });
  }
  return publicClientInstance;
}

// For client-side components
export function getArkivClientForBrowser() {
  return createPublicClient({
    chain: mendoza,
    transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL),
  });
}
```

### 2. Type Definitions (`src/lib/types.ts`)

```typescript
// Aave Event Types
export type AaveEventType = 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall';

// Base Event Interface
export interface AaveEvent {
  eventType: AaveEventType;
  protocol: string;
  network: string;
  reserve: string;
  user: string;
  amount: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;

  // Optional fields
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
  debtToCover?: string;
}

// Arkiv Entity Response
export interface ArkivEntity {
  key: string;
  payload: Uint8Array;
  attributes: Array<{
    key: string;
    value: string;
  }>;
  contentType: string;
  expiration: number;
  owner: string;
  createdAtBlock: number;
  lastModifiedAtBlock: number;
}

// Query Result
export interface EventQueryResult {
  entities: ArkivEntity[];
  hasNextPage: () => boolean;
  next: () => Promise<EventQueryResult>;
}

// Parsed Event
export interface ParsedEvent extends AaveEvent {
  entityKey: string;
}

// Stats
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<AaveEventType, number>;
  totalVolume: {
    [asset: string]: number;
  };
  uniqueUsers: number;
  recentEvents: ParsedEvent[];
}

// Filter Options
export interface EventFilters {
  eventType?: AaveEventType;
  asset?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}
```

### 3. Query Functions (`src/lib/queries.ts`)

```typescript
import { getArkivPublicClient } from './arkiv';
import { eq } from '@arkiv-network/sdk/query';
import type { AaveEvent, ParsedEvent, EventFilters, EventStats } from './types';

// Parse entity payload
export function parseEventPayload(payload: Uint8Array): AaveEvent {
  const text = new TextDecoder().decode(payload);
  return JSON.parse(text);
}

// Parse entity to event
export function parseEntity(entity: any): ParsedEvent {
  const event = parseEventPayload(entity.payload);
  return {
    ...event,
    entityKey: entity.key,
  };
}

// Query all blockchain events
export async function queryAllEvents(limit = 100): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('type', 'blockchain_event'))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events by type
export async function queryEventsByType(
  eventType: string,
  limit = 50
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('eventType', eventType))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events by asset
export async function queryEventsByAsset(
  asset: string,
  limit = 50
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('reserve', asset))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events by user
export async function queryEventsByUser(
  userAddress: string,
  limit = 50
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  const result = await client
    .buildQuery()
    .where(eq('user', userAddress))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.slice(0, limit).map(parseEntity);
}

// Query events with filters
export async function queryEventsWithFilters(
  filters: EventFilters
): Promise<ParsedEvent[]> {
  const client = getArkivPublicClient();

  let query = client.buildQuery();

  // Apply filters
  if (filters.eventType) {
    query = query.where(eq('eventType', filters.eventType));
  } else if (filters.asset) {
    query = query.where(eq('reserve', filters.asset));
  } else if (filters.user) {
    query = query.where(eq('user', filters.user));
  } else {
    // Default: get all blockchain events
    query = query.where(eq('type', 'blockchain_event'));
  }

  const result = await query
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  let events = result.entities.map(parseEntity);

  // Client-side filtering for date ranges (Arkiv doesn't support complex queries yet)
  if (filters.startDate) {
    const startTime = new Date(filters.startDate).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() >= startTime);
  }

  if (filters.endDate) {
    const endTime = new Date(filters.endDate).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() <= endTime);
  }

  // Sort by timestamp descending
  events.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply limit
  const limit = filters.limit || 100;
  return events.slice(0, limit);
}

// Calculate statistics
export async function calculateEventStats(): Promise<EventStats> {
  const events = await queryAllEvents(1000); // Get more events for stats

  const stats: EventStats = {
    totalEvents: events.length,
    eventsByType: {
      Supply: 0,
      Borrow: 0,
      Withdraw: 0,
      Repay: 0,
      LiquidationCall: 0,
    },
    totalVolume: {},
    uniqueUsers: new Set(events.map(e => e.user)).size,
    recentEvents: events.slice(0, 10),
  };

  events.forEach(event => {
    // Count by type
    stats.eventsByType[event.eventType]++;

    // Sum volume by asset
    const amount = parseFloat(event.amount);
    if (!isNaN(amount)) {
      if (!stats.totalVolume[event.reserve]) {
        stats.totalVolume[event.reserve] = 0;
      }
      stats.totalVolume[event.reserve] += amount;
    }
  });

  return stats;
}
```

### 4. Real-time Subscriptions (`src/lib/subscriptions.ts`)

```typescript
import { getArkivClientForBrowser } from './arkiv';
import type { ParsedEvent } from './types';
import { parseEventPayload } from './queries';

export function subscribeToNewEvents(
  onNewEvent: (event: ParsedEvent) => void
): () => void {
  const client = getArkivClientForBrowser();

  const stopSubscription = client.subscribeEntityEvents({
    onEntityCreated: async (entity) => {
      // Check if it's a blockchain event
      const typeAttr = entity.attributes.find(a => a.key === 'type');
      if (typeAttr?.value === 'blockchain_event') {
        const event = parseEventPayload(entity.payload);
        onNewEvent({
          ...event,
          entityKey: entity.key,
        });
      }
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
  });

  return stopSubscription;
}
```

---

## API Routes

### 1. Events API (`src/app/api/events/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { queryEventsWithFilters } from '@/lib/queries';
import type { EventFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: EventFilters = {
      eventType: searchParams.get('eventType') as any,
      asset: searchParams.get('asset') || undefined,
      user: searchParams.get('user') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
    };

    const events = await queryEventsWithFilters(filters);

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
```

### 2. Stats API (`src/app/api/stats/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { calculateEventStats } from '@/lib/queries';

export async function GET() {
  try {
    const stats = await calculateEventStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}

// Cache for 30 seconds
export const revalidate = 30;
```

---

## Components Structure

### 1. Stats Cards (`src/components/StatsCards.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { EventStats } from '@/lib/types';

export default function StatsCards() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const json = await response.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  if (!stats) {
    return <div>Failed to load stats</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Events"
        value={stats.totalEvents}
        icon="📊"
      />
      <StatCard
        title="Unique Users"
        value={stats.uniqueUsers}
        icon="👥"
      />
      <StatCard
        title="Supply Events"
        value={stats.eventsByType.Supply}
        icon="💰"
      />
      <StatCard
        title="Borrow Events"
        value={stats.eventsByType.Borrow}
        icon="🏦"
      />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
```

### 2. Events Table (`src/components/EventsTable.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { ParsedEvent } from '@/lib/types';
import { formatDistance } from 'date-fns';

interface EventsTableProps {
  initialEvents?: ParsedEvent[];
}

export default function EventsTable({ initialEvents = [] }: EventsTableProps) {
  const [events, setEvents] = useState<ParsedEvent[]>(initialEvents);
  const [loading, setLoading] = useState(!initialEvents.length);

  useEffect(() => {
    if (!initialEvents.length) {
      fetchEvents();
    }
  }, [initialEvents.length]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const response = await fetch('/api/events?limit=50');
      const json = await response.json();
      if (json.success) {
        setEvents(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asset
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tx Hash
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {events.map((event) => (
            <tr key={event.entityKey}>
              <td className="px-6 py-4 whitespace-nowrap">
                <EventTypeBadge type={event.eventType} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-medium">{event.reserve}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {parseFloat(event.amount).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                {event.user.slice(0, 6)}...{event.user.slice(-4)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDistance(new Date(event.timestamp), new Date(), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                <a
                  href={`https://explorer.mendoza.hoodi.arkiv.network/tx/${event.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {event.txHash.slice(0, 8)}...
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Supply: 'bg-green-100 text-green-800',
    Borrow: 'bg-blue-100 text-blue-800',
    Withdraw: 'bg-yellow-100 text-yellow-800',
    Repay: 'bg-purple-100 text-purple-800',
    LiquidationCall: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  );
}
```

### 3. Filter Bar (`src/components/FilterBar.tsx`)

```typescript
'use client';

import { useState } from 'react';
import type { EventFilters } from '@/lib/types';

interface FilterBarProps {
  onFilterChange: (filters: EventFilters) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<EventFilters>({});

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Event Type</label>
          <select
            className="w-full rounded border-gray-300 dark:border-gray-700"
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Supply">Supply</option>
            <option value="Borrow">Borrow</option>
            <option value="Withdraw">Withdraw</option>
            <option value="Repay">Repay</option>
            <option value="LiquidationCall">Liquidation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Asset</label>
          <select
            className="w-full rounded border-gray-300 dark:border-gray-700"
            onChange={(e) => handleFilterChange('asset', e.target.value)}
          >
            <option value="">All Assets</option>
            <option value="USDC">USDC</option>
            <option value="WETH">WETH</option>
            <option value="DAI">DAI</option>
            <option value="USDT">USDT</option>
            <option value="WBTC">WBTC</option>
            <option value="LINK">LINK</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">User Address</label>
          <input
            type="text"
            placeholder="0x..."
            className="w-full rounded border-gray-300 dark:border-gray-700"
            onChange={(e) => handleFilterChange('user', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Limit</label>
          <select
            className="w-full rounded border-gray-300 dark:border-gray-700"
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            defaultValue="50"
          >
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

---

## Example Queries

### Server Component Example

```typescript
// src/app/page.tsx
import { queryAllEvents, calculateEventStats } from '@/lib/queries';
import StatsCards from '@/components/StatsCards';
import EventsTable from '@/components/EventsTable';

export default async function HomePage() {
  // Fetch data on the server
  const events = await queryAllEvents(50);
  const stats = await calculateEventStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Arkiv Analytics</h1>

      <StatsCards />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
        <EventsTable initialEvents={events} />
      </div>
    </div>
  );
}

// Revalidate every 30 seconds
export const revalidate = 30;
```

### Client Component with Real-time Updates

```typescript
'use client';

import { useEffect, useState } from 'react';
import { subscribeToNewEvents } from '@/lib/subscriptions';
import type { ParsedEvent } from '@/lib/types';

export default function LiveEvents() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToNewEvents((newEvent) => {
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h2>Live Events</h2>
      {events.map((event) => (
        <div key={event.entityKey}>
          {event.eventType} - {event.reserve} - {event.amount}
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Performance Optimization

- **Server Components**: Use for data fetching when possible
- **Caching**: Implement ISR (Incremental Static Regeneration) with `revalidate`
- **Pagination**: Don't load all events at once
- **Lazy Loading**: Use dynamic imports for heavy components

### 2. Error Handling

```typescript
try {
  const events = await queryAllEvents();
  return events;
} catch (error) {
  console.error('Query failed:', error);
  // Return cached data or empty array
  return [];
}
```

### 3. TypeScript Safety

- Always define types for props and state
- Use proper SDK types from `@arkiv-network/sdk`
- Validate data before rendering

### 4. Real-time Updates

- Use subscriptions for live data
- Implement reconnection logic
- Handle subscription cleanup properly

### 5. Data Transformation

- Parse data on the server when possible
- Cache parsed results
- Use memoization for expensive calculations

---

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - NEXT_PUBLIC_ARKIV_RPC_URL
# - NEXT_PUBLIC_ARKIV_WS_URL
```

### Environment Variables

Ensure these are set in your deployment platform:
- `NEXT_PUBLIC_ARKIV_RPC_URL`
- `NEXT_PUBLIC_ARKIV_WS_URL`

---

## Testing Queries Locally

Before building the full dashboard, test queries:

```typescript
// test-queries.ts
import { queryAllEvents, calculateEventStats } from './src/lib/queries';

async function test() {
  console.log('Fetching events...');
  const events = await queryAllEvents(10);
  console.log('Events:', events);

  console.log('\nCalculating stats...');
  const stats = await calculateEventStats();
  console.log('Stats:', stats);
}

test();
```

Run: `tsx test-queries.ts`

---

## Summary Checklist

- [ ] Initialize Next.js project with TypeScript
- [ ] Install Arkiv SDK and dependencies
- [ ] Create environment variables
- [ ] Set up Arkiv client singleton
- [ ] Define TypeScript types
- [ ] Implement query functions
- [ ] Create API routes
- [ ] Build UI components
- [ ] Implement real-time subscriptions
- [ ] Add error handling
- [ ] Test queries locally
- [ ] Deploy to Vercel

---

## Resources

- **Arkiv Docs**: https://arkiv.network/docs
- **Arkiv SDK**: https://www.npmjs.com/package/@arkiv-network/sdk
- **Next.js Docs**: https://nextjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **Recharts**: https://recharts.org/

---

## Support

For issues or questions:
- Arkiv Discord/Community
- GitHub Issues
- Documentation

---

**Good luck building your Arkiv Analytics dashboard!** 🚀
