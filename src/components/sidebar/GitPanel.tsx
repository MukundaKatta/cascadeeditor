"use client";

import { useEditorStore } from "@/store/editor-store";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";

export function GitPanel() {
  const { gitStatus, gitHistory, openFile } = useEditorStore();

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Branch info */}
      <div className="px-3 py-2 border-b border-cascade-border">
        <div className="flex items-center gap-2">
          <Icon name="branch" size={14} className="text-cascade-primary" />
          <span className="text-cascade-text font-medium">{gitStatus.branch}</span>
          {gitStatus.ahead > 0 && (
            <Badge variant="primary" size="sm">{gitStatus.ahead} ahead</Badge>
          )}
          {gitStatus.behind > 0 && (
            <Badge variant="warning" size="sm">{gitStatus.behind} behind</Badge>
          )}
        </div>
      </div>

      {/* Staged changes */}
      {gitStatus.staged.length > 0 && (
        <div className="border-b border-cascade-border">
          <div className="px-3 py-1.5 text-xs font-medium text-cascade-textMuted uppercase tracking-wider">
            Staged ({gitStatus.staged.length})
          </div>
          {gitStatus.staged.map((change, idx) => (
            <button
              key={idx}
              className="w-full text-left flex items-center gap-2 px-3 py-1 hover:bg-cascade-surfaceHover"
              onClick={() => openFile(change.path.startsWith("/") ? change.path : `/project/${change.path}`)}
            >
              <span className={`text-xs font-mono font-bold ${
                change.status === "added" ? "text-cascade-success" :
                change.status === "modified" ? "text-cascade-warning" :
                "text-cascade-error"
              }`}>
                {change.status[0].toUpperCase()}
              </span>
              <span className="text-cascade-text truncate text-xs">{change.path}</span>
            </button>
          ))}
        </div>
      )}

      {/* Unstaged changes */}
      {gitStatus.unstaged.length > 0 && (
        <div className="border-b border-cascade-border">
          <div className="px-3 py-1.5 text-xs font-medium text-cascade-textMuted uppercase tracking-wider">
            Changes ({gitStatus.unstaged.length})
          </div>
          {gitStatus.unstaged.map((change, idx) => (
            <button
              key={idx}
              className="w-full text-left flex items-center gap-2 px-3 py-1 hover:bg-cascade-surfaceHover"
              onClick={() => openFile(change.path.startsWith("/") ? change.path : `/project/${change.path}`)}
            >
              <span className={`text-xs font-mono font-bold ${
                change.status === "modified" ? "text-cascade-warning" : "text-cascade-error"
              }`}>
                {change.status[0].toUpperCase()}
              </span>
              <span className="text-cascade-text truncate text-xs">{change.path}</span>
            </button>
          ))}
        </div>
      )}

      {/* Untracked */}
      {gitStatus.untracked.length > 0 && (
        <div className="border-b border-cascade-border">
          <div className="px-3 py-1.5 text-xs font-medium text-cascade-textMuted uppercase tracking-wider">
            Untracked ({gitStatus.untracked.length})
          </div>
          {gitStatus.untracked.map((path, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1 text-xs text-cascade-textMuted">
              <span className="font-mono font-bold text-cascade-success">U</span>
              <span className="truncate">{path}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent commits */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-medium text-cascade-textMuted uppercase tracking-wider">
          Recent Commits
        </div>
        {gitHistory.map((commit) => (
          <div
            key={commit.hash}
            className="px-3 py-2 border-b border-cascade-border/50 hover:bg-cascade-surfaceHover cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cascade-primary">{commit.shortHash}</span>
              <span className="text-xs text-cascade-textMuted">{commit.date.split("T")[0]}</span>
            </div>
            <div className="text-xs text-cascade-text mt-0.5 truncate">{commit.message}</div>
            <div className="flex gap-1 mt-1">
              {commit.files.map((file, idx) => (
                <span key={idx} className="text-[10px] text-cascade-textMuted bg-cascade-bg px-1 rounded">
                  {file.split("/").pop()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
