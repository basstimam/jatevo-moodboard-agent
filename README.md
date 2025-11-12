# Market Moodboard Agent

AI-powered crypto market mood analysis with x402 payment integration.

## Overview

Analyzes top 10 cryptocurrencies by market cap and provides:
- Market sentiment analysis
- Mood indicators (🚀 📈 😐 📉 🔴)
- Brief narratives
- Confidence scores

**Price:** 0.01 USDC per request (paid via x402 protocol)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.1.0
- Jatevo API Key (get from [jatevo.ai](https://jatevo.ai))
- Private Key (hex format, for x402 payments)
- USDC on Base network (for payments)

### Installation

```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
```

### Configuration

Required environment variables in `.env`:

```bash
# Server
PORT=8787

# Secrets (REQUIRED)
JATEVO_API_KEY=your_jatevo_api_key
PRIVATE_KEY=0x...  # Your wallet private key in hex format

# Payment
PAY_TO=0x...  # Your wallet address to receive payments
NETWORK=base  # Payment network (base or base-sepolia)
DEFAULT_PRICE_USDC=0.01

# Optional
FACILITATOR_URL=https://facilitator.daydreams.systems
JATEVO_API_ENDPOINT=https://inference.jatevo.id/v1/chat/completions
JATEVO_MODEL=zai-glm-4.6
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
```

### Run

```bash
# Development mode
bun run dev

# Production
bun run start
```

## Usage

### Test Payment Flow

```bash
# Test with payment
bun run pay

# Check agent status
bun run check

# Test Jatevo API
bun run test:jatevo
```

### API Request

**Endpoint:** `POST /entrypoints/analyzeMoodboard/invoke`

**Request:**
```json
{
  "limit": 10,
  "vs_currency": "usd"
}
```

**Response:**
```json
{
  "output": {
    "date": "2025-11-12",
    "analyzed_at": "2025-11-12T12:34:56.789Z",
    "parsed_data": {
      "coins": [
        {
          "symbol": "BTC",
          "mood": "📉",
          "narrative": "bearish decline",
          "score": 0.65,
          "price_change_24h": -1.77,
          "market_cap_rank": 1
        }
      ],
      "market_sentiment": "Market showing correction"
    }
  },
  "model": "zai-glm-4.6"
}
```

## Docker

### Build & Run

```bash
# Build image
docker build -t moodboard-agent .

# Run container
docker run -d \
  --name moodboard \
  -p 8787:8787 \
  --env-file .env \
  moodboard-agent

# Check logs
docker logs -f moodboard
```

### Docker Environment

Pass environment variables via `.env` file or `-e` flags:

```bash
docker run -d \
  -p 8787:8787 \
  -e JATEVO_API_KEY=your_key \
  -e PRIVATE_KEY=0x... \
  -e PAY_TO=0x... \
  moodboard-agent
```

## Tech Stack

- **Runtime:** Bun
- **Framework:** @lucid-dreams/agent-kit
- **AI Model:** Jatevo AI (zai-glm-4.6)
- **Data Source:** CoinGecko API
- **Payment:** x402 Protocol
- **Blockchain:** Base (USDC)
- **Validation:** Zod

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run pay` | Test payment flow with real request |
| `bun run check` | Check agent health status |
| `bun run test:jatevo` | Test Jatevo API connection |
| `bun run test:jatevo:full` | Test Jatevo with full prompt |
| `bun run test:consistency` | Run 5x consistency test |

## x402 Payment Flow

1. Client makes request → receives `402 Payment Required`
2. Client signs payment with wallet
3. Client retries with `X-PAYMENT` header
4. Agent verifies payment via facilitator
5. Agent processes request (fetch CoinGecko + analyze with AI)
6. Agent settles payment on blockchain
7. Client receives analysis result

## Troubleshooting

### Agent won't start
- Check `.env` has `JATEVO_API_KEY` and `PRIVATE_KEY`
- Ensure port 8787 is not in use

### Payment fails (402 error)
- Verify private key is in hex format (`0x...`)
- Ensure sufficient USDC on Base network
- Check facilitator URL is correct

### No response / timeout
- Check Jatevo API key is valid
- Verify CoinGecko API is accessible
- Increase timeout in client

### Empty response from AI
- Test Jatevo API: `bun run test:jatevo`
- Check API key validity
- Try different model in `.env`

## License

MIT

## Links

- [Jatevo AI](https://jatevo.ai)
- [x402 Protocol](https://docs.payai.network/)
- [Agent Kit](https://github.com/lucid-dreams-ai/agent-kit)
- [CoinGecko API](https://www.coingecko.com/api)
