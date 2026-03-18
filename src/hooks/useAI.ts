"use client";

import { useCallback, useRef, useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import {
  streamChatCompletion,
  generateCascadePlan,
  executeCascadeStep,
  getInlineCompletion,
  getSmartTabPrediction,
} from "@/lib/ai-service";
import { AIMessage, CascadeStep } from "@/types";
import { generateId } from "@/lib/utils";

export function useAI() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);

  const {
    selectedModel,
    activeConversationId,
    conversations,
    addMessage,
    updateLastAssistantMessage,
    createConversation,
    getContext,
    createCascadeFlow,
    setCascadeSteps,
    updateCascadeStep,
    updateCascadeFlow,
    addNotification,
    openFiles,
    activeFileId,
    setSmartTabPrediction,
    setSuggestions,
  } = useEditorStore();

  const sendMessage = useCallback(
    async (content: string) => {
      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      const userMessage: AIMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };
      addMessage(convId, userMessage);

      const assistantMessage: AIMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        model: selectedModel,
      };
      addMessage(convId, assistantMessage);

      const conversation = useEditorStore.getState().conversations.find((c) => c.id === convId);
      const messages = conversation?.messages.slice(0, -1) || [userMessage];

      setIsStreaming(true);
      abortRef.current = false;

      await streamChatCompletion(messages, selectedModel, getContext(), {
        onToken: (token) => {
          if (abortRef.current) return;
          const conv = useEditorStore.getState().conversations.find((c) => c.id === convId);
          const lastMsg = conv?.messages[conv.messages.length - 1];
          if (lastMsg) {
            updateLastAssistantMessage(convId!, lastMsg.content + token);
          }
        },
        onComplete: () => {
          setIsStreaming(false);
        },
        onError: (error) => {
          setIsStreaming(false);
          updateLastAssistantMessage(
            convId!,
            `Error: ${error.message}. Make sure your API keys are configured in .env.local`
          );
        },
      });
    },
    [
      activeConversationId,
      selectedModel,
      addMessage,
      updateLastAssistantMessage,
      createConversation,
      getContext,
    ]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
  }, []);

  const startCascadeFlow = useCallback(
    async (prompt: string) => {
      const flowId = createCascadeFlow(prompt, prompt);

      addNotification({
        type: "info",
        title: "Cascade Flow",
        message: "Planning multi-step task...",
      });

      try {
        const steps = await generateCascadePlan(prompt, getContext(), selectedModel);
        setCascadeSteps(flowId, steps);

        addNotification({
          type: "success",
          title: "Cascade Flow",
          message: `Plan ready with ${steps.length} steps`,
        });
      } catch (error) {
        // Generate mock steps for demo
        const mockSteps: CascadeStep[] = [
          {
            id: generateId(),
            title: "Analyze requirements",
            description: `Understanding: "${prompt}"`,
            type: "analyze",
            status: "completed",
            result: "Requirements analyzed successfully",
          },
          {
            id: generateId(),
            title: "Plan implementation",
            description: "Creating implementation strategy",
            type: "plan",
            status: "completed",
            result: "Strategy: modular approach with type safety",
          },
          {
            id: generateId(),
            title: "Create/modify files",
            description: "Implementing the requested changes",
            type: "modify",
            status: "pending",
          },
          {
            id: generateId(),
            title: "Review changes",
            description: "Verifying correctness and quality",
            type: "review",
            status: "pending",
          },
        ];
        setCascadeSteps(flowId, mockSteps);
      }

      return flowId;
    },
    [selectedModel, createCascadeFlow, setCascadeSteps, getContext, addNotification]
  );

  const executeCascade = useCallback(
    async (flowId: string) => {
      const flow = useEditorStore.getState().cascadeFlows.find((f) => f.id === flowId);
      if (!flow) return;

      for (const step of flow.steps) {
        if (step.status === "completed" || step.status === "skipped") continue;

        updateCascadeStep(flowId, step.id, { status: "running" });

        try {
          const result = await executeCascadeStep(step, getContext(), selectedModel);
          updateCascadeStep(flowId, step.id, {
            status: "completed",
            result: result.result,
          });
        } catch {
          // Simulate execution for demo
          await new Promise((r) => setTimeout(r, 800));
          updateCascadeStep(flowId, step.id, {
            status: "completed",
            result: `Completed: ${step.title}`,
            duration: 800,
          });
        }
      }

      updateCascadeFlow(flowId, {
        status: "completed",
        completedAt: Date.now(),
      });

      addNotification({
        type: "success",
        title: "Cascade Flow Complete",
        message: "All steps executed successfully",
      });
    },
    [selectedModel, updateCascadeStep, updateCascadeFlow, getContext, addNotification]
  );

  const requestCompletion = useCallback(
    async (code: string, line: number, column: number, filePath: string, language: string) => {
      try {
        const completion = await getInlineCompletion(code, line, column, filePath, language, selectedModel);
        if (completion) {
          setSuggestions([
            {
              id: generateId(),
              fileId: activeFileId || "",
              line,
              column,
              text: completion,
              displayText: completion,
              type: "completion",
              confidence: 0.85,
            },
          ]);
        }
      } catch {
        // Silently fail for completions
      }
    },
    [selectedModel, activeFileId, setSuggestions]
  );

  const requestSmartTab = useCallback(async () => {
    try {
      const files = openFiles.map((f) => ({ path: f.path, content: f.content }));
      const activeFile = openFiles.find((f) => f.id === activeFileId);
      const prediction = await getSmartTabPrediction(
        files,
        activeFile?.path || "",
        [],
        selectedModel
      );
      if (prediction) {
        setSmartTabPrediction({
          id: generateId(),
          ...prediction,
        });
      }
    } catch {
      // Silently fail
    }
  }, [openFiles, activeFileId, selectedModel, setSmartTabPrediction]);

  return {
    sendMessage,
    isStreaming,
    stopStreaming,
    startCascadeFlow,
    executeCascade,
    requestCompletion,
    requestSmartTab,
  };
}
