# Jatevo API Integration Guide

## 📋 API Overview

**Endpoint:** `https://inference.jatevo.id/v1/chat/completions`  
**Authentication:** Bearer Token (API Key format: `jatevo_*`)  
**Default Model:** `deepseek-ai/DeepSeek-R1-0528`

## 🔑 Authentication

API key format:
```
jatevo_[timestamp]_[random_string]
Example: jatevo_1762352882204_uv85rpn3v5q
```

Set in `.env`:
```bash
JATEVO_API_KEY=jatevo_1762352882204_uv85rpn3v5q
```

---

## 📤 Request Format

### Non-Streaming Request (Used in Agent)

```bash
curl --location 'https://inference.jatevo.id/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--data '{
  "model": "deepseek-ai/DeepSeek-R1-0528",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Analyze this data..."}
  ],
  "stop": [],
  "stream": false,
  "top_p": 1,
  "max_tokens": 1000,
  "temperature": 0.7,
  "presence_penalty": 0,
  "frequency_penalty": 0
}'
```

### Streaming Request (Optional)

```json
{
  "model": "deepseek-ai/DeepSeek-R1-0528",
  "messages": [...],
  "stream": true,
  "stream_options": {
    "include_usage": true,
    "continuous_usage_stats": true
  },
  "max_tokens": 1000,
  "temperature": 1
}
```

---

## 📥 Response Format

### Success Response (Non-Streaming)

```json
{
  "id": "chatcmpl-123",
  "created": 1677652288,
  "model": "deepseek-ai/DeepSeek-R1-0528",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"analysis\": \"market data...\"}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

### Error Response

```json
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

**Common Error Codes:**
- `invalid_api_key` - API key invalid atau expired
- `rate_limit_exceeded` - Terlalu banyak request
- `insufficient_quota` - Quota habis
- `invalid_request_error` - Request format salah

---

## 🎯 Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | Yes | - | Model name (e.g., `deepseek-ai/DeepSeek-R1-0528`) |
| `messages` | array | Yes | - | Array of message objects with `role` and `content` |
| `stream` | boolean | No | false | Enable streaming response |
| `max_tokens` | integer | No | - | Maximum tokens to generate |
| `temperature` | float | No | 1.0 | Sampling temperature (0-2) |
| `top_p` | float | No | 1.0 | Nucleus sampling parameter |
| `stop` | array | No | [] | Stop sequences |
| `presence_penalty` | float | No | 0 | Penalize new tokens based on presence (-2 to 2) |
| `frequency_penalty` | float | No | 0 | Penalize new tokens based on frequency (-2 to 2) |
| `stream_options` | object | No | - | Streaming configuration options |

---

## 💡 Best Practices for Market Moodboard Agent

### 1. Temperature Settings

```typescript
// For structured JSON output (recommended)
temperature: 0.7  // Balance between creativity and consistency

// For creative narrative
temperature: 1.0  // More creative mood descriptions

// For deterministic output
temperature: 0.1  // Most consistent results
```

### 2. System Prompt

```typescript
{
  role: "system",
  content: "You are a crypto market analyst. Analyze market data and return ONLY valid JSON with no additional text or markdown formatting."
}
```

**Key points:**
- Emphasize JSON-only output
- No markdown code blocks
- Structured format expected

### 3. Error Handling

```typescript
try {
  const response = await fetch(endpoint, {...});
  const data = await response.json();
  
  // Check for error response
  if ("error" in data) {
    throw new Error(`Jatevo API error: ${data.error.message}`);
  }
  
  return data.choices[0].message.content;
} catch (error) {
  // Handle network errors, parse errors, etc.
}
```

---

## 🔧 Configuration in Agent

### Environment Variables

```bash
# Jatevo API Configuration
JATEVO_API_KEY=jatevo_1762352882204_uv85rpn3v5q
JATEVO_API_ENDPOINT=https://inference.jatevo.id/v1/chat/completions
JATEVO_MODEL=deepseek-ai/DeepSeek-R1-0528
```

### Code Usage

```typescript
import { callGLM46 } from "./services/jatevoClient";
import { config } from "./config";

const response = await callGLM46(
  prompt,
  config.jatevoApiKey,
  config.jatevoModel,
  config.jatevoApiEndpoint
);
```

---

## 🧪 Testing

### Test API Connection

```bash
curl -X POST https://inference.jatevo.id/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "deepseek-ai/DeepSeek-R1-0528",
    "messages": [{"role": "user", "content": "Say hello"}],
    "stream": false,
    "max_tokens": 50
  }'
```

### Expected Response

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

## 📊 Rate Limits & Quotas

**Note:** Check with Jatevo for current limits

Typical limits:
- Requests per minute: Variable based on plan
- Max tokens per request: 4096 (model dependent)
- Concurrent requests: Limited

**Best Practice:**
- Implement retry with exponential backoff
- Cache results when possible
- Monitor usage via response headers

---

## 🔍 Troubleshooting

### Issue: "Incorrect API key provided"

**Solution:**
1. Verify API key format: `jatevo_*`
2. Check `.env` file has correct key
3. Ensure no extra spaces/newlines
4. Test key with curl command

### Issue: "JSON Parse error: Unterminated string"

**Cause:** Model returning markdown-wrapped JSON

**Solution:**
```typescript
// Clean markdown code blocks
const cleanedResponse = response
  .replace(/```json\n?/g, "")
  .replace(/```\n?/g, "")
  .trim();

const parsed = JSON.parse(cleanedResponse);
```

### Issue: Rate limit exceeded

**Solution:**
```typescript
// Implement retry with backoff
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  try {
    return await callAPI();
  } catch (error) {
    if (error.code === 'rate_limit_exceeded') {
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
      continue;
    }
    throw error;
  }
}
```

---

## 📚 References

- [Jatevo API Documentation](https://jatevo.ai/docs)
- [DeepSeek Model Documentation](https://www.deepseek.com/)
- [OpenAI-Compatible API Format](https://platform.openai.com/docs/api-reference)

---

**Last Updated:** 2025-11-12  
**API Version:** v1  
**Document Version:** 1.0.0

