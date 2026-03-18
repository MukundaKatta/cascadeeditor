import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { model, provider, messages, stream, maxTokens } = body;

  try {
    if (provider === "openai") {
      return await handleOpenAI(model, messages, stream, maxTokens);
    } else if (provider === "anthropic") {
      return await handleAnthropic(model, messages, stream, maxTokens);
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleOpenAI(
  model: string,
  messages: { role: string; content: string }[],
  stream: boolean,
  maxTokens?: number
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-openai-key") {
    return generateMockResponse(messages, stream);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      max_tokens: maxTokens || 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenAI API error");
  }

  if (stream) {
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const data = await response.json();
  return NextResponse.json({
    content: data.choices[0]?.message?.content || "",
    tokens: {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0,
    },
  });
}

async function handleAnthropic(
  model: string,
  messages: { role: string; content: string }[],
  stream: boolean,
  maxTokens?: number
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-key") {
    return generateMockResponse(messages, stream);
  }

  const systemMessage = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMessage?.content || "",
      messages: chatMessages,
      max_tokens: maxTokens || 2048,
      stream,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Anthropic API error");
  }

  if (stream) {
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "content_block_delta") {
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ token: data.delta?.text || "" })}\n\n`
                  )
                );
              }
            } catch {
              // skip
            }
          }
        }
      },
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const data = await response.json();
  return NextResponse.json({
    content: data.content?.[0]?.text || "",
    tokens: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0,
    },
  });
}

function generateMockResponse(
  messages: { role: string; content: string }[],
  stream: boolean
) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  const mockResponses: Record<string, string> = {
    default: `I understand you want help with: "${lastUserMsg.slice(0, 80)}..."

Here's my analysis:

\`\`\`typescript
// Example implementation based on your request
export function solution() {
  // Implementation would go here based on your specific needs
  console.log("Cascade is ready to help!");
}
\`\`\`

I can help you implement this step by step. Would you like me to:
1. Break this down into a Cascade Flow with multiple steps
2. Generate the code directly
3. Explain the approach in more detail`,
  };

  const responseText = mockResponses.default;

  if (stream) {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        const words = responseText.split(" ");
        for (let i = 0; i < words.length; i++) {
          const token = (i === 0 ? "" : " ") + words[i];
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
          );
          await new Promise((r) => setTimeout(r, 30));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  return NextResponse.json({ content: responseText });
}
