import 'dotenv/config';
import { createPublicClient, createWalletClient, http } from '@arkiv-network/sdk';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { mendoza } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';

// Helper function to convert string to payload
function stringToPayload(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function main() {
  console.log('🚀 Arkiv Hello World Demo\n');

  // Check if private key is set
  if (
    !process.env.PRIVATE_KEY ||
    process.env.PRIVATE_KEY === '0x0000000000000000000000000000000000000000000000000000000000000000'
  ) {
    console.error('❌ Error: Please set your PRIVATE_KEY in the .env file');
    console.log('💡 Get testnet funds from: https://mendoza.hoodi.arkiv.network/faucet/');
    process.exit(1);
  }

  // Initialize the public client (for reading data)
  const publicClient = createPublicClient({
    chain: mendoza,
    transport: http(process.env.RPC_URL),
  });

  // Initialize the wallet client (for writing data)
  const walletClient = createWalletClient({
    chain: mendoza,
    transport: http(process.env.RPC_URL),
    account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  });

  console.log('✅ Connected to Arkiv Mendoza Testnet');
  console.log(`📍 Account: ${walletClient.account?.address}\n`);

  try {
    // Create a simple "Hello World" entity on Arkiv
    console.log('📝 Creating "Hello World" entity...');
    const { entityKey, txHash } = await walletClient.createEntity({
      payload: stringToPayload('Hello World from Arkiv!'),
      contentType: 'text/plain',
      attributes: [
        { key: 'type', value: 'greeting' },
        { key: 'message', value: 'hello-world' },
        { key: 'timestamp', value: new Date().toISOString() },
      ],
      expiresIn: 1000, // Entity will expire in 1000 blocks
    });

    console.log('✅ Entity created successfully!');
    console.log(`   Entity Key: ${entityKey}`);
    console.log(`   Transaction Hash: ${txHash}`);
    console.log(`   Explorer: https://explorer.mendoza.hoodi.arkiv.network/tx/${txHash}\n`);

    // Wait a moment for the transaction to be processed
    console.log('⏳ Waiting for transaction to be processed...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Query the entity we just created
    console.log('🔍 Querying for greeting entities...');
    const result = await publicClient
      .buildQuery()
      .where(eq('type', 'greeting'))
      .withAttributes(true)
      .withPayload(true)
      .fetch();

    console.log(`✅ Found ${result.entities.length} greeting entity(ies)`);

    if (result.entities.length > 0) {
      const entity = result.entities[0];
      console.log('\n📋 Entity Details:');
      console.log(`   Key: ${entity.key}`);
      console.log(`   Content: ${new TextDecoder().decode(entity.payload)}`);
      console.log(`   Attributes:`);
      entity.attributes.forEach((attr) => {
        console.log(`      ${attr.key}: ${attr.value}`);
      });
    }

    console.log('\n🎉 Hello World demo completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Explore entity subscriptions with subscribeEntityEvents()');
    console.log('   - Try creating relationships between entities');
    console.log('   - Build a more complex application with queries');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
