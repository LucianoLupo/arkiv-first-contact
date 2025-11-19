# Arkiv First Contact - Event Generator Backend

> **Last Updated**: 2025-01-19
> **Project Type**: Backend Data Generator
> **Status**: Active Development

## Project Overview

**Purpose**: Backend event generator that simulates and pushes Aave V3 protocol events to Arkiv's DB-chain, serving as the data source for a Dune Analytics-style blockchain analytics dashboard.

**Vision**: Build a blockchain analytics platform where DeFi protocol events are stored in Arkiv's queryable, time-scoped database layer, enabling real-time analytics without traditional indexing infrastructure.

**Tech Stack**:
- **Runtime**: Node.js 18+ with TypeScript
- **Blockchain Layer**: Arkiv Network (Mendoza Testnet)
- **SDK**: @arkiv-network/sdk v0.4.5
- **Key Libraries**: ethers, dotenv, tsx

**Target Users**: Developers building blockchain analytics tools, DeFi researchers, hackathon participants exploring Arkiv Network.

---

## Architecture

### System Design

```
┌─────────────────────────────────────────┐
│     Event Generator (This Project)      │
│  • Simulates Aave V3 protocol events    │
│  • Generates realistic event data       │
│  • Pushes to Arkiv as entities          │
└───────────────┬─────────────────────────┘
                │
                │ Arkiv TypeScript SDK
                │ (createEntity calls)
                ▼
┌─────────────────────────────────────────┐
│      Arkiv Network (L2+L3)              │
│  • Stores entities with attributes      │
│  • Provides queryable interface         │
│  • Time-scoped storage                  │
└───────────────┬─────────────────────────┘
                │
                │ Query Interface
                │ (buildQuery, fetch)
                ▼
┌─────────────────────────────────────────┐
│     Next.js Dashboard (Separate)        │
│  • Queries events from Arkiv            │
│  • Visualizes analytics                 │
│  • Real-time updates via subscriptions  │
└─────────────────────────────────────────┘
```

### Key Architectural Decisions

**Why Arkiv Over Traditional Indexers:**
Arkiv provides queryable blockchain data without the complexity of running subgraphs or indexers. Events are stored directly on-chain with built-in query capabilities, eliminating the need for The Graph or custom indexing infrastructure.

**Why Time-Scoped Storage:**
Analytics platforms like Dune typically focus on recent data. Arkiv's time-scoped entities (configured via `expiresIn` parameter) automatically prune old data, reducing storage costs while maintaining query performance for recent events.

**Why Simulated Events:**
Real-time blockchain event indexing requires complex infrastructure. This project generates realistic mock data to demonstrate Arkiv's capabilities and provide immediate data for frontend development without blockchain sync delays.

**Why Aave V3 Events:**
Aave is one of the most active DeFi protocols, with diverse event types (Supply, Borrow, Repay, Liquidation) that showcase different query patterns. The event structure mirrors actual Aave smart contract events for realistic data modeling.

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or compatible package manager
- Arkiv Mendoza Testnet access
- Basic understanding of TypeScript and DeFi concepts

### Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**

   Copy `.env.example` to `.env` and configure:
   ```env
   PRIVATE_KEY=0x...  # Your Arkiv testnet private key
   RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
   WS_URL=wss://mendoza.hoodi.arkiv.network/rpc/ws
   ```

   **Important**: Never use mainnet keys. Get testnet funds from https://mendoza.hoodi.arkiv.network/faucet/

3. **Verify Setup**
   ```bash
   npm run type-check  # Ensure TypeScript compiles
   npm run lint        # Check code style
   ```

### Running the Application

**Hello World Example** (Basic Arkiv usage):
```bash
npm start
```
Creates a single greeting entity to verify Arkiv connectivity.

**Event Generator** (Main application):
```bash
npm run generate              # 50 events, 3s delay
npm run generate:small        # 10 events, 2s delay
npm run generate:large        # 100 events, 1s delay
```

Custom configuration:
```bash
npm run generate <count> <delay_ms>
# Example: npm run generate 25 5000  # 25 events, 5s delay
```

---

## Code Organization

### Project Structure

```
arkiv-first-contact/
├── index.ts                    # Hello world Arkiv example
├── event-generator.ts          # Main event generator application
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables (git-ignored)
├── .env.example               # Template for environment setup
├── README.md                  # Basic project documentation
├── ARKIV_SUMMARY.md          # Arkiv Network technical overview
├── NEXTJS_DASHBOARD_GUIDE.md # Complete frontend integration guide
├── .prettierrc               # Code formatting rules
├── .eslintrc.config.js       # Linting configuration
└── node_modules/             # Dependencies (git-ignored)
```

### Module Boundaries

**index.ts** - Educational Example:
- Demonstrates basic Arkiv SDK usage
- Creates simple greeting entity
- Shows query pattern with `buildQuery()` and `eq()` operator
- Includes error handling and connection verification
- **Do not modify** - serves as reference implementation

**event-generator.ts** - Production Event Generator:
- Simulates realistic Aave V3 protocol events
- Configurable event generation (count, delay)
- Weighted event distribution (35% Supply, 30% Borrow, etc.)
- Entity attribute mapping for queryability
- Progress logging and error handling
- **Extend this file** when adding new event types or protocols

### Key Files Deep Dive

**event-generator.ts Structure**:

```typescript
// 1. Configuration Section (Lines 1-20)
// - Imports and type definitions
// - Constants for assets, users, event types

// 2. Event Generation Functions (Lines 21-150)
// - generateSupplyEvent()
// - generateBorrowEvent()
// - generateWithdrawEvent()
// - generateRepayEvent()
// - generateLiquidationEvent()
// Pattern: Each returns AaveEvent with realistic data

// 3. Main Generator Loop (Lines 151-260)
// - Arkiv client initialization
// - Event generation loop with configurable delay
// - Entity creation with attributes
// - Progress logging and error handling
```

**Adding New Event Types**:

1. Define event generator function:
   ```typescript
   function generateFlashLoanEvent(): AaveEvent {
     return {
       eventType: 'FlashLoan',
       protocol: 'aave-v3',
       // ... event-specific fields
     };
   }
   ```

2. Add to weighted distribution in `generateRandomEvent()`:
   ```typescript
   const eventGenerators = [
     // ... existing generators
     { weight: 5, generator: generateFlashLoanEvent },
   ];
   ```

3. Update TypeScript types if needed (event-specific fields)

---

## Development Workflow

### Git Workflow

This project follows a simple feature-branch workflow:

1. **Feature Development**:
   ```bash
   git checkout -b feature/new-event-type
   # Make changes
   git add .
   git commit -m "Add flash loan event generation"
   ```

2. **Code Quality**:
   ```bash
   npm run type-check  # TypeScript validation
   npm run lint        # ESLint checks
   npm run format      # Prettier formatting
   ```

3. **Testing**:
   ```bash
   npm run generate:small  # Generate 10 test events
   # Verify events in Arkiv explorer
   ```

### Testing Strategy

**Manual Testing** (Current approach):
- Run event generator with small batch
- Check console output for errors
- Verify entities in Arkiv explorer: https://explorer.mendoza.hoodi.arkiv.network/
- Query events from Next.js dashboard to confirm data structure

**Future: Unit Tests** (Not yet implemented):
Consider adding tests for:
- Event generation functions (pure functions)
- Attribute mapping logic
- Error handling scenarios

### Deployment

**Current Deployment Model**: Run-on-demand script

This is not a long-running service. Typical usage:
1. Generate batch of events for testing
2. Stop the script
3. Query data from frontend
4. Generate more events as needed

**Future Production Considerations**:
- **Continuous Event Stream**: Run as cron job or scheduled task
- **Real Blockchain Integration**: Replace mock generation with actual event listening
- **Rate Limiting**: Respect Arkiv network limits
- **Monitoring**: Add logging and alerting for production use

---

## Conventions

### Code Style

**Naming Conventions**:
- **Functions**: camelCase, descriptive verbs
  ```typescript
  function generateSupplyEvent() { }      // ✅ Good
  function makeEvent() { }                // ❌ Too vague
  ```

- **Types/Interfaces**: PascalCase
  ```typescript
  interface AaveEvent { }                 // ✅ Good
  interface eventData { }                 // ❌ Wrong case
  ```

- **Constants**: SCREAMING_SNAKE_CASE for config, camelCase for arrays
  ```typescript
  const ASSETS = ['USDC', 'DAI'];         // ✅ Good
  const maxRetries = 3;                   // ✅ Good for non-config
  ```

**Function Organization**:
- Helper functions before main function
- Pure functions (event generators) grouped together
- Side-effect functions (Arkiv calls) in main()

**Error Handling Pattern**:
```typescript
try {
  const { entityKey } = await walletClient.createEntity({ ... });
  console.log('✅ Success:', entityKey);
} catch (error) {
  console.error('❌ Error:', error);
  // Continue with next event (don't crash on single failure)
}
```

### TypeScript Patterns

**Type Definitions**:
All event types are defined inline. Consider extracting to separate `types.ts` if project grows:
```typescript
// Current: Inline type definitions
type EventType = 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall';

// Future: Dedicated types file
// types.ts
export type AaveEventType = 'Supply' | 'Borrow' | ...;
export interface AaveSupplyEvent extends BaseEvent { ... }
```

**Strict TypeScript**:
Project uses `strict: true` in tsconfig.json. Always:
- Annotate function parameters and return types
- Avoid `any` unless absolutely necessary
- Use optional properties (`?`) for event-specific fields

### Import Patterns

**Standard Import Order**:
```typescript
// 1. External dependencies
import 'dotenv/config';
import { createWalletClient } from '@arkiv-network/sdk';

// 2. Internal utilities
import { stringToPayload } from './utils';  // If extracted

// 3. Types (if separated)
import type { AaveEvent } from './types';
```

---

## Domain Knowledge

### Aave V3 Protocol Events

This project simulates Aave V3 lending protocol events. Understanding these events is crucial for accurate data generation and frontend querying.

**Core Event Types**:

1. **Supply Event** (35% of generated events)
   - User deposits assets as collateral
   - Receives aTokens (interest-bearing tokens)
   - Fields: `reserve` (asset), `user`, `onBehalfOf` (beneficiary), `amount`, `referralCode`
   - Real-world example: User deposits 10,000 USDC to earn yield

2. **Borrow Event** (30% of generated events)
   - User borrows assets against collateral
   - Can choose stable or variable interest rate
   - Fields: `reserve`, `user`, `onBehalfOf`, `amount`, `interestRateMode` (1=Stable, 2=Variable), `borrowRate`
   - Real-world example: User borrows 5 ETH at 3.5% variable rate

3. **Withdraw Event** (20% of generated events)
   - User removes supplied collateral
   - Burns aTokens, receives underlying asset
   - Fields: `reserve`, `user`, `to` (recipient), `amount`
   - Real-world example: User withdraws 2,500 USDC to external wallet

4. **Repay Event** (12% of generated events)
   - User repays borrowed assets
   - Can use aTokens or direct repayment
   - Fields: `reserve`, `user`, `repayer`, `amount`, `useATokens` (boolean)
   - Real-world example: User repays 1 ETH debt plus interest

5. **LiquidationCall Event** (3% of generated events)
   - Liquidator repays debt for under-collateralized position
   - Receives collateral at discount (liquidation bonus)
   - Fields: `collateralAsset`, `debtAsset`, `user`, `liquidator`, `debtToCover`, `liquidatedCollateralAmount`
   - Real-world example: Position health factor drops below 1.0, liquidator repays $10k debt for $10.5k collateral

**Event Weight Distribution**:
Chosen to mirror real-world Aave usage patterns:
- Supply is most common (users providing liquidity)
- Borrow follows closely (active lending activity)
- Withdrawals are less frequent (sticky liquidity)
- Repays are periodic (loan maintenance)
- Liquidations are rare (only during market stress)

### DeFi Terminology

**Assets**:
- **USDC**: USD Coin (stablecoin)
- **WETH**: Wrapped Ether (ETH as ERC-20 token)
- **DAI**: Decentralized stablecoin
- **USDT**: Tether (stablecoin)
- **WBTC**: Wrapped Bitcoin
- **LINK**: Chainlink token

**Interest Rate Modes**:
- **Stable (1)**: Fixed rate, predictable payments, typically higher
- **Variable (2)**: Floating rate, changes with market, typically lower

**Health Factor**:
Position collateralization ratio. Below 1.0 triggers liquidation. Not directly used in generated events but important for understanding liquidations.

**Referral Code**:
Aave's referral system for integrators. Set to 0 in generated events (no referral).

### Arkiv Network Concepts

**Entities**:
The fundamental data unit in Arkiv. Each event is stored as an entity with:
- **Payload**: JSON-encoded event data
- **Attributes**: Key-value pairs for querying (e.g., `eventType=Supply`, `reserve=USDC`)
- **Expiration**: Auto-deletion after N blocks (`expiresIn: 10000` = ~2 days on Ethereum)

**Why Attributes Matter**:
Attributes enable SQL-like queries without indexing infrastructure:
```typescript
// Query all Supply events for USDC
await client.buildQuery()
  .where(eq('eventType', 'Supply'))
  .where(eq('reserve', 'USDC'))
  .fetch();
```

Each field of the event is stored as an attribute for maximum query flexibility.

**Entity Keys**:
Unique identifier for each entity, returned from `createEntity()`. Used to:
- Reference entities in frontend
- Extend expiration with `extendEntity()`
- Track entity lifecycle

---

## Common Tasks

### Adding a New Event Type

**Example: Adding Flash Loan Events**

1. **Define Event Interface** (if new fields needed):
   ```typescript
   interface AaveEvent {
     // ... existing fields
     initiator?: string;        // For flash loans
     premium?: string;          // Flash loan fee
   }
   ```

2. **Create Generator Function**:
   ```typescript
   function generateFlashLoanEvent(): AaveEvent {
     return {
       eventType: 'FlashLoan',
       protocol: 'aave-v3',
       network: 'ethereum',
       reserve: randomElement(ASSETS),
       user: randomAddress(),
       initiator: randomAddress(),
       amount: randomAmount(50000, 1000000), // Large amounts
       premium: (parseFloat(amount) * 0.0009).toFixed(2), // 0.09% fee
       txHash: generateTxHash(),
       blockNumber: getNextBlock(),
       timestamp: new Date().toISOString(),
     };
   }
   ```

3. **Add to Event Distribution** (line ~160 in event-generator.ts):
   ```typescript
   const eventGenerators = [
     { weight: 35, generator: generateSupplyEvent },
     { weight: 30, generator: generateBorrowEvent },
     { weight: 20, generator: generateWithdrawEvent },
     { weight: 12, generator: generateRepayEvent },
     { weight: 3, generator: generateLiquidationEvent },
     { weight: 2, generator: generateFlashLoanEvent },  // New event
   ];
   ```

4. **Update Type Definitions**:
   ```typescript
   type EventType = 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall' | 'FlashLoan';
   ```

5. **Test Generation**:
   ```bash
   npm run generate:small
   # Verify FlashLoan events appear in output
   ```

### Modifying Event Data Realism

**Adjusting Amount Ranges**:
Located in each generator function (lines ~80-140):
```typescript
// Current: Borrow events between $50 - $50,000
amount: randomAmount(50, 50000)

// Increase for whale activity simulation
amount: randomAmount(100000, 5000000)
```

**Adding New Assets**:
```typescript
const ASSETS = ['USDC', 'WETH', 'DAI', 'USDT', 'WBTC', 'LINK', 'AAVE']; // Add AAVE token
```

**Changing Block Number Range**:
```typescript
// Current: Starts around block 18M (line ~60)
let currentBlock = 18_000_000 + Math.floor(Math.random() * 1_000_000);

// Use recent Ethereum blocks
let currentBlock = 19_500_000;
```

### Integrating Real Blockchain Data

**Future Enhancement: Listen to Actual Aave Events**

Replace mock generation with real event listening:

```typescript
import { ethers } from 'ethers';

// 1. Connect to Ethereum RPC
const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');

// 2. Aave V3 Pool contract
const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, POOL_ABI, provider);

// 3. Listen for events
aavePool.on('Supply', async (reserve, user, onBehalfOf, amount, event) => {
  const aaveEvent: AaveEvent = {
    eventType: 'Supply',
    protocol: 'aave-v3',
    reserve: getAssetSymbol(reserve),  // Map address to symbol
    user,
    onBehalfOf,
    amount: ethers.utils.formatUnits(amount, getDecimals(reserve)),
    txHash: event.transactionHash,
    blockNumber: event.blockNumber,
    timestamp: (await event.getBlock()).timestamp,
  };

  // Push to Arkiv
  await pushEventToArkiv(aaveEvent);
});
```

**Considerations**:
- Requires Ethereum archive node for historical events
- Add rate limiting to respect Arkiv network limits
- Handle chain reorgs (events can be reversed)
- Map token addresses to symbols (requires token registry)

---

## Troubleshooting

### Common Issues

**Error: "Invalid private key"**
```
Error: invalid private key, expected hex or 32 bytes
```
**Solution**: Ensure `PRIVATE_KEY` in `.env` starts with `0x`:
```env
PRIVATE_KEY=0x6cdfb6fa20ab2c633928847b80c0fd3093b28da5...  # ✅ Correct
PRIVATE_KEY=6cdfb6fa20ab2c633928847b80c0fd3093b28da5...   # ❌ Missing 0x
```

**Error: "did not get any valid response from any backend"**
```
InternalRpcError: An internal error was received.
Details: did not get any valid response from any backend
```
**Causes**:
1. Arkiv Mendoza testnet is experiencing downtime
2. Network connectivity issues
3. Insufficient testnet funds

**Solutions**:
- Check testnet status at https://explorer.mendoza.hoodi.arkiv.network/
- Request funds from faucet: https://mendoza.hoodi.arkiv.network/faucet/
- Wait 1-2 minutes and retry (testnet can be slow)
- Verify RPC_URL in `.env` is correct

**Error: "Block at number X could not be found"**
```
BlockNotFoundError: Block at number "289120" could not be found.
```
**Cause**: Testnet block pruning or reorg

**Solution**: This is a testnet quirk. The transaction still succeeded. Check the explorer URL in console output to verify entity creation.

**Event Generation Hangs**
**Symptoms**: Script stops between events, no error message

**Causes**:
1. Network timeout during `createEntity()` call
2. Testnet congestion
3. Large payload size

**Solutions**:
- Increase delay between events: `npm run generate 10 5000` (5s delay)
- Reduce payload size (remove unnecessary attributes)
- Add timeout to createEntity calls (future enhancement)

**TypeScript Compilation Errors**
```
error TS2339: Property 'length' does not exist on type 'QueryResult'
```
**Cause**: Using wrong API for Arkiv SDK query results

**Solution**: Arkiv query results use `.entities` property:
```typescript
const result = await client.buildQuery().where(...).fetch();
const events = result.entities;  // ✅ Correct
const events = result;            // ❌ Wrong - result is not an array
```

### Network Issues

**Slow Transaction Confirmation**:
Arkiv Mendoza testnet can be slow during high usage. Typical confirmation times:
- Normal: 2-5 seconds
- Heavy load: 10-30 seconds
- Timeout: >60 seconds (retry recommended)

**Rate Limiting**:
No official rate limits documented, but recommended:
- Max 1 entity/second for sustained usage
- Batch if possible (future enhancement)
- Add exponential backoff on errors

---

## Additional Resources

### Arkiv Network

- **Official Docs**: https://arkiv.network/docs
- **TypeScript SDK**: https://www.npmjs.com/package/@arkiv-network/sdk
- **Litepaper**: See `ARKIV_SUMMARY.md` in this repo
- **Testnet Explorer**: https://explorer.mendoza.hoodi.arkiv.network/
- **Faucet**: https://mendoza.hoodi.arkiv.network/faucet/

### Aave Protocol

- **Aave V3 Docs**: https://docs.aave.com/developers
- **Pool Contract**: https://github.com/aave/aave-v3-core/blob/master/contracts/protocol/pool/Pool.sol
- **Event Definitions**: https://github.com/aave/aave-v3-core/blob/master/contracts/interfaces/IPool.sol

### Frontend Integration

- **Next.js Dashboard Guide**: See `NEXTJS_DASHBOARD_GUIDE.md` in this repo
- **Complete implementation guide** with:
  - Arkiv SDK setup for Next.js
  - Query functions and API routes
  - Component examples
  - Real-time subscription patterns

### Development Tools

- **TypeScript**: https://www.typescriptlang.org/docs
- **tsx**: https://github.com/esbuild-kit/tsx
- **ESLint**: https://eslint.org/docs/latest/
- **Prettier**: https://prettier.io/docs/en/

---

## Project Roadmap

### Current Status (MVP)
- [x] Basic Arkiv SDK integration
- [x] Aave V3 event generation (5 event types)
- [x] Configurable event generation (count, delay)
- [x] Weighted event distribution
- [x] Entity attribute mapping
- [x] Error handling and logging
- [x] TypeScript type safety
- [x] Code formatting and linting

### Next Steps (Planned)
- [ ] Unit tests for event generators
- [ ] Real blockchain event integration
- [ ] Support for multiple protocols (Compound, Uniswap)
- [ ] Event generation from CLI flags (e.g., `--protocol=aave --type=supply`)
- [ ] Batch entity creation (optimize for throughput)
- [ ] Persistent event history (local storage for replay)
- [ ] Admin dashboard for monitoring generation status

### Future Enhancements
- [ ] GraphQL API for event queries
- [ ] WebSocket API for real-time event streaming
- [ ] Historical data backfilling from The Graph
- [ ] Multi-chain support (Polygon, Arbitrum, Optimism)
- [ ] Custom event schema configuration
- [ ] Performance benchmarking and optimization

---

## Contributing

**Development Philosophy**:
- Keep event generators pure functions (no side effects)
- Maintain realistic data distributions (mirror real protocol usage)
- Add JSDoc comments for complex logic
- Update CLAUDE.md when adding significant features
- Test locally before pushing (run `generate:small`)

**Code Review Checklist**:
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Code passes linting (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] New event types have realistic data
- [ ] Event weight distribution is updated
- [ ] README.md updated if user-facing changes
- [ ] CLAUDE.md updated if architectural changes

---

## Appendix

### Environment Variables Reference

```env
# Required
PRIVATE_KEY=0x...        # Testnet private key (from wallet or generated)
RPC_URL=https://...      # Arkiv Mendoza testnet RPC endpoint
WS_URL=wss://...         # Arkiv Mendoza testnet WebSocket endpoint

# Optional (not currently used)
ARKIV_CHAIN_ID=60138453056  # Mendoza testnet chain ID
MAX_RETRIES=3                # Max retry attempts for failed transactions
```

### NPM Scripts Reference

```json
{
  "start": "tsx index.ts",                    // Run hello world example
  "dev": "tsx watch index.ts",                // Watch mode for development
  "generate": "tsx event-generator.ts",       // Generate 50 events
  "generate:small": "tsx event-generator.ts 10 2000",   // 10 events, 2s delay
  "generate:large": "tsx event-generator.ts 100 1000",  // 100 events, 1s delay
  "type-check": "tsc --noEmit",               // TypeScript validation
  "lint": "eslint .",                         // Run ESLint
  "lint:fix": "eslint . --fix",               // Auto-fix linting issues
  "format": "prettier --write \"**/*.{ts,js,json,md}\"",  // Format all files
  "format:check": "prettier --check \"**/*.{ts,js,json,md}\""  // Check formatting
}
```

### TypeScript Configuration

Key settings in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",           // Modern JavaScript features
    "module": "ESNext",           // ESM modules
    "moduleResolution": "Bundler", // For tsx compatibility
    "strict": true,               // Strict type checking
    "esModuleInterop": true,      // CommonJS interop
    "skipLibCheck": true          // Skip lib type checking (performance)
  }
}
```

### Quick Reference: Event Generation

**Generate custom event batch**:
```bash
# Syntax: npm run generate <count> <delay_ms>
npm run generate 20 1000     # 20 events, 1s delay = ~20s total
npm run generate 5 10000     # 5 events, 10s delay = ~50s total
```

**Calculate generation time**:
```
Total Time = (Event Count - 1) × Delay + Transaction Time
Example: (100 - 1) × 1000ms + ~500ms = ~99.5 seconds
```

**Optimal settings**:
- **Development/Testing**: `generate:small` (10 events, 2s delay)
- **Demo/Presentation**: `generate` (50 events, 3s delay)
- **Data Seeding**: `generate:large` (100 events, 1s delay)
- **Stress Testing**: Custom (500+ events, 500ms delay)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-19
**Maintainer**: Project Team
**License**: ISC
