/**
 * Jatevo API Client for AI model inference
 */

export interface JatevoMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface JatevoRequest {
  model: string;
  messages: JatevoMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stream_options?: {
    include_usage?: boolean;
    continuous_usage_stats?: boolean;
  };
  stop?: string[];
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: {
    type: "json_object";
  };
}

export interface JatevoResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index?: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  id?: string;
  created?: number;
  model?: string;
}

export interface JatevoErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}

/**
 * Call Jatevo AI model
 * @param prompt - User prompt to send to the model
 * @param apiKey - Jatevo API key
 * @param modelName - Model name (e.g., deepseek-ai/DeepSeek-R1-0528)
 * @param apiEndpoint - API endpoint URL
 * @returns Model response content
 */
export async function callGLM46(
  prompt: string,
  apiKey: string,
  modelName: string,
  apiEndpoint: string = "https://inference.jatevo.id/v1/chat/completions",
): Promise<string> {
  if (!apiKey) {
    throw new Error("JATEVO_API_KEY is required");
  }

  const requestBody: JatevoRequest = {
    model: modelName,
    messages: [
      {
        role: "system",
        content:
          "You are a JSON-only API. Your response must be valid JSON only. No markdown code blocks, no explanations, no text before or after. Return ONLY the JSON object.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stop: [],
    stream: false,
    // Note: response_format may not be supported by zai-glm-4.6, relying on prompt instead
    top_p: 1,
    max_tokens: 2000,
    temperature: 0.2,  // Lower temperature for more consistent JSON
    presence_penalty: 0,
    frequency_penalty: 0,
  };

  try {
    console.log(`[Jatevo] Calling ${modelName} at ${apiEndpoint}...`);
    console.log(`[Jatevo] Request body size: ${JSON.stringify(requestBody).length} chars`);
    const requestStartTime = Date.now();

    // Add timeout (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const requestDuration = Date.now() - requestStartTime;
    console.log(`[Jatevo] Response received in ${requestDuration}ms (Status: ${response.status})`);

    const responseText = await response.text();
    console.log(`[Jatevo] Response text length: ${responseText.length} chars`);
    console.log(`[Jatevo] Response preview (first 500 chars):`, responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Jatevo] Failed to parse response as JSON`);
      console.error(`[Jatevo] Full response text:`, responseText);
      throw new Error(`Failed to parse Jatevo API response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
    }

    // Check for error response
    if (!response.ok || "error" in data) {
      const errorData = data as JatevoErrorResponse;
      throw new Error(
        `Jatevo API error: ${errorData.error.message} (Code: ${errorData.error.code}, Type: ${errorData.error.type})`,
      );
    }

    const responseData = data as JatevoResponse;

    if (!responseData.choices || responseData.choices.length === 0) {
      throw new Error(`No response from ${modelName} model`);
    }

    // Extract content from response structure (as per jatevo-api.mdc format)
    // Response format: { choices: [{ message: { content: "..." } }] }
    const content = responseData.choices[0].message.content;
    console.log(`[Jatevo] Extracted content from choices[0].message.content`);
    console.log(`[Jatevo] Content length: ${content.length} chars`);
    console.log(`[Jatevo] Full content (raw response):`);
    console.log("━".repeat(60));
    console.log(content);
    console.log("━".repeat(60));

    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to call ${modelName}: ${error.message}`);
    }
    throw new Error(`Failed to call ${modelName}: Unknown error`);
  }
}
