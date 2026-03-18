"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";

export function useKeyboardShortcuts() {
  const {
    setCommandPaletteOpen,
    commandPaletteOpen,
    saveFile,
    activeFileId,
    closeFile,
    setBottomPanel,
    setRightPanel,
    setMode,
    mode,
    openFiles,
    setActiveFile,
    tabs,
    acceptSmartTab,
    smartTabPrediction,
    activeSuggestion,
    acceptSuggestion,
    dismissSuggestion,
  } = useEditorStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;

      // Command Palette: Cmd+Shift+P
      if (isMod && e.shiftKey && e.key === "p") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // Quick Open: Cmd+P
      if (isMod && !e.shiftKey && e.key === "p") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Save: Cmd+S
      if (isMod && e.key === "s") {
        e.preventDefault();
        if (activeFileId) saveFile(activeFileId);
        return;
      }

      // Close Tab: Cmd+W
      if (isMod && e.key === "w") {
        e.preventDefault();
        if (activeFileId) closeFile(activeFileId);
        return;
      }

      // Toggle Terminal: Cmd+`
      if (isMod && e.key === "`") {
        e.preventDefault();
        setBottomPanel("terminal");
        return;
      }

      // Toggle Chat: Cmd+Shift+L
      if (isMod && e.shiftKey && e.key === "l") {
        e.preventDefault();
        setRightPanel("chat");
        return;
      }

      // Toggle Agent: Cmd+Shift+A
      if (isMod && e.shiftKey && e.key === "a") {
        e.preventDefault();
        setRightPanel("agent");
        return;
      }

      // Toggle Mode: Cmd+Shift+M
      if (isMod && e.shiftKey && e.key === "m") {
        e.preventDefault();
        setMode(mode === "copilot" ? "agent" : "copilot");
        return;
      }

      // Switch Tabs: Cmd+1-9
      if (isMod && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (openFiles[idx]) {
          setActiveFile(openFiles[idx].id);
        }
        return;
      }

      // Smart Tab: Tab when prediction is active
      if (e.key === "Tab" && smartTabPrediction && !e.shiftKey && !isMod) {
        e.preventDefault();
        acceptSmartTab();
        return;
      }

      // Accept suggestion: Tab
      if (e.key === "Tab" && activeSuggestion && !smartTabPrediction) {
        e.preventDefault();
        acceptSuggestion(activeSuggestion.id);
        return;
      }

      // Dismiss suggestion: Escape
      if (e.key === "Escape") {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (activeSuggestion) {
          dismissSuggestion(activeSuggestion.id);
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    commandPaletteOpen,
    activeFileId,
    mode,
    openFiles,
    smartTabPrediction,
    activeSuggestion,
    setCommandPaletteOpen,
    saveFile,
    closeFile,
    setBottomPanel,
    setRightPanel,
    setMode,
    setActiveFile,
    acceptSmartTab,
    acceptSuggestion,
    dismissSuggestion,
    tabs,
  ]);
}
