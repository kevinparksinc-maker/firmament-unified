import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";
export type TextContent = { type: "text"; text: string };
export type ImageContent = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
export type FileContent = { type: "file_url"; file_url: { url: string; mime_type?: string } };
export type MessageContent = string | TextContent | ImageContent | FileContent;
export type Message = { role: Role; content: MessageContent | MessageContent[]; name?: string; tool_call_id?: string };
export type Tool = { type: "function"; function: { name: string; description?: string; parameters?: Record<string, unknown> } };
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: unknown;
  tool_choice?: unknown;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: unknown;
  output_schema?: unknown;
  responseFormat?: unknown;
  response_format?: unknown;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};
export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{ index: number; message: { role: Role; content: string | Array<TextContent | ImageContent | FileContent>; tool_calls?: ToolCall[] }; finish_reason: string | null }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};
export type ModelInfo = { id: string; object: string; created: number; owned_by: string };
export type ModelsResponse = { object: string; data: ModelInfo[] };

const assertApiKey = () => {
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
};
const apiBase = () => (ENV.forgeApiUrl || "https://forge.manus.im").replace(/\/$/, "");
const asParts = (content: MessageContent | MessageContent[]) => Array.isArray(content) ? content : [content];
const normalizeContent = (content: MessageContent | MessageContent[]) => {
  const parts = asParts(content);
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return parts.map(part => typeof part === "string" ? { type: "text", text: part } : part);
};
const normalizeMessage = ({ role, content, name, tool_call_id }: Message) => ({
  role,
  content: normalizeContent(content),
  ...(name ? { name } : {}),
  ...(tool_call_id ? { tool_call_id } : {}),
});

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  const payload: Record<string, unknown> = {
    model: params.model ?? "claude-sonnet-4-6",
    messages: params.messages.map(normalizeMessage),
  };
  const maxTokens = params.max_tokens ?? params.maxTokens;
  if (typeof maxTokens === "number") payload.max_tokens = maxTokens;
  if (params.tools?.length) payload.tools = params.tools;
  if (params.toolChoice ?? params.tool_choice) payload.tool_choice = params.toolChoice ?? params.tool_choice;
  if (params.thinking) payload.thinking = params.thinking;
  if (params.reasoning) payload.reasoning = params.reasoning;
  if (params.responseFormat ?? params.response_format) payload.response_format = params.responseFormat ?? params.response_format;
  if (params.outputSchema ?? params.output_schema) {
    const schema = params.outputSchema ?? params.output_schema;
    payload.response_format = { type: "json_schema", json_schema: schema };
  }

  const response = await fetch(`${apiBase()}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${ENV.forgeApiKey}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${detail}`);
  }
  return (await response.json()) as InvokeResult;
}

export async function listLLMModels(): Promise<ModelsResponse> {
  assertApiKey();
  const response = await fetch(`${apiBase()}/v1/models`, { headers: { authorization: `Bearer ${ENV.forgeApiKey}` } });
  if (!response.ok) throw new Error(`List LLM models failed: ${response.status} ${response.statusText}`);
  return (await response.json()) as ModelsResponse;
}
