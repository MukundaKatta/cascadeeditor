import { NextRequest, NextResponse } from "next/server";
import { AgentAction } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, context, modelId } = body as {
    action: AgentAction;
    context: unknown;
    modelId: string;
  };

  try {
    const result = await executeAgentAction(action, context, modelId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function executeAgentAction(
  action: AgentAction,
  context: unknown,
  modelId: string
): Promise<{ result: string; diff?: unknown }> {
  // Simulate realistic execution
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));

  switch (action.type) {
    case "create_file": {
      const filePath = action.params.path as string || "new-file.ts";
      const content = action.params.content as string || "// New file\n";
      return {
        result: `Created file: ${filePath}`,
        diff: {
          filePath,
          status: "created",
          hunks: [
            {
              id: "h1",
              oldStart: 0,
              oldLines: 0,
              newStart: 1,
              newLines: content.split("\n").length,
              changes: content.split("\n").map((line, i) => ({
                type: "add",
                content: line,
                newLineNumber: i + 1,
              })),
              status: "pending",
            },
          ],
        },
      };
    }

    case "modify_file": {
      const filePath = action.params.path as string || "";
      return {
        result: `Modified file: ${filePath}`,
        diff: {
          filePath,
          status: "modified",
          hunks: [
            {
              id: "h1",
              oldStart: 1,
              oldLines: 3,
              newStart: 1,
              newLines: 5,
              changes: [
                { type: "context", content: "// existing code", oldLineNumber: 1, newLineNumber: 1 },
                { type: "remove", content: "const old = true;", oldLineNumber: 2 },
                { type: "add", content: "const updated = true;", newLineNumber: 2 },
                { type: "add", content: "const enhanced = true;", newLineNumber: 3 },
                { type: "context", content: "// more code", oldLineNumber: 3, newLineNumber: 4 },
              ],
              status: "pending",
            },
          ],
        },
      };
    }

    case "delete_file": {
      const filePath = action.params.path as string || "";
      return {
        result: `Deleted file: ${filePath}`,
      };
    }

    case "run_command": {
      const command = action.params.command as string || "";
      const mockOutputs: Record<string, string> = {
        "npm install": "added 142 packages in 3.2s",
        "npm test": "Tests: 12 passed, 12 total\nTime: 2.4s",
        "npm run build": "Build completed successfully",
        "npm run lint": "No lint errors found",
        "git status": "On branch main\nnothing to commit, working tree clean",
      };
      return {
        result: mockOutputs[command] || `Command executed: ${command}\nExit code: 0`,
      };
    }

    case "search_codebase": {
      const query = action.params.query as string || "";
      return {
        result: `Search results for "${query}":\n- src/index.ts:5 (match)\n- src/routes.ts:12 (match)\n- src/controllers/users.ts:28 (match)`,
      };
    }

    case "read_file": {
      const filePath = action.params.path as string || "";
      return {
        result: `Read file: ${filePath}\nContent loaded (${Math.floor(Math.random() * 100 + 20)} lines)`,
      };
    }

    case "install_package": {
      const pkg = action.params.package as string || "";
      return {
        result: `Installed package: ${pkg}\nadded 1 package in 1.2s`,
      };
    }

    case "git_operation": {
      const op = action.params.operation as string || "";
      return {
        result: `Git operation "${op}" completed successfully`,
      };
    }

    default:
      return { result: `Action "${action.type}" completed` };
  }
}
