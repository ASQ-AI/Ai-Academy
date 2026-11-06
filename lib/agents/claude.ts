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

/**
 * An Anthropic API failure carrying a safe Arabic explanation for the UI.
 * fail() in lib/academy.ts shows userMessage instead of the generic error,
 * so a misconfigured key or an empty balance is visible immediately rather
 * than hiding behind "تعذر إكمال الطلب الآن".
 */
export class ClaudeApiError extends Error {
  userMessage: string;
  constructor(message: string, userMessage: string) {
    super(message);
    this.name = "ClaudeApiError";
    this.userMessage = userMessage;
  }
}

function explainStatus(status: number, body: string): string {
  const b = body.toLowerCase();
  if (status === 401)
    return "مفتاح Anthropic API غير صالح. تحقق من قيمة ANTHROPIC_API_KEY في إعدادات Vercel ثم أعد النشر.";
  if (b.includes("credit") || b.includes("billing") || b.includes("balance"))
    return "رصيد حساب Anthropic API غير كافٍ. أضف رصيدًا من console.anthropic.com ثم أعد المحاولة.";
  if (status === 403)
    return "مفتاح Anthropic API لا يملك صلاحية استخدام هذا النموذج.";
  if (status === 404 || b.includes("model"))
    return "نموذج الذكاء الاصطناعي المحدد غير متاح لهذا الحساب.";
  if (status === 429)
    return "تم تجاوز حد الطلبات أو حد الإنفاق في حساب Anthropic. انتظر قليلًا ثم أعد المحاولة.";
  if (status === 529 || status >= 500)
    return "خدمة Claude مشغولة حاليًا. أعد المحاولة بعد دقيقة.";
  return "تعذر الاتصال بخدمة الذكاء الاصطناعي الآن.";
}

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
  if (!apiKey)
    throw new ClaudeApiError(
      "ANTHROPIC_API_KEY is not set",
      "مفتاح ANTHROPIC_API_KEY غير مضاف في إعدادات Vercel (Environment Variables). أضفه ثم أعد النشر.",
    );

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
    throw new ClaudeApiError(
      `Anthropic API error ${response.status}: ${text.slice(0, 500)}`,
      explainStatus(response.status, text),
    );
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const block = (data.content || []).find(
    (c) => c.type === "text" && typeof c.text === "string",
  );
  if (!block?.text) throw new Error("Anthropic API returned no text content");

  return block.text;
}

/**
 * Parses a Claude reply as JSON. Tolerates a ```json fence and any stray
 * text before/after the object (e.g. a short preamble), by falling back to
 * the outermost {...} or [...] span. Throws a plain Error if nothing parses —
 * callers rely on their route's outer try/catch + fail().
 */
export function parseClaudeJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[{[]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error(`Claude reply was not valid JSON: ${cleaned.slice(0, 200)}`);
  }
}
