"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useAI } from "@/hooks/useAI";
import { CommandItem } from "@/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { getAllFiles } from "@/lib/file-system";
import { extensionManager } from "@/lib/extension-manager";

export function CommandPalette() {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<"commands" | "files" | "ai">("commands");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    fileTree,
    openFile,
    setMode: setEditorMode,
    mode: editorMode,
    setBottomPanel,
    setRightPanel,
    setSidebarPanel,
    saveFile,
    activeFileId,
    addNotification,
  } = useEditorStore();

  const { startCascadeFlow } = useAI();

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const builtinCommands: CommandItem[] = useMemo(
    () => [
      {
        id: "toggle-mode",
        label: `Switch to ${editorMode === "copilot" ? "Agent" : "Copilot"} Mode`,
        shortcut: "Cmd+Shift+M",
        icon: "zap",
        category: "ai",
        isAICommand: true,
        action: () => setEditorMode(editorMode === "copilot" ? "agent" : "copilot"),
      },
      {
        id: "open-chat",
        label: "Open AI Chat",
        shortcut: "Cmd+Shift+L",
        icon: "messageSquare",
        category: "ai",
        isAICommand: true,
        action: () => setRightPanel("chat"),
      },
      {
        id: "open-agent",
        label: "Open Agent Panel",
        shortcut: "Cmd+Shift+A",
        icon: "zap",
        category: "ai",
        isAICommand: true,
        action: () => setRightPanel("agent"),
      },
      {
        id: "start-cascade",
        label: "Start Cascade Flow",
        icon: "sparkles",
        category: "ai",
        isAICommand: true,
        action: () => {
          setBottomPanel("cascade");
        },
      },
      {
        id: "explain-code",
        label: "AI: Explain Selected Code",
        icon: "bot",
        category: "ai",
        isAICommand: true,
        action: () => {
          setRightPanel("chat");
          addNotification({ type: "info", title: "AI", message: "Select code and ask in chat" });
        },
      },
      {
        id: "refactor-code",
        label: "AI: Refactor Code",
        icon: "bot",
        category: "ai",
        isAICommand: true,
        action: () => {
          setRightPanel("chat");
          addNotification({ type: "info", title: "AI", message: "Describe the refactoring in chat" });
        },
      },
      {
        id: "generate-tests",
        label: "AI: Generate Tests",
        icon: "bot",
        category: "ai",
        isAICommand: true,
        action: () => {
          startCascadeFlow("Generate comprehensive tests for the current file");
          setBottomPanel("cascade");
        },
      },
      {
        id: "fix-errors",
        label: "AI: Fix Errors",
        icon: "bot",
        category: "ai",
        isAICommand: true,
        action: () => {
          startCascadeFlow("Find and fix errors in the current file");
          setBottomPanel("cascade");
        },
      },
      {
        id: "save-file",
        label: "Save File",
        shortcut: "Cmd+S",
        icon: "save",
        category: "file",
        action: () => activeFileId && saveFile(activeFileId),
      },
      {
        id: "toggle-terminal",
        label: "Toggle Terminal",
        shortcut: "Cmd+`",
        icon: "terminal",
        category: "terminal",
        action: () => setBottomPanel("terminal"),
      },
      {
        id: "toggle-sidebar-files",
        label: "Show File Explorer",
        icon: "file",
        category: "view",
        action: () => setSidebarPanel("files"),
      },
      {
        id: "toggle-sidebar-search",
        label: "Show Search",
        icon: "search",
        category: "view",
        action: () => setSidebarPanel("search"),
      },
      {
        id: "toggle-sidebar-git",
        label: "Show Source Control",
        icon: "git",
        category: "view",
        action: () => setSidebarPanel("git"),
      },
      {
        id: "toggle-sidebar-extensions",
        label: "Show Extensions",
        icon: "puzzle",
        category: "view",
        action: () => setSidebarPanel("extensions"),
      },
      {
        id: "toggle-cascade-panel",
        label: "Show Cascade Panel",
        icon: "sparkles",
        category: "view",
        action: () => setBottomPanel("cascade"),
      },
    ],
    [editorMode, activeFileId, setEditorMode, setRightPanel, setBottomPanel, setSidebarPanel, saveFile, addNotification, startCascadeFlow]
  );

  const extensionCommands = useMemo(() => extensionManager.getCommands(), []);

  const allFiles = useMemo(() => getAllFiles(fileTree), [fileTree]);

  // Determine mode from query prefix
  useEffect(() => {
    if (query.startsWith(">")) {
      setMode("commands");
    } else if (query.startsWith("/")) {
      setMode("ai");
    } else {
      setMode("files");
    }
    setSelectedIndex(0);
  }, [query]);

  const filteredItems = useMemo(() => {
    const searchQuery = query.replace(/^[>/]/, "").toLowerCase();

    if (mode === "files") {
      return allFiles
        .filter((f) => f.name.toLowerCase().includes(searchQuery) || f.path.toLowerCase().includes(searchQuery))
        .slice(0, 20)
        .map((f) => ({
          id: f.id,
          label: f.name,
          description: f.path,
          icon: "file",
          category: "file" as const,
          action: () => openFile(f.path),
        }));
    }

    if (mode === "ai") {
      return builtinCommands
        .filter((c) => c.isAICommand)
        .filter((c) => c.label.toLowerCase().includes(searchQuery));
    }

    const commands = [...builtinCommands, ...extensionCommands];
    return commands.filter((c) => c.label.toLowerCase().includes(searchQuery));
  }, [query, mode, allFiles, builtinCommands, extensionCommands, openFile]);

  const handleSelect = (item: CommandItem) => {
    item.action();
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-[560px] max-h-[400px] bg-cascade-surface border border-cascade-border rounded-lg shadow-2xl overflow-hidden animate-slide-in">
        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-cascade-border">
          <Icon name={mode === "files" ? "search" : mode === "ai" ? "sparkles" : "command"} size={16} className="text-cascade-textMuted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "files"
                ? "Search files by name..."
                : mode === "ai"
                ? "AI commands..."
                : "Type > for commands, / for AI..."
            }
            className="flex-1 bg-transparent text-sm text-cascade-text placeholder:text-cascade-textMuted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-cascade-textMuted hover:text-cascade-text"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Hints */}
        <div className="flex items-center gap-3 px-3 py-1 border-b border-cascade-border/50 text-[10px] text-cascade-textMuted">
          <span className={cn(mode === "files" && "text-cascade-primary")}>files</span>
          <span className={cn(mode === "commands" && "text-cascade-primary")}>&gt; commands</span>
          <span className={cn(mode === "ai" && "text-cascade-primary")}>/ ai</span>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto">
          {filteredItems.map((item, idx) => (
            <button
              key={item.id}
              className={cn(
                "w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                idx === selectedIndex
                  ? "bg-cascade-primary/10 text-cascade-text"
                  : "text-cascade-text hover:bg-cascade-surfaceHover"
              )}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              {item.icon && (
                <Icon name={item.icon} size={14} className={cn(
                  "flex-shrink-0",
                  item.isAICommand ? "text-cascade-primary" : "text-cascade-textMuted"
                )} />
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {item.description && (
                <span className="text-xs text-cascade-textMuted truncate max-w-[200px]">
                  {item.description}
                </span>
              )}
              {item.shortcut && (
                <kbd className="px-1.5 py-0.5 bg-cascade-bg rounded border border-cascade-border text-[10px] text-cascade-textMuted flex-shrink-0">
                  {item.shortcut}
                </kbd>
              )}
              {item.isAICommand && (
                <Badge variant="primary" size="sm">AI</Badge>
              )}
            </button>
          ))}

          {filteredItems.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-cascade-textMuted">
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
