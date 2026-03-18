import { AIMessage, ConversationContext, CascadeStep, AgentAction } from "@/types";
import { getModelById } from "./ai-models";

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamChatCompletion(
  messages: AIMessage[],
  modelId: string,
  context: ConversationContext | undefined,
  callbacks: StreamCallbacks
): Promise<void> {
  const model = getModelById(modelId);
  if (!model) {
    callbacks.onError(new Error(`Unknown model: ${modelId}`));
    return;
  }

  const systemPrompt = buildSystemPrompt(context);
  const formattedMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        provider: model.provider,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.token || parsed.content || "";
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function generateCascadePlan(
  prompt: string,
  context: ConversationContext | undefined,
  modelId: string
): Promise<CascadeStep[]> {
  const response = await fetch("/api/cascade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      context,
      modelId,
      action: "plan",
    }),
  });

  if (!response.ok) throw new Error(`Cascade plan error: ${response.status}`);
  const data = await response.json();
  return data.steps;
}

export async function executeCascadeStep(
  step: CascadeStep,
  context: ConversationContext | undefined,
  modelId: string
): Promise<{ result: string; diff?: unknown }> {
  const response = await fetch("/api/cascade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step,
      context,
      modelId,
      action: "execute",
    }),
  });

  if (!response.ok) throw new Error(`Cascade execute error: ${response.status}`);
  return response.json();
}

export async function executeAgentAction(
  action: AgentAction,
  context: ConversationContext | undefined,
  modelId: string
): Promise<{ result: string; diff?: unknown }> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      context,
      modelId,
    }),
  });

  if (!response.ok) throw new Error(`Agent action error: ${response.status}`);
  return response.json();
}

export async function getInlineCompletion(
  code: string,
  cursorLine: number,
  cursorColumn: number,
  filePath: string,
  language: string,
  modelId: string
): Promise<string> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      provider: getModelById(modelId)?.provider || "openai",
      messages: [
        {
          role: "system",
          content: `You are a code completion engine. Given the code context, provide a natural continuation. Only output the completion text, nothing else. Language: ${language}`,
        },
        {
          role: "user",
          content: buildCompletionPrompt(code, cursorLine, cursorColumn, filePath),
        },
      ],
      stream: false,
      maxTokens: 150,
    }),
  });

  if (!response.ok) return "";
  const data = await response.json();
  return data.content || "";
}

export async function getSmartTabPrediction(
  openFiles: { path: string; content: string }[],
  currentFile: string,
  recentEdits: { path: string; line: number; content: string }[],
  modelId: string
): Promise<{ filePath: string; line: number; oldText: string; newText: string; reason: string } | null> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      provider: getModelById(modelId)?.provider || "openai",
      messages: [
        {
          role: "system",
          content: `You are a predictive edit engine. Based on the user's recent edits, predict the next edit they'll want to make across their open files. Respond ONLY with JSON: {"filePath": "...", "line": N, "oldText": "...", "newText": "...", "reason": "..."}. If no prediction, respond with null.`,
        },
        {
          role: "user",
          content: `Current file: ${currentFile}\n\nOpen files:\n${openFiles
            .map((f) => `--- ${f.path} ---\n${f.content}`)
            .join("\n\n")}\n\nRecent edits:\n${recentEdits
            .map((e) => `${e.path}:${e.line} -> ${e.content}`)
            .join("\n")}`,
        },
      ],
      stream: false,
      maxTokens: 200,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  try {
    const parsed = JSON.parse(data.content);
    return parsed;
  } catch {
    return null;
  }
}

function buildSystemPrompt(context?: ConversationContext): string {
  let prompt = `You are Cascade, an advanced AI coding assistant integrated into CascadeEditor. You help with code understanding, generation, debugging, refactoring, and architecture.

Key behaviors:
- Provide clear, well-structured code with proper types
- Reference specific files and line numbers when relevant
- Suggest improvements proactively when you see issues
- Use the project context to give informed answers
- Be concise but thorough`;

  if (context) {
    prompt += "\n\nCurrent context:";
    if (context.activeFile) prompt += `\nActive file: ${context.activeFile}`;
    if (context.openFiles?.length) prompt += `\nOpen files: ${context.openFiles.join(", ")}`;
    if (context.gitBranch) prompt += `\nGit branch: ${context.gitBranch}`;
    if (context.selectedCode) prompt += `\nSelected code:\n\`\`\`\n${context.selectedCode}\n\`\`\``;
    if (context.projectStructure) prompt += `\nProject structure:\n${context.projectStructure}`;
    if (context.terminalOutput) prompt += `\nRecent terminal output:\n${context.terminalOutput}`;
  }

  return prompt;
}

function buildCompletionPrompt(
  code: string,
  cursorLine: number,
  cursorColumn: number,
  filePath: string
): string {
  const lines = code.split("\n");
  const contextStart = Math.max(0, cursorLine - 20);
  const beforeCursor = lines.slice(contextStart, cursorLine).join("\n");
  const currentLine = lines[cursorLine] || "";
  const lineBeforeCursor = currentLine.slice(0, cursorColumn);
  const afterCursor = lines.slice(cursorLine + 1, cursorLine + 10).join("\n");

  return `File: ${filePath}
Code before cursor:
${beforeCursor}
${lineBeforeCursor}<CURSOR>
Code after cursor:
${afterCursor}

Complete the code at <CURSOR>:`;
}
