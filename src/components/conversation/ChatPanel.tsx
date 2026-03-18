"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useAI } from "@/hooks/useAI";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { AVAILABLE_MODELS } from "@/lib/ai-models";
import { formatTimestamp } from "@/lib/utils";
import { ModelPicker } from "./ModelPicker";
import { ConversationHistory } from "./ConversationHistory";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    conversations,
    activeConversationId,
    selectedModel,
    openFiles,
    activeFileId,
  } = useEditorStore();

  const { sendMessage, isStreaming, stopStreaming } = useAI();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];
  const activeFile = openFiles.find((f) => f.id === activeFileId);
  const modelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    let fullMessage = trimmed;
    if (activeFile && trimmed.startsWith("@")) {
      fullMessage = `[Context: ${activeFile.path}]\n\n${trimmed.slice(1)}`;
    }

    sendMessage(fullMessage);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  if (showHistory) {
    return <ConversationHistory onClose={() => setShowHistory(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-cascade-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-cascade-border">
        <div className="flex items-center gap-2">
          <Icon name="messageSquare" size={14} className="text-cascade-primary" />
          <span className="text-sm font-medium text-cascade-text">AI Chat</span>
          <Badge variant="copilot" size="sm">Cascade</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(true)}
            className="p-1 rounded hover:bg-cascade-surfaceHover text-cascade-textMuted hover:text-cascade-text transition-colors"
            title="Conversation history"
          >
            <Icon name="layout" size={14} />
          </button>
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="p-1 rounded hover:bg-cascade-surfaceHover text-cascade-textMuted hover:text-cascade-text transition-colors"
            title="Switch model"
          >
            <Icon name="settings" size={14} />
          </button>
        </div>
      </div>

      {/* Model picker dropdown */}
      {showModelPicker && (
        <ModelPicker onClose={() => setShowModelPicker(false)} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-cascade-textMuted text-center px-4">
            <Icon name="sparkles" size={32} className="text-cascade-primary/40 mb-3" />
            <p className="text-sm mb-1">Start a conversation with Cascade</p>
            <p className="text-xs text-cascade-textMuted/60">
              Ask about code, request changes, or start a Cascade Flow for complex tasks
            </p>
            <div className="mt-4 space-y-1 text-xs">
              <p className="text-cascade-textMuted/50">Try: &quot;Explain this code&quot;</p>
              <p className="text-cascade-textMuted/50">Try: &quot;Add error handling to the API routes&quot;</p>
              <p className="text-cascade-textMuted/50">Try: &quot;@refactor the database module&quot;</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "animate-fade-in",
              msg.role === "user" ? "flex justify-end" : ""
            )}
          >
            {msg.role === "user" ? (
              <div className="max-w-[85%] bg-cascade-primary/10 border border-cascade-primary/20 rounded-lg px-3 py-2">
                <div className="text-sm text-cascade-text whitespace-pre-wrap">{msg.content}</div>
                <div className="text-[10px] text-cascade-textMuted mt-1">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name="bot" size={14} className="text-cascade-primary" />
                  <span className="text-xs text-cascade-primary font-medium">Cascade</span>
                  {msg.model && (
                    <span className="text-[10px] text-cascade-textMuted">{msg.model}</span>
                  )}
                </div>
                <div className="text-sm text-cascade-text whitespace-pre-wrap leading-relaxed">
                  <MessageContent content={msg.content} />
                </div>
                {isStreaming && msg === messages[messages.length - 1] && (
                  <span className="inline-block w-1.5 h-4 bg-cascade-primary animate-cascade-pulse ml-0.5" />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Context bar */}
      {activeFile && (
        <div className="px-3 py-1 border-t border-cascade-border/50 flex items-center gap-2 text-[10px] text-cascade-textMuted">
          <Icon name="file" size={10} />
          <span className="truncate">{activeFile.path}</span>
          <span className="text-cascade-copilot">active context</span>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-cascade-border">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Ask Cascade anything... (@ for file context)"
            className="w-full bg-cascade-surface border border-cascade-border rounded-lg px-3 py-2 pr-10 text-sm text-cascade-text placeholder:text-cascade-textMuted resize-none focus:outline-none focus:border-cascade-primary min-h-[38px] max-h-[150px]"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-1 rounded bg-cascade-error/20 text-cascade-error hover:bg-cascade-error/30 transition-colors"
              >
                <Icon name="stop" size={14} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "p-1 rounded transition-colors",
                  input.trim()
                    ? "bg-cascade-primary text-cascade-bg hover:bg-cascade-primaryHover"
                    : "text-cascade-textMuted"
                )}
              >
                <Icon name="send" size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-cascade-textMuted">
            {modelInfo?.name || selectedModel}
          </span>
          <span className="text-[10px] text-cascade-textMuted">
            Shift+Enter for newline
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Parse code blocks
  const parts = content.split(/(```[\s\S]*?```)/);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const language = lines[0]?.trim() || "";
          const code = lines.slice(1).join("\n");
          return (
            <div key={i} className="my-2 rounded-md overflow-hidden border border-cascade-border">
              <div className="flex items-center justify-between px-3 py-1 bg-cascade-surface text-[10px] text-cascade-textMuted">
                <span>{language}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="hover:text-cascade-text transition-colors"
                >
                  <Icon name="copy" size={12} />
                </button>
              </div>
              <pre className="px-3 py-2 bg-cascade-bg text-xs overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
