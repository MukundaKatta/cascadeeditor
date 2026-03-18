"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useAI } from "@/hooks/useAI";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { AgentAction, CascadeStep } from "@/types";
import { generateId } from "@/lib/utils";
import { executeAgentAction } from "@/lib/ai-service";

export function AgentPanel() {
  const [input, setInput] = useState("");
  const {
    agentTasks,
    activeTaskId,
    createAgentTask,
    setAgentPlan,
    addAgentAction,
    updateAgentAction,
    updateAgentTask,
    addNotification,
    selectedModel,
    getContext,
  } = useEditorStore();
  const { startCascadeFlow } = useAI();

  const activeTask = agentTasks.find((t) => t.id === activeTaskId);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");

    const taskId = createAgentTask(trimmed);

    // Generate a plan
    addNotification({
      type: "info",
      title: "Agent",
      message: "Planning task...",
    });

    // Create a mock plan based on the input
    const plan = generateMockPlan(trimmed);
    setTimeout(() => {
      setAgentPlan(taskId, plan);
      addNotification({
        type: "success",
        title: "Agent",
        message: "Plan ready for review",
      });
    }, 1000);
  };

  const approvePlan = async (taskId: string) => {
    updateAgentTask(taskId, { status: "executing" });
    const task = agentTasks.find((t) => t.id === taskId);
    if (!task) return;

    for (const step of task.plan) {
      const action: AgentAction = {
        id: generateId(),
        type: mapStepToAction(step.type),
        description: step.description,
        params: { step: step.title },
        status: "running",
        timestamp: Date.now(),
      };

      addAgentAction(taskId, action);

      try {
        const result = await executeAgentAction(action, getContext(), selectedModel);
        updateAgentAction(taskId, action.id, {
          status: "completed",
          result: result.result,
        });
      } catch {
        // Simulate success for demo
        await new Promise((r) => setTimeout(r, 600));
        updateAgentAction(taskId, action.id, {
          status: "completed",
          result: `Completed: ${step.title}`,
        });
      }
    }

    updateAgentTask(taskId, {
      status: "completed",
      completedAt: Date.now(),
    });

    addNotification({
      type: "success",
      title: "Agent",
      message: "Task completed successfully",
    });
  };

  const cancelTask = (taskId: string) => {
    updateAgentTask(taskId, { status: "cancelled" });
  };

  return (
    <div className="flex flex-col h-full bg-cascade-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-cascade-border">
        <div className="flex items-center gap-2">
          <Icon name="zap" size={14} className="text-cascade-agent" />
          <span className="text-sm font-medium text-cascade-text">Agent</span>
          <Badge variant="agent" size="sm">Autonomous</Badge>
        </div>
      </div>

      {/* Task content */}
      <div className="flex-1 overflow-y-auto p-3">
        {!activeTask && agentTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-cascade-textMuted text-center px-4">
            <Icon name="zap" size={32} className="text-cascade-agent/40 mb-3" />
            <p className="text-sm mb-1">Agent Mode</p>
            <p className="text-xs text-cascade-textMuted/60">
              Describe a task and the agent will autonomously plan and execute it
            </p>
            <div className="mt-4 grid grid-cols-1 gap-1.5 w-full max-w-xs">
              {[
                "Add input validation to all API routes",
                "Create unit tests for the user controller",
                "Set up error handling middleware",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="text-left px-3 py-2 bg-cascade-surface rounded-md border border-cascade-border text-xs text-cascade-textMuted hover:border-cascade-agent/30 hover:text-cascade-text transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTask && (
          <div className="space-y-3">
            {/* Task header */}
            <div className="bg-cascade-surface rounded-lg p-3 border border-cascade-border">
              <div className="flex items-center justify-between mb-1">
                <Badge variant={
                  activeTask.status === "completed" ? "success" :
                  activeTask.status === "failed" ? "error" :
                  activeTask.status === "executing" ? "agent" :
                  "warning"
                }>
                  {activeTask.status}
                </Badge>
              </div>
              <p className="text-sm text-cascade-text">{activeTask.prompt}</p>
            </div>

            {/* Plan */}
            {activeTask.plan.length > 0 && (
              <div>
                <div className="text-xs font-medium text-cascade-textMuted uppercase tracking-wider mb-2">
                  Plan
                </div>
                {activeTask.plan.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-2 py-1.5 text-xs"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                      step.status === "completed" && "bg-cascade-success/20 text-cascade-success",
                      step.status === "running" && "bg-cascade-agent/20 text-cascade-agent animate-cascade-pulse",
                      step.status === "failed" && "bg-cascade-error/20 text-cascade-error",
                      step.status === "pending" && "bg-cascade-surface text-cascade-textMuted"
                    )}>
                      {step.status === "completed" ? (
                        <Icon name="check" size={10} />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-cascade-text">{step.title}</div>
                      <div className="text-cascade-textMuted text-[10px]">{step.description}</div>
                    </div>
                  </div>
                ))}

                {activeTask.status === "awaiting_approval" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approvePlan(activeTask.id)}
                      className="flex-1 py-1.5 bg-cascade-agent/20 text-cascade-agent rounded text-xs font-medium hover:bg-cascade-agent/30 transition-colors"
                    >
                      Approve & Execute
                    </button>
                    <button
                      onClick={() => cancelTask(activeTask.id)}
                      className="px-3 py-1.5 bg-cascade-surface text-cascade-textMuted rounded text-xs hover:bg-cascade-surfaceHover transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions log */}
            {activeTask.actions.length > 0 && (
              <div>
                <div className="text-xs font-medium text-cascade-textMuted uppercase tracking-wider mb-2">
                  Actions
                </div>
                <div className="space-y-1.5">
                  {activeTask.actions.map((action) => (
                    <div
                      key={action.id}
                      className="bg-cascade-surface rounded p-2 border border-cascade-border/50 text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ActionIcon type={action.type} />
                        <span className="text-cascade-text font-medium">{action.type.replace("_", " ")}</span>
                        <span className={cn(
                          "ml-auto",
                          action.status === "completed" && "text-cascade-success",
                          action.status === "running" && "text-cascade-agent animate-cascade-pulse",
                          action.status === "failed" && "text-cascade-error"
                        )}>
                          {action.status}
                        </span>
                      </div>
                      <div className="text-cascade-textMuted">{action.description}</div>
                      {action.result && (
                        <div className="mt-1 p-1.5 bg-cascade-bg rounded text-cascade-textMuted font-mono text-[10px]">
                          {action.result}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Previous tasks */}
        {agentTasks.length > 1 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-cascade-textMuted uppercase tracking-wider mb-2">
              Previous Tasks
            </div>
            {agentTasks
              .filter((t) => t.id !== activeTaskId)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => useEditorStore.getState().setActiveTask(task.id)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-cascade-surfaceHover text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={task.status === "completed" ? "success" : "error"} size="sm">
                      {task.status}
                    </Badge>
                    <span className="text-cascade-text truncate">{task.prompt}</span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cascade-border">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe a task for the agent..."
            className="w-full bg-cascade-surface border border-cascade-border rounded-lg px-3 py-2 pr-10 text-sm text-cascade-text placeholder:text-cascade-textMuted resize-none focus:outline-none focus:border-cascade-agent min-h-[38px]"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={cn(
              "absolute right-2 bottom-2 p-1 rounded transition-colors",
              input.trim()
                ? "bg-cascade-agent text-cascade-bg hover:bg-cascade-agent/80"
                : "text-cascade-textMuted"
            )}
          >
            <Icon name="zap" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ type }: { type: string }) {
  const iconMap: Record<string, string> = {
    create_file: "plus",
    modify_file: "file",
    delete_file: "trash",
    run_command: "terminal",
    search_codebase: "search",
    read_file: "eye",
    install_package: "plus",
    git_operation: "git",
  };
  return <Icon name={iconMap[type] || "zap"} size={12} className="text-cascade-agent" />;
}

function generateMockPlan(prompt: string): CascadeStep[] {
  const lower = prompt.toLowerCase();
  const steps: CascadeStep[] = [];
  let id = 1;

  steps.push({
    id: String(id++),
    title: "Analyze codebase",
    description: "Scanning project structure and understanding current code",
    type: "analyze",
    status: "pending",
  });

  if (lower.includes("test")) {
    steps.push(
      {
        id: String(id++),
        title: "Identify test targets",
        description: "Finding functions and modules that need tests",
        type: "search",
        status: "pending",
      },
      {
        id: String(id++),
        title: "Create test files",
        description: "Writing test suites with comprehensive coverage",
        type: "create",
        status: "pending",
      },
      {
        id: String(id++),
        title: "Run tests",
        description: "Executing test suite to verify correctness",
        type: "run_command",
        status: "pending",
      }
    );
  } else if (lower.includes("validation") || lower.includes("error")) {
    steps.push(
      {
        id: String(id++),
        title: "Find endpoints",
        description: "Locating all API endpoints and input points",
        type: "search",
        status: "pending",
      },
      {
        id: String(id++),
        title: "Add validation logic",
        description: "Implementing input validation for each endpoint",
        type: "modify",
        status: "pending",
      },
      {
        id: String(id++),
        title: "Update error responses",
        description: "Ensuring consistent error response format",
        type: "modify",
        status: "pending",
      }
    );
  } else {
    steps.push(
      {
        id: String(id++),
        title: "Plan changes",
        description: "Determining required modifications",
        type: "plan",
        status: "pending",
      },
      {
        id: String(id++),
        title: "Implement changes",
        description: "Applying modifications to the codebase",
        type: "modify",
        status: "pending",
      }
    );
  }

  steps.push({
    id: String(id++),
    title: "Review and verify",
    description: "Checking all changes for correctness",
    type: "review",
    status: "pending",
  });

  return steps;
}

function mapStepToAction(stepType: string): AgentAction["type"] {
  const map: Record<string, AgentAction["type"]> = {
    analyze: "read_file",
    plan: "search_codebase",
    create: "create_file",
    modify: "modify_file",
    delete: "delete_file",
    run_command: "run_command",
    search: "search_codebase",
    test: "run_command",
    review: "read_file",
  };
  return map[stepType] || "read_file";
}
