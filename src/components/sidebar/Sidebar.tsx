"use client";

import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { FileTree } from "./FileTree";
import { SearchPanel } from "./SearchPanel";
import { GitPanel } from "./GitPanel";
import { ExtensionsPanel } from "./ExtensionsPanel";

const sidebarItems = [
  { id: "files" as const, icon: "file", label: "Explorer" },
  { id: "search" as const, icon: "search", label: "Search" },
  { id: "git" as const, icon: "git", label: "Source Control" },
  { id: "extensions" as const, icon: "puzzle", label: "Extensions" },
  { id: "ai" as const, icon: "sparkles", label: "AI Assistant" },
];

export function Sidebar() {
  const { sidebarPanel, setSidebarPanel, setRightPanel } = useEditorStore();

  const handlePanelClick = (panel: typeof sidebarPanel) => {
    if (panel === "ai") {
      setRightPanel("chat");
      return;
    }
    setSidebarPanel(panel);
  };

  return (
    <div className="flex h-full">
      {/* Activity Bar */}
      <div className="w-12 bg-cascade-bg border-r border-cascade-border flex flex-col items-center py-2 gap-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handlePanelClick(item.id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-md transition-colors relative",
              sidebarPanel === item.id && item.id !== "ai"
                ? "text-cascade-text bg-cascade-surfaceHover"
                : "text-cascade-textMuted hover:text-cascade-text hover:bg-cascade-surfaceHover"
            )}
            title={item.label}
          >
            <Icon name={item.icon} size={20} />
            {sidebarPanel === item.id && item.id !== "ai" && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cascade-primary rounded-r" />
            )}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => {}}
          className="w-10 h-10 flex items-center justify-center rounded-md text-cascade-textMuted hover:text-cascade-text hover:bg-cascade-surfaceHover transition-colors"
          title="Settings"
        >
          <Icon name="settings" size={20} />
        </button>
      </div>

      {/* Panel Content */}
      <div className="w-60 bg-cascade-surface border-r border-cascade-border flex flex-col overflow-hidden">
        <div className="px-3 py-2 text-xs font-medium text-cascade-textMuted uppercase tracking-wider border-b border-cascade-border">
          {sidebarItems.find((i) => i.id === sidebarPanel)?.label || "Explorer"}
        </div>
        <div className="flex-1 overflow-y-auto">
          {sidebarPanel === "files" && <FileTree />}
          {sidebarPanel === "search" && <SearchPanel />}
          {sidebarPanel === "git" && <GitPanel />}
          {sidebarPanel === "extensions" && <ExtensionsPanel />}
        </div>
      </div>
    </div>
  );
}
