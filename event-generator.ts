import 'dotenv/config';
import { createWalletClient, http } from '@arkiv-network/sdk';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { mendoza } from '@arkiv-network/sdk/chains';

// Helper function to convert string to payload
function stringToPayload(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Aave V3 Event Types
type EventType = 'Supply' | 'Borrow' | 'Withdraw' | 'Repay' | 'LiquidationCall';

// Common DeFi assets
const ASSETS = ['USDC', 'WETH', 'DAI', 'USDT', 'WBTC', 'LINK'];

// Sample user addresses
const USERS = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  '0x8E5C23e6c59F9e8B4d1a0b98d85d7d7c5c3f12F9',
  '0x1234567890123456789012345678901234567890',
  '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  '0x9876543210987654321098765432109876543210',
];

// Generate random values
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

// Event generators
interface AaveEvent {
  eventType: EventType;
  protocol: string;
  network: string;
  reserve: string;
  user: string;
  amount: string;
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
  debtToCover?: string;
}

function generateSupplyEvent(): AaveEvent {
  const user = randomAddress();
  return {
    eventType: 'Supply',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve: randomElement(ASSETS),
    user,
    onBehalfOf: Math.random() > 0.8 ? randomAddress() : user,
    amount: randomAmount(100, 100000),
    referralCode: 0,
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: new Date().toISOString(),
  };
}

function generateBorrowEvent(): AaveEvent {
  const user = randomAddress();
  return {
    eventType: 'Borrow',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve: randomElement(ASSETS),
    user,
    onBehalfOf: Math.random() > 0.9 ? randomAddress() : user,
    amount: randomAmount(50, 50000),
    interestRateMode: Math.random() > 0.7 ? 1 : 2, // 1=Stable, 2=Variable
    borrowRate: (Math.random() * 10 + 1).toFixed(4) + '%',
    referralCode: 0,
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: new Date().toISOString(),
  };
}

function generateWithdrawEvent(): AaveEvent {
  const user = randomAddress();
  return {
    eventType: 'Withdraw',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve: randomElement(ASSETS),
    user,
    to: Math.random() > 0.8 ? randomAddress() : user,
    amount: randomAmount(100, 50000),
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: new Date().toISOString(),
  };
}

function generateRepayEvent(): AaveEvent {
  const user = randomAddress();
  return {
    eventType: 'Repay',
    protocol: 'aave-v3',
    network: 'ethereum',
    reserve: randomElement(ASSETS),
    user,
    repayer: Math.random() > 0.9 ? randomAddress() : user,
    amount: randomAmount(50, 30000),
    useATokens: Math.random() > 0.8,
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: new Date().toISOString(),
  };
}

function generateLiquidationEvent(): AaveEvent {
  return {
    eventType: 'LiquidationCall',
    protocol: 'aave-v3',
    network: 'ethereum',
    collateralAsset: randomElement(ASSETS),
    debtAsset: randomElement(ASSETS),
    user: randomAddress(),
    liquidator: randomAddress(),
    debtToCover: randomAmount(1000, 50000),
    liquidatedCollateralAmount: randomAmount(1100, 55000),
    reserve: randomElement(ASSETS), // For consistency
    amount: randomAmount(1000, 50000), // Debt amount
    txHash: generateTxHash(),
    blockNumber: getNextBlock(),
    timestamp: new Date().toISOString(),
  };
}

// Generate random event
function generateRandomEvent(): AaveEvent {
  const eventGenerators = [
    { weight: 35, generator: generateSupplyEvent },
    { weight: 30, generator: generateBorrowEvent },
    { weight: 20, generator: generateWithdrawEvent },
    { weight: 12, generator: generateRepayEvent },
    { weight: 3, generator: generateLiquidationEvent },
  ];

  const totalWeight = eventGenerators.reduce((sum, { weight }) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const { weight, generator } of eventGenerators) {
    random -= weight;
    if (random <= 0) {
      return generator();
    }
  }

  return generateSupplyEvent();
}

// Main function
async function main() {
  console.log('🚀 Aave Event Generator for Arkiv\n');

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
  console.log('📊 Starting event generation...\n');

  let eventCount = 0;
  const maxEvents = process.argv[2] ? parseInt(process.argv[2]) : 50;
  const delayMs = process.argv[3] ? parseInt(process.argv[3]) : 3000;

  console.log(`Will generate ${maxEvents} events with ${delayMs}ms delay between each\n`);

  for (let i = 0; i < maxEvents; i++) {
    try {
      const event = generateRandomEvent();

      // Create attributes array from event object
      const attributes = Object.entries(event)
        .filter(([key]) => key !== 'timestamp') // We'll add timestamp separately
        .map(([key, value]) => ({
          key,
          value: value?.toString() || '',
        }));

      // Add timestamp as attribute
      attributes.push({ key: 'timestamp', value: event.timestamp });

      // Create entity payload
      const payload = JSON.stringify(event, null, 2);

      // Push to Arkiv
      const { entityKey, txHash } = await walletClient.createEntity({
        payload: stringToPayload(payload),
        contentType: 'application/json',
        attributes,
        expiresIn: 10000, // Expire after 10000 blocks (~2 days on Ethereum)
      });

      eventCount++;

      // Log event
      console.log(
        `✅ Event #${eventCount}: ${event.eventType} | ${event.reserve} | ${event.amount}`
      );
      console.log(`   User: ${event.user}`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   Entity Key: ${entityKey.slice(0, 20)}...`);
      console.log(`   Tx Hash: ${txHash.slice(0, 20)}...\n`);

      // Wait before next event
      if (i < maxEvents - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`❌ Error generating event #${i + 1}:`, error);
      // Continue with next event
    }
  }

  console.log(`\n🎉 Generation complete! Pushed ${eventCount} events to Arkiv`);
  console.log('\n💡 Next steps:');
  console.log('   - Query events using the TypeScript SDK');
  console.log('   - Build a Next.js dashboard to visualize the data');
  console.log('   - Filter events by type, asset, user, etc.');
}

main().catch(console.error);
