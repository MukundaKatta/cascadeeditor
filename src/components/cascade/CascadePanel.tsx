"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useAI } from "@/hooks/useAI";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { CascadeStep } from "@/types";

export function CascadePanel() {
  const [input, setInput] = useState("");
  const {
    cascadeFlows,
    activeCascadeId,
    setActiveCascade,
  } = useEditorStore();
  const { startCascadeFlow, executeCascade } = useAI();

  const activeFlow = cascadeFlows.find((f) => f.id === activeCascadeId);

  const handleStart = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    await startCascadeFlow(trimmed);
  };

  const handleExecute = () => {
    if (activeCascadeId) {
      executeCascade(activeCascadeId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-cascade-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-cascade-border">
        <div className="flex items-center gap-2">
          <Icon name="sparkles" size={14} className="text-cascade-primary" />
          <span className="text-xs font-medium text-cascade-text">Cascade Flow</span>
          {activeFlow && (
            <Badge variant={
              activeFlow.status === "completed" ? "success" :
              activeFlow.status === "failed" ? "error" :
              activeFlow.status === "executing" ? "primary" :
              "warning"
            } size="sm">
              {activeFlow.status}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFlow?.status === "executing" && (
            <span className="text-[10px] text-cascade-textMuted">
              {activeFlow.completedSteps}/{activeFlow.totalSteps}
            </span>
          )}
          {cascadeFlows.length > 0 && (
            <select
              value={activeCascadeId || ""}
              onChange={(e) => setActiveCascade(e.target.value || null)}
              className="bg-cascade-surface border border-cascade-border rounded px-1 py-0.5 text-[10px] text-cascade-text"
            >
              {cascadeFlows.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title.slice(0, 30)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Flow content */}
      <div className="flex-1 overflow-y-auto p-3">
        {!activeFlow && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon name="sparkles" size={24} className="text-cascade-primary/30 mb-2" />
            <p className="text-xs text-cascade-textMuted">
              Start a Cascade Flow for multi-step AI tasks
            </p>
          </div>
        )}

        {activeFlow && (
          <div className="space-y-1">
            {/* Progress bar */}
            <div className="mb-3">
              <div className="h-1 bg-cascade-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-cascade-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${activeFlow.totalSteps > 0 ? (activeFlow.completedSteps / activeFlow.totalSteps) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Steps */}
            {activeFlow.steps.map((step, idx) => (
              <StepRow key={step.id} step={step} index={idx} />
            ))}

            {/* Execute button */}
            {activeFlow.status === "executing" &&
              activeFlow.steps.some((s) => s.status === "pending") && (
                <button
                  onClick={handleExecute}
                  className="w-full mt-3 py-2 bg-cascade-primary/20 text-cascade-primary rounded text-xs font-medium hover:bg-cascade-primary/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Icon name="play" size={12} />
                  Continue Execution
                </button>
              )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-cascade-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          placeholder="Describe a multi-step task..."
          className="flex-1 bg-cascade-surface border border-cascade-border rounded px-2 py-1 text-xs text-cascade-text placeholder:text-cascade-textMuted focus:outline-none focus:border-cascade-primary"
        />
        <button
          onClick={handleStart}
          disabled={!input.trim()}
          className={cn(
            "px-3 py-1 rounded text-xs font-medium transition-colors",
            input.trim()
              ? "bg-cascade-primary text-cascade-bg hover:bg-cascade-primaryHover"
              : "bg-cascade-surface text-cascade-textMuted"
          )}
        >
          Start
        </button>
      </div>
    </div>
  );
}

function StepRow({ step, index }: { step: CascadeStep; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    pending: "bg-cascade-surface text-cascade-textMuted",
    running: "bg-cascade-primary/20 text-cascade-primary animate-cascade-pulse",
    completed: "bg-cascade-success/20 text-cascade-success",
    failed: "bg-cascade-error/20 text-cascade-error",
    skipped: "bg-cascade-surface text-cascade-textMuted/50",
  };

  const typeIcons: Record<string, string> = {
    analyze: "search",
    plan: "layout",
    create: "plus",
    modify: "file",
    delete: "trash",
    run_command: "terminal",
    search: "search",
    test: "play",
    review: "eye",
  };

  return (
    <div
      className={cn(
        "rounded border transition-colors",
        step.status === "running" && "border-cascade-primary/30 bg-cascade-primary/5",
        step.status === "completed" && "border-cascade-border/50",
        step.status === "pending" && "border-cascade-border/30",
        step.status === "failed" && "border-cascade-error/30"
      )}
    >
      <button
        className="w-full text-left flex items-center gap-2 px-2 py-1.5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
          statusColors[step.status]
        )}>
          {step.status === "completed" ? (
            <Icon name="check" size={10} />
          ) : step.status === "running" ? (
            <div className="w-2 h-2 rounded-full bg-cascade-primary animate-cascade-pulse" />
          ) : (
            <span className="text-[10px] font-bold">{index + 1}</span>
          )}
        </div>
        <Icon name={typeIcons[step.type] || "file"} size={12} className="text-cascade-textMuted flex-shrink-0" />
        <span className={cn(
          "text-xs flex-1 truncate",
          step.status === "completed" && "text-cascade-text",
          step.status === "running" && "text-cascade-primary",
          step.status === "pending" && "text-cascade-textMuted",
          step.status === "failed" && "text-cascade-error"
        )}>
          {step.title}
        </span>
        {step.duration && (
          <span className="text-[10px] text-cascade-textMuted">{step.duration}ms</span>
        )}
        <Icon name={isExpanded ? "chevronDown" : "chevronRight"} size={10} className="text-cascade-textMuted" />
      </button>

      {isExpanded && (
        <div className="px-2 pb-2 text-xs animate-fade-in">
          <div className="text-cascade-textMuted ml-7">{step.description}</div>
          {step.result && (
            <div className="mt-1 ml-7 p-1.5 bg-cascade-bg rounded text-cascade-textMuted font-mono text-[10px]">
              {step.result}
            </div>
          )}
          {step.error && (
            <div className="mt-1 ml-7 p-1.5 bg-cascade-error/10 rounded text-cascade-error text-[10px]">
              {step.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
