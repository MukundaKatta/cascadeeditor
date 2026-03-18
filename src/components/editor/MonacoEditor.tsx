"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useEditorStore } from "@/store/editor-store";
import { useAI } from "@/hooks/useAI";
import { debounce } from "@/lib/utils";
import { extensionManager } from "@/lib/extension-manager";

export function MonacoEditor() {
  const editorRef = useRef<unknown>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const {
    openFiles,
    activeFileId,
    updateFileContent,
    mode,
    activeSuggestion,
    smartTabPrediction,
  } = useEditorStore();
  const { requestCompletion } = useAI();

  const activeFile = openFiles.find((f) => f.id === activeFileId);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Register custom actions
    editor.addAction({
      id: "cascade.triggerSuggestion",
      label: "Cascade: Trigger AI Suggestion",
      keybindings: [2048 | 10], // Ctrl+Space
      run: () => {
        if (activeFile) {
          const pos = editor.getPosition();
          if (pos) {
            requestCompletion(
              activeFile.content,
              pos.lineNumber - 1,
              pos.column - 1,
              activeFile.path,
              activeFile.language
            );
          }
        }
      },
    });
  };

  const debouncedCompletion = useCallback(
    debounce((content: string, line: number, col: number, path: string, lang: string) => {
      if (mode === "copilot") {
        requestCompletion(content, line, col, path, lang);
      }
    }, 500),
    [mode, requestCompletion]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!activeFile || value === undefined) return;
      updateFileContent(activeFile.id, value);
      extensionManager.notifyEditorChange(value, activeFile.path);

      // Trigger copilot suggestions
      if (mode === "copilot" && editorRef.current) {
        const editor = editorRef.current as { getPosition: () => { lineNumber: number; column: number } | null };
        const pos = editor.getPosition();
        if (pos) {
          debouncedCompletion(
            value,
            pos.lineNumber - 1,
            pos.column - 1,
            activeFile.path,
            activeFile.language
          );
        }
      }
    },
    [activeFile, updateFileContent, mode, debouncedCompletion]
  );

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cascade-bg">
        <div className="text-center">
          <div className="text-6xl mb-4 text-cascade-primary/30 font-bold font-mono">CE</div>
          <h2 className="text-xl text-cascade-textMuted mb-2">CascadeEditor</h2>
          <p className="text-sm text-cascade-textMuted/60 max-w-md">
            Open a file from the explorer or use{" "}
            <kbd className="px-1.5 py-0.5 bg-cascade-surface rounded border border-cascade-border text-xs">
              Cmd+P
            </kbd>{" "}
            to quick open
          </p>
          <div className="mt-6 flex flex-col items-center gap-2 text-xs text-cascade-textMuted/50">
            <div><kbd className="px-1.5 py-0.5 bg-cascade-surface rounded border border-cascade-border">Cmd+Shift+P</kbd> Command Palette</div>
            <div><kbd className="px-1.5 py-0.5 bg-cascade-surface rounded border border-cascade-border">Cmd+Shift+L</kbd> AI Chat</div>
            <div><kbd className="px-1.5 py-0.5 bg-cascade-surface rounded border border-cascade-border">Cmd+Shift+A</kbd> Agent Mode</div>
            <div><kbd className="px-1.5 py-0.5 bg-cascade-surface rounded border border-cascade-border">Cmd+`</kbd> Terminal</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {/* Smart Tab indicator */}
      {smartTabPrediction && smartTabPrediction.filePath === activeFile.path && (
        <div className="absolute top-2 right-4 z-10 bg-cascade-surface border border-cascade-primary/30 rounded-md px-3 py-1.5 text-xs text-cascade-primary animate-fade-in shadow-lg">
          <span className="text-cascade-textMuted">Smart Tab:</span> {smartTabPrediction.reason}
          <kbd className="ml-2 px-1 py-0.5 bg-cascade-bg rounded border border-cascade-border text-[10px]">Tab</kbd>
        </div>
      )}

      {/* Copilot suggestion ghost text indicator */}
      {activeSuggestion && mode === "copilot" && (
        <div className="absolute top-2 left-4 z-10 bg-cascade-copilot/10 border border-cascade-copilot/30 rounded-md px-2 py-1 text-[10px] text-cascade-copilot animate-fade-in">
          Copilot suggestion available (Tab to accept, Esc to dismiss)
        </div>
      )}

      <Editor
        height="100%"
        language={activeFile.language}
        value={activeFile.content}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: true, scale: 2, showSlider: "mouseover" },
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          padding: { top: 8 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "all",
          colorDecorators: true,
          tabSize: 2,
          insertSpaces: true,
          autoIndent: "full",
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}
