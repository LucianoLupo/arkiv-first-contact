# Arkiv First Contact - Hello World

A simple "Hello World" example for getting started with Arkiv Network using TypeScript.

## Prerequisites

- Node.js 18+ (LTS recommended)
- An Arkiv testnet wallet with funds

## Setup

1. **Get testnet funds**
   - Visit the faucet: https://mendoza.hoodi.arkiv.network/faucet/
   - Request testnet tokens for your wallet address

2. **Configure environment**
   - Open `.env` file
   - Replace the `PRIVATE_KEY` with your actual testnet private key
   - ⚠️ **WARNING**: Only use testnet keys! Never use mainnet keys!

3. **Install dependencies** (already done)
   ```bash
   npm install
   ```

## Run the Example

```bash
npm start
```

Or run in watch mode:

```bash
npm run dev
```

## What This Example Does

1. Connects to Arkiv Mendoza Testnet
2. Creates a "Hello World" entity with metadata
3. Stores it on the Arkiv blockchain
4. Queries for the entity we just created
5. Displays the results

## Useful Links

- **Testnet RPC**: https://mendoza.hoodi.arkiv.network/rpc
- **Faucet**: https://mendoza.hoodi.arkiv.network/faucet/
- **Explorer**: https://explorer.mendoza.hoodi.arkiv.network/
- **Documentation**: https://arkiv.network/getting-started/typescript

## Next Steps

- Experiment with creating different types of entities
- Try querying entities with different filters
- Explore entity subscriptions with `subscribeEntityEvents()`
- Build relationships between entities
- Create a more complex application

## Troubleshooting

If you get a "PRIVATE_KEY not set" error:

1. Make sure you've edited the `.env` file
2. Replace the placeholder private key with your actual testnet key
3. Ensure the key starts with `0x`

If you don't have testnet funds:

- Visit https://mendoza.hoodi.arkiv.network/faucet/
- Enter your wallet address
- Request tokens
