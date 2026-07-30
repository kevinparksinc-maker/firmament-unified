import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";
export type TextContent = { type: "text"; text: string };
export type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
export type FileContent = {
  type: "file_url";
  file_url: { url: string; mime_type?: string };
};
export type MessageContent = string | TextContent | ImageContent | FileContent;
export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};
export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};
export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};
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
};
export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey)
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
};
const ensureArray = (c: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(c) ? c : [c];
const toText = (part: MessageContent): string => {
  if (typeof part === "string") return part;
  if (part.type === "text") return part.text;
  return "";
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  const { messages } = params;

  const systemParts = messages
    .filter(m => m.role === "system")
    .map(m => ensureArray(m.content).map(toText).join(""))
    .join("\n\n");

  const anthropicMessages = messages
    .filter(m => m.role !== "system")
    .map(m => {
      const parts = ensureArray(m.content);
      const content = parts
        .map(part => {
          if (typeof part === "string") return { type: "text", text: part };
          if (part.type === "text") return { type: "text", text: part.text };
          if (part.type === "image_url") {
            const url = part.image_url.url;
            if (url.startsWith("data:")) {
              const [meta, data] = url.split(",");
              const mediaType = meta.split(":")[1].split(";")[0];
              return {
                type: "image",
                source: { type: "base64", media_type: mediaType, data },
              };
            }
            return { type: "image", source: { type: "url", url } };
          }
          return { type: "text", text: "" };
        })
        .filter((p: any) => p.type !== "text" || p.text.length > 0);
      const finalContent =
        content.length === 1 && content[0].type === "text"
          ? (content[0] as any).text
          : content;
      return { role: m.role as "user" | "assistant", content: finalContent };
    });

  const payload: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: anthropicMessages,
  };
  if (systemParts) payload.system = systemParts;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.forgeApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      "Anthropic API error: " +
        response.status +
        " " +
        response.statusText +
        " - " +
        errorText
    );
  }

  const raw = (await response.json()) as any;
  const textContent = raw.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text ?? "")
    .join("");

  return {
    id: raw.id,
    created: Math.floor(Date.now() / 1000),
    model: raw.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: textContent },
        finish_reason: raw.stop_reason ?? null,
      },
    ],
    usage: raw.usage
      ? {
          prompt_tokens: raw.usage.input_tokens,
          completion_tokens: raw.usage.output_tokens,
          total_tokens: raw.usage.input_tokens + raw.usage.output_tokens,
        }
      : undefined,
  };
}
