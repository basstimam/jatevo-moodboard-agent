# Testing Scripts for Market Moodboard Agent

Scripts untuk testing Market Moodboard Agent dengan x402 payment integration.

## 📋 Available Scripts

### 1. Test Agent (No Payment)

Test basic agent functionality tanpa melakukan payment. Berguna untuk:
- Verifikasi agent running
- Check payment mandate structure  
- Validate pricing configuration

```bash
bun run test:agent
```

**Expected Output:**
```
✅ Agent manifest retrieved
✅ Received expected 402 Payment Required
💰 Payment Mandate: 10000 base units (0.01 USDC)
```

### 2. Pay and Call (With Payment)

Complete x402 payment flow untuk melakukan paid request ke agent.

```bash
bun run pay
```

**Requirements:**
- `PRIVATE_KEY` set in `.env`
- Wallet must have USDC balance on Base mainnet (minimum 0.01 USDC)
- Agent must be running (`bun run dev` in another terminal)

**Expected Output:**
```
✅ Payment signed
✅ Request successful!
📊 Market Moodboard Analysis
🪙 Top 10 Coins Analysis
💵 Payment: 0.01 USDC processed on Base network
```

## 🔧 Configuration

### Environment Variables

Set di `.env` file:

```bash
# Required for paid requests
PRIVATE_KEY=0x...

# Optional customization
API_BASE_URL=http://localhost:8787  # or deployed URL
LIMIT=10                             # number of coins to analyze
VS_CURRENCY=usd                      # price currency
```

### For Local Testing

1. Start agent in one terminal:
```bash
bun run dev
```

2. Run test in another terminal:
```bash
# Simple test (no payment)
bun run test:agent

# Or paid test (requires PRIVATE_KEY and USDC)
bun run pay
```

### For Mainnet Testing

1. Deploy agent or use deployed URL
2. Set environment variables:
```bash
export API_BASE_URL=https://your-agent-url.com
export PRIVATE_KEY=0x...
```

3. Run paid test:
```bash
bun run pay
```

## 💰 Payment Details

**Network:** Base (L2)
**Asset:** USDC
**Price per request:** 0.01 USDC (set via `DEFAULT_PRICE_USDC` in .env)

### USDC Balance Requirements

Ensure wallet has sufficient USDC on Base:
- Minimum: 0.01 USDC per request
- Recommended: 0.1 USDC for multiple tests
- Plus small amount of ETH for gas fees

### Getting USDC on Base

1. Bridge USDC to Base: https://bridge.base.org
2. Buy on Base DEX (Uniswap, etc.)
3. Use faucet for Base testnet (if testing on sepolia)

## 🧪 Example Usage

### Custom Parameters

```bash
# Analyze only top 5 coins
LIMIT=5 bun run pay

# Use different currency
VS_CURRENCY=eur bun run pay

# Test different endpoint
API_BASE_URL=https://moodboard.agent.com bun run test:agent
```

### Output Analysis

The script displays:
- **Payment confirmation** with signature
- **Market sentiment** summary
- **Per-coin analysis:**
  - Symbol (BTC, ETH, SOL, etc.)
  - Mood emoji (🚀 📈 😐 📉 🔴)
  - Narrative (2-4 words)
  - Confidence score (0-1)
  - 24h price change
  - Market cap rank

## 🐛 Troubleshooting

### "PRIVATE_KEY environment variable is required"

Solution:
```bash
# Add to .env
PRIVATE_KEY=0x...

# Or run inline
PRIVATE_KEY=0x... bun run pay
```

### "Expected 402 Payment Required, got 500"

Check:
- Agent is running (`bun run dev`)
- `JATEVO_API_KEY` is set in agent `.env`
- No errors in agent console logs

### "Request failed with status 402" (after payment)

Check:
- Private key is correct
- Wallet has USDC balance on Base
- Facilitator URL is reachable
- Network is set to `base` (not `base-sepolia`)

### "Cannot read property 'maxAmountRequired' of undefined"

Agent payment configuration issue. Verify in `.env`:
```bash
NETWORK=base
DEFAULT_PRICE_USDC=0.01
PAY_TO=0x...
FACILITATOR_URL=https://facilitator.daydreams.systems
```

## 📚 References

- [x402 Protocol](https://github.com/basstimam/gasroute-oracle)
- [Agent Kit Docs](https://github.com/lucid-dreams-ai/agent-kit)
- [Base Network](https://base.org)
- [Viem Documentation](https://viem.sh)

## 🔐 Security Notes

- Never commit `.env` with real private keys
- Use testnet for development
- Keep production private keys secure
- Monitor wallet balance and transactions
- Test with small amounts first
