const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: { name: string; response: Record<string, unknown>; id?: string };
  thoughtSignature?: string;
  [key: string]: unknown;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
}

interface GenerateArgs {
  contents: GeminiContent[];
  tools?: { functionDeclarations: GeminiFunctionDeclaration[] }[];
  systemInstruction?: string;
  temperature?: number;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { code?: number; message?: string; status?: string };
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Models are tried in order. A retired model (404) or an overloaded one (503)
 * falls through to the next; a genuine request error stops the chain.
 */
function modelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
  const fallbacks = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"];
  return [primary, ...fallbacks].filter((model, index, all) => all.indexOf(model) === index);
}

async function callModel(model: string, args: GenerateArgs) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("Gemini is not configured.");

  const response = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": key },
    body: JSON.stringify({
      contents: args.contents,
      ...(args.systemInstruction
        ? { systemInstruction: { parts: [{ text: args.systemInstruction }] } }
        : {}),
      ...(args.tools ? { tools: args.tools } : {}),
      generationConfig: { temperature: args.temperature ?? 0.2 },
    }),
  });

  const json = (await response.json().catch(() => null)) as GeminiResponse | null;
  return { status: response.status, json };
}

/**
 * Calls Gemini and returns the first candidate. Retries on transient model
 * problems (retired/overloaded) using the fallback chain.
 */
export async function generateContent(args: GenerateArgs): Promise<GeminiCandidate> {
  let lastError = "no response";
  for (const model of modelChain()) {
    let status: number;
    let json: GeminiResponse | null;
    try {
      ({ status, json } = await callModel(model, args));
    } catch (error) {
      lastError = error instanceof Error ? error.message : "network error";
      continue;
    }

    const candidate = json?.candidates?.[0];
    if (status === 200 && candidate?.content) return candidate;

    lastError = json?.error?.message ?? `HTTP ${status}`;
    if (status !== 404 && status !== 503) break;
  }
  throw new Error(`Gemini request failed: ${lastError}`);
}
