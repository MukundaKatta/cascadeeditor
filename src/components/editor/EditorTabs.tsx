"use client";

import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import { getFileIcon } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";

export function EditorTabs() {
  const { tabs, openFiles, activeFileId, setActiveFile, closeFile } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex bg-cascade-bg border-b border-cascade-border overflow-x-auto">
      {tabs.map((tab) => {
        const file = openFiles.find((f) => f.id === tab.fileId);
        if (!file) return null;
        const isActive = tab.fileId === activeFileId;

        return (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer border-r border-cascade-border min-w-0 group",
              "transition-colors",
              isActive
                ? "bg-cascade-surface text-cascade-text border-t-2 border-t-cascade-primary"
                : "text-cascade-textMuted hover:bg-cascade-surfaceHover border-t-2 border-t-transparent"
            )}
            onClick={() => setActiveFile(tab.fileId)}
          >
            <span className="text-[10px] font-mono font-bold text-cascade-primary/70 flex-shrink-0">
              {getFileIcon(file.name)}
            </span>
            <span className="truncate max-w-[120px]">{file.name}</span>
            {file.isModified && (
              <span className="w-2 h-2 rounded-full bg-cascade-warning flex-shrink-0" />
            )}
            <button
              className={cn(
                "ml-1 p-0.5 rounded hover:bg-cascade-border flex-shrink-0",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                isActive && "opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                closeFile(tab.fileId);
              }}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
