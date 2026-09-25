/**
 * Minimal, dependency-free client for Anthropic's Messages API. Raw fetch is
 * used on purpose instead of @anthropic-ai/sdk so this feature ships as
 * plain files the owner can hand-copy into GitHub, with no npm install step.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/** claude-sonnet-5 for quality-sensitive work (writing/reviewing/reasoning). */
export const SONNET = "claude-sonnet-5";
/** claude-haiku-4-5 for cheap, fast classification/routing calls. */
export const HAIKU = "claude-haiku-4-5-20251001";

export type CallClaudeOptions = {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
};

type AnthropicContentBlock = { type: string; text?: string };
type AnthropicMessageResponse = { content?: AnthropicContentBlock[] };

/**
 * Calls one Claude agent and returns its raw text reply. Throws on a
 * non-2xx response or a response with no text content — callers let this
 * bubble up to their route's try/catch, which maps it to fail().
 */
export async function callClaude({
  system,
  prompt,
  model = SONNET,
  maxTokens = 1024,
}: CallClaudeOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY غير مُعرَّف على الخادم");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const block = (data.content || []).find(
    (c) => c.type === "text" && typeof c.text === "string",
  );
  if (!block?.text) throw new Error("Anthropic API returned no text content");

  return block.text;
}

/**
 * Strips a possible ```json fence around a Claude reply and JSON.parses it.
 * Throws (a plain Error) on malformed JSON — callers rely on their route's
 * outer try/catch + fail() to turn that into a friendly Arabic message.
 */
export function parseClaudeJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
