#!/usr/bin/env bun
/**
 * Test Jatevo API directly
 */

const JATEVO_API_KEY = process.env.JATEVO_API_KEY;
const JATEVO_MODEL = process.env.JATEVO_MODEL || "deepseek-ai/DeepSeek-R1-0528";
const JATEVO_ENDPOINT = "https://inference.jatevo.id/v1/chat/completions";

if (!JATEVO_API_KEY) {
  console.error("❌ JATEVO_API_KEY not set in .env");
  process.exit(1);
}

console.log("🧪 Testing Jatevo API");
console.log("━".repeat(60));
console.log(`Endpoint: ${JATEVO_ENDPOINT}`);
console.log(`Model: ${JATEVO_MODEL}`);
console.log(`API Key: ${JATEVO_API_KEY.substring(0, 20)}...`);
console.log("");

const requestBody = {
  model: JATEVO_MODEL,
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant. Respond with valid JSON only.",
    },
    {
      role: "user",
      content: 'Return this JSON: {"test": "success", "number": 42}',
    },
  ],
  stop: [],
  stream: false,
  top_p: 1,
  max_tokens: 500,
  temperature: 0.5,
  presence_penalty: 0,
  frequency_penalty: 0,
};

console.log("📤 Sending request...");
console.log(`Request size: ${JSON.stringify(requestBody).length} bytes`);
console.log("");

const startTime = Date.now();

fetch(JATEVO_ENDPOINT, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${JATEVO_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
})
  .then(async (response) => {
    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log("");

    const responseText = await response.text();
    console.log(`Response size: ${responseText.length} bytes`);
    console.log(`Response text (first 1000 chars):`);
    console.log("━".repeat(60));
    console.log(responseText.substring(0, 1000));
    console.log("━".repeat(60));
    console.log("");

    try {
      const data = JSON.parse(responseText);

      if ("error" in data) {
        console.error("❌ API Error:");
        console.error(JSON.stringify(data.error, null, 2));
        process.exit(1);
      }

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        console.log("✅ Content extracted:");
        console.log(`Length: ${content.length} chars`);
        console.log("Content:");
        console.log("━".repeat(60));
        console.log(content);
        console.log("━".repeat(60));

        if (content.length === 0) {
          console.error("\n❌ WARNING: Content is empty!");
          console.error("This is why agent returns empty response.");
          process.exit(1);
        } else {
          console.log("\n✅ Test successful!");
        }
      } else {
        console.error("❌ No choices in response");
        console.error(JSON.stringify(data, null, 2));
        process.exit(1);
      }
    } catch (parseError) {
      console.error("❌ Failed to parse JSON response");
      console.error(parseError);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Request failed:");
    console.error(error);
    process.exit(1);
  });

