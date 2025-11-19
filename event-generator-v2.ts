import 'dotenv/config';
import { createWalletClient, http } from '@arkiv-network/sdk';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { mendoza } from '@arkiv-network/sdk/chains';

// Helper function to convert string to payload
function stringToPayload(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// ============================================================================
// DATA TYPES
// ============================================================================

type EntityType = 'protocol_event' | 'aggregated_metric' | 'price_snapshot';
type ProtocolType = 'aave-v3' | 'uniswap-v3';
type AaveEventType = 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall';
type UniswapEventType = 'Swap';

// Common DeFi assets
const ASSETS = ['USDC', 'WETH', 'DAI', 'USDT', 'WBTC', 'LINK', 'UNI', 'AAVE'];

// Sample user addresses
const USERS = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  '0x8E5C23e6c59F9e8B4d1a0b98d85d7d7c5c3f12F9',
  '0x1234567890123456789012345678901234567890',
  '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  '0x9876543210987654321098765432109876543210',
  '0x5566778899AABBCCDDEEFF0011223344556677',
  '0xDEADBEEF00000000000000000000000000000000',
  '0xCAFEBABE00000000000000000000000000000000',
];

// Token prices (mock data in USD)
const TOKEN_PRICES: Record<string, number> = {
  USDC: 1.0,
  WETH: 2450.0,
  DAI: 1.0,
  USDT: 1.0,
  WBTC: 45000.0,
  LINK: 15.5,
  UNI: 8.2,
  AAVE: 95.0,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomAmount(min: number, max: number): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomAddress(): string {
  return randomElement(USERS);
}

function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Generate realistic block numbers (around current Ethereum mainnet)
let currentBlock = 18_000_000 + Math.floor(Math.random() * 1_000_000);

function getNextBlock(): number {
  currentBlock += Math.floor(Math.random() * 5) + 1;
  return currentBlock;
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

function getHourTimestamp(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

// ============================================================================
// AAVE V3 EVENT GENERATORS
// ============================================================================

interface AaveEvent {
  entityType: EntityType;
  eventType: AaveEventType;
  protocol: ProtocolType;
  network: string;
  reserve: string;
  user: string;
  amount: string;
  amountUSD: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;

  // Event-specific fields
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

function calculateUSD(amount: string, asset: string): string {
  const amountNum = parseFloat(amount);
  const price = TOKEN_PRICES[asset] || 1;
  return (amountNum * price).toFixed(2);
}

function generateSupplyEvent(): AaveEvent {
  const user = randomAddress();
  const reserve = randomElement(ASSETS);
  const amount = randomAmount(100, 100000);

  return {
    entityType: 'protocol_event',
    eventType: 'Supply',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve,
    user,
    onBehalfOf: Math.random() > 0.8 ? randomAddress() : user,
    amount,
    amountUSD: calculateUSD(amount, reserve),
    referralCode: 0,
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: getCurrentTimestamp(),
  };
}

function generateBorrowEvent(): AaveEvent {
  const user = randomAddress();
  const reserve = randomElement(ASSETS);
  const amount = randomAmount(50, 50000);

  return {
    entityType: 'protocol_event',
    eventType: 'Borrow',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve,
    user,
    onBehalfOf: Math.random() > 0.9 ? randomAddress() : user,
    amount,
    amountUSD: calculateUSD(amount, reserve),
    interestRateMode: Math.random() > 0.7 ? 1 : 2, // 1=Stable, 2=Variable
    borrowRate: (Math.random() * 10 + 1).toFixed(4) + '%',
    referralCode: 0,
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: getCurrentTimestamp(),
  };
}

function generateWithdrawEvent(): AaveEvent {
  const user = randomAddress();
  const reserve = randomElement(ASSETS);
  const amount = randomAmount(100, 50000);

  return {
    entityType: 'protocol_event',
    eventType: 'Withdraw',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve,
    user,
    to: Math.random() > 0.8 ? randomAddress() : user,
    amount,
    amountUSD: calculateUSD(amount, reserve),
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: getCurrentTimestamp(),
  };
}

function generateRepayEvent(): AaveEvent {
  const user = randomAddress();
  const reserve = randomElement(ASSETS);
  const amount = randomAmount(50, 30000);

  return {
    entityType: 'protocol_event',
    eventType: 'Repay',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve,
    user,
    repayer: Math.random() > 0.9 ? randomAddress() : user,
    amount,
    amountUSD: calculateUSD(amount, reserve),
    useATokens: Math.random() > 0.8,
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: getCurrentTimestamp(),
  };
}

function generateLiquidationEvent(): AaveEvent {
  const collateralAsset = randomElement(ASSETS);
  const debtAsset = randomElement(ASSETS);
  const debtToCover = randomAmount(1000, 50000);
  const liquidatedCollateralAmount = randomAmount(1100, 55000);

  return {
    entityType: 'protocol_event',
    eventType: 'LiquidationCall',
    protocol: 'aave-v3',
    network: 'ethereum',
    collateralAsset,
    debtAsset,
    user: randomAddress(),
    liquidator: randomAddress(),
    debtToCover,
    debtToCoverUSD: calculateUSD(debtToCover, debtAsset),
    liquidatedCollateralAmount,
    liquidatedCollateralAmountUSD: calculateUSD(liquidatedCollateralAmount, collateralAsset),
    reserve: collateralAsset,
    amount: debtToCover,
    amountUSD: calculateUSD(debtToCover, debtAsset),
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// UNISWAP V3 EVENT GENERATORS
// ============================================================================

interface UniswapEvent {
  entityType: EntityType;
  eventType: UniswapEventType;
  protocol: ProtocolType;
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

function generateSwapEvent(): UniswapEvent {
  const tokenIn = randomElement(ASSETS);
  let tokenOut = randomElement(ASSETS);
  // Ensure different tokens
  while (tokenOut === tokenIn) {
    tokenOut = randomElement(ASSETS);
  }

  const amountIn = randomAmount(100, 50000);
  // Calculate amount out based on price ratio (simplified)
  const priceRatio = TOKEN_PRICES[tokenOut] / TOKEN_PRICES[tokenIn];
  const amountOut = (parseFloat(amountIn) / priceRatio).toFixed(2);

  return {
    entityType: 'protocol_event',
    eventType: 'Swap',
    protocol: 'uniswap-v3',
    network: 'ethereum',
    sender: randomAddress(),
    recipient: randomAddress(),
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    amountInUSD: calculateUSD(amountIn, tokenIn),
    amountOutUSD: calculateUSD(amountOut, tokenOut),
    sqrtPriceX96: '79228162514264337593543950336', // Mock value
    liquidity: randomAmount(1000000, 10000000),
    tick: Math.floor(Math.random() * 200000) - 100000,
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// AGGREGATED METRICS GENERATORS
// ============================================================================

interface AggregatedMetric {
  entityType: EntityType;
  metricType: 'hourly_summary';
  protocol: ProtocolType;
  timeWindow: string;
  timestamp: string;

  // Volume metrics
  totalVolumeUSD: string;
  transactionCount: number;
  uniqueUsers: number;

  // Asset breakdown
  assetVolumes: Record<string, string>;

  // Event type breakdown
  eventTypeCounts: Record<string, number>;

  // Average values
  avgTransactionSizeUSD: string;
}

function generateHourlySummary(protocol: ProtocolType): AggregatedMetric {
  const txCount = Math.floor(Math.random() * 500) + 50;
  const uniqueUsers = Math.floor(txCount * (0.3 + Math.random() * 0.4));
  const totalVolume = randomAmount(100000, 5000000);

  // Generate asset volumes
  const assetVolumes: Record<string, string> = {};
  ASSETS.forEach((asset) => {
    if (Math.random() > 0.3) {
      assetVolumes[asset] = randomAmount(10000, 500000);
    }
  });

  // Generate event type counts
  const eventTypeCounts: Record<string, number> = {};
  if (protocol === 'aave-v3') {
    eventTypeCounts['Supply'] = Math.floor(Math.random() * 200) + 50;
    eventTypeCounts['Borrow'] = Math.floor(Math.random() * 150) + 30;
    eventTypeCounts['Withdraw'] = Math.floor(Math.random() * 100) + 20;
    eventTypeCounts['Repay'] = Math.floor(Math.random() * 80) + 10;
    eventTypeCounts['LiquidationCall'] = Math.floor(Math.random() * 10);
  } else {
    eventTypeCounts['Swap'] = txCount;
  }

  return {
    entityType: 'aggregated_metric',
    metricType: 'hourly_summary',
    protocol,
    timeWindow: '1h',
    timestamp: getHourTimestamp(),
    totalVolumeUSD: totalVolume,
    transactionCount: txCount,
    uniqueUsers,
    assetVolumes,
    eventTypeCounts,
    avgTransactionSizeUSD: (parseFloat(totalVolume) / txCount).toFixed(2),
  };
}

// ============================================================================
// PRICE SNAPSHOT GENERATORS
// ============================================================================

interface PriceSnapshot {
  entityType: EntityType;
  snapshotType: 'price_snapshot';
  asset: string;
  priceUSD: string;
  timestamp: string;

  // Additional price data
  change24h: string;
  volume24hUSD: string;
  marketCapUSD?: string;
}

function generatePriceSnapshot(asset: string): PriceSnapshot {
  const basePrice = TOKEN_PRICES[asset];
  // Add some random variation (-5% to +5%)
  const variation = (Math.random() - 0.5) * 0.1;
  const currentPrice = (basePrice * (1 + variation)).toFixed(2);

  const change24h = ((Math.random() - 0.5) * 20).toFixed(2); // -10% to +10%
  const volume24h = randomAmount(1000000, 50000000);

  return {
    entityType: 'price_snapshot',
    snapshotType: 'price_snapshot',
    asset,
    priceUSD: currentPrice,
    timestamp: getCurrentTimestamp(),
    change24h: change24h + '%',
    volume24hUSD: volume24h,
    marketCapUSD: (parseFloat(currentPrice) * Math.random() * 1000000000).toFixed(2),
  };
}

// ============================================================================
// MAIN EVENT GENERATION
// ============================================================================

type GeneratedEntity = AaveEvent | UniswapEvent | AggregatedMetric | PriceSnapshot;

function generateRandomEntity(): GeneratedEntity {
  const entityGenerators = [
    // Protocol events (70% of data)
    { weight: 25, generator: generateSupplyEvent },
    { weight: 20, generator: generateBorrowEvent },
    { weight: 15, generator: generateWithdrawEvent },
    { weight: 8, generator: generateRepayEvent },
    { weight: 2, generator: generateLiquidationEvent },
    { weight: 20, generator: generateSwapEvent },

    // Aggregated metrics (20% of data)
    { weight: 5, generator: () => generateHourlySummary('aave-v3') },
    { weight: 5, generator: () => generateHourlySummary('uniswap-v3') },

    // Price snapshots (10% of data)
    { weight: 2, generator: () => generatePriceSnapshot(randomElement(ASSETS)) },
  ];

  const totalWeight = entityGenerators.reduce((sum, { weight }) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const { weight, generator } of entityGenerators) {
    random -= weight;
    if (random <= 0) {
      return generator();
    }
  }

  return generateSupplyEvent();
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Enhanced Arkiv Event Generator (Multi-Protocol)\n');

  // Check if private key is set
  if (
    !process.env.PRIVATE_KEY ||
    process.env.PRIVATE_KEY ===
      '0x0000000000000000000000000000000000000000000000000000000000000000'
  ) {
    console.error('❌ Error: Please set your PRIVATE_KEY in the .env file');
    process.exit(1);
  }

  // Initialize the wallet client
  const walletClient = createWalletClient({
    chain: mendoza,
    transport: http(process.env.RPC_URL),
    account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  });

  console.log('✅ Connected to Arkiv Mendoza Testnet');
  console.log(`📍 Account: ${walletClient.account?.address}\n`);
  console.log('📊 Starting enhanced event generation...\n');
  console.log('📦 Generating: Protocol Events, Aggregated Metrics, Price Snapshots\n');

  let entityCount = 0;
  const maxEntities = process.argv[2] ? parseInt(process.argv[2]) : 100;
  const delayMs = process.argv[3] ? parseInt(process.argv[3]) : 2000;

  console.log(`Will generate ${maxEntities} entities with ${delayMs}ms delay between each\n`);

  // Statistics
  const stats = {
    protocolEvents: 0,
    aggregatedMetrics: 0,
    priceSnapshots: 0,
    byProtocol: { 'aave-v3': 0, 'uniswap-v3': 0 },
  };

  for (let i = 0; i < maxEntities; i++) {
    try {
      const entity = generateRandomEntity();

      // Create attributes array from entity object
      const attributes = Object.entries(entity)
        .filter(([key]) => key !== 'timestamp')
        .map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : value?.toString() || '',
        }));

      // Add timestamp as attribute
      attributes.push({ key: 'timestamp', value: entity.timestamp });

      // Create entity payload
      const payload = JSON.stringify(entity, null, 2);

      // Push to Arkiv
      const { entityKey, txHash } = await walletClient.createEntity({
        payload: stringToPayload(payload),
        contentType: 'application/json',
        attributes,
        expiresIn: 10000, // Expire after 10000 blocks
      });

      entityCount++;

      // Update statistics
      if ('eventType' in entity) {
        stats.protocolEvents++;
        stats.byProtocol[entity.protocol]++;
        console.log(
          `✅ Entity #${entityCount}: ${entity.protocol} ${entity.eventType} | ${(entity as any).tokenIn || (entity as any).reserve || 'N/A'}`
        );
      } else if ('metricType' in entity) {
        stats.aggregatedMetrics++;
        console.log(
          `✅ Entity #${entityCount}: Hourly Summary | ${entity.protocol} | $${entity.totalVolumeUSD}`
        );
      } else if ('snapshotType' in entity) {
        stats.priceSnapshots++;
        console.log(`✅ Entity #${entityCount}: Price Snapshot | ${entity.asset} | $${entity.priceUSD}`);
      }

      console.log(`   Entity Key: ${entityKey.slice(0, 20)}...`);
      console.log(`   Tx Hash: ${txHash.slice(0, 20)}...\n`);

      // Wait before next entity
      if (i < maxEntities - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`❌ Error generating entity #${i + 1}:`, error);
      // Continue with next entity
    }
  }

  console.log(`\n🎉 Generation complete! Pushed ${entityCount} entities to Arkiv\n`);
  console.log('📊 Statistics:');
  console.log(`   Protocol Events: ${stats.protocolEvents}`);
  console.log(`     - Aave V3: ${stats.byProtocol['aave-v3']}`);
  console.log(`     - Uniswap V3: ${stats.byProtocol['uniswap-v3']}`);
  console.log(`   Aggregated Metrics: ${stats.aggregatedMetrics}`);
  console.log(`   Price Snapshots: ${stats.priceSnapshots}`);
  console.log('\n💡 Next steps:');
  console.log('   - Query events by protocol, entity type, or time period');
  console.log('   - Build charts from aggregated metrics');
  console.log('   - Calculate USD values using price snapshots');
  console.log('   - Filter events by asset, user, or event type');
}

main().catch(console.error);
