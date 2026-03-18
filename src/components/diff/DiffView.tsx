"use client";

import { useEditorStore } from "@/store/editor-store";
import { DiffHunk, DiffChange } from "@/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";

export function DiffView() {
  const { activeDiffs, updateHunkStatus, acceptAllHunks, rejectAllHunks } = useEditorStore();

  if (activeDiffs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-cascade-textMuted text-sm">
        No diffs to review
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {activeDiffs.map((fileDiff) => (
        <div key={fileDiff.filePath} className="border-b border-cascade-border">
          {/* File header */}
          <div className="flex items-center justify-between px-4 py-2 bg-cascade-surface sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                fileDiff.status === "created" && "bg-cascade-success/20 text-cascade-success",
                fileDiff.status === "modified" && "bg-cascade-warning/20 text-cascade-warning",
                fileDiff.status === "deleted" && "bg-cascade-error/20 text-cascade-error"
              )}>
                {fileDiff.status[0].toUpperCase()}
              </span>
              <span className="text-sm text-cascade-text font-mono">{fileDiff.filePath}</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => acceptAllHunks(fileDiff.filePath)}
              >
                <Icon name="check" size={12} /> Accept All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => rejectAllHunks(fileDiff.filePath)}
              >
                <Icon name="x" size={12} /> Reject All
              </Button>
            </div>
          </div>

          {/* Hunks */}
          {fileDiff.hunks.map((hunk) => (
            <HunkView
              key={hunk.id}
              hunk={hunk}
              filePath={fileDiff.filePath}
              onAccept={() => updateHunkStatus(fileDiff.filePath, hunk.id, "accepted")}
              onReject={() => updateHunkStatus(fileDiff.filePath, hunk.id, "rejected")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface HunkViewProps {
  hunk: DiffHunk;
  filePath: string;
  onAccept: () => void;
  onReject: () => void;
}

function HunkView({ hunk, onAccept, onReject }: HunkViewProps) {
  return (
    <div className={cn(
      "border-l-2 mx-2 my-1 rounded-r",
      hunk.status === "pending" && "border-l-cascade-primary/50",
      hunk.status === "accepted" && "border-l-cascade-success",
      hunk.status === "rejected" && "border-l-cascade-error opacity-50"
    )}>
      {/* Hunk header */}
      <div className="flex items-center justify-between px-2 py-1 bg-cascade-bg/50">
        <span className="text-xs text-cascade-textMuted font-mono">
          @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
        </span>
        {hunk.status === "pending" && (
          <div className="flex gap-1">
            <button
              onClick={onAccept}
              className="px-2 py-0.5 text-xs rounded bg-cascade-success/20 text-cascade-success hover:bg-cascade-success/30 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={onReject}
              className="px-2 py-0.5 text-xs rounded bg-cascade-error/20 text-cascade-error hover:bg-cascade-error/30 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
        {hunk.status !== "pending" && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded",
            hunk.status === "accepted" && "bg-cascade-success/20 text-cascade-success",
            hunk.status === "rejected" && "bg-cascade-error/20 text-cascade-error"
          )}>
            {hunk.status}
          </span>
        )}
      </div>

      {/* Changes */}
      <div className="font-mono text-xs">
        {hunk.changes.map((change, idx) => (
          <DiffLine key={idx} change={change} />
        ))}
      </div>
    </div>
  );
}

function DiffLine({ change }: { change: DiffChange }) {
  return (
    <div
      className={cn(
        "flex px-2 py-px",
        change.type === "add" && "bg-cascade-diff-addedLine",
        change.type === "remove" && "bg-cascade-diff-removedLine"
      )}
    >
      <span className="w-10 text-right text-cascade-textMuted/50 select-none pr-2 flex-shrink-0">
        {change.oldLineNumber || ""}
      </span>
      <span className="w-10 text-right text-cascade-textMuted/50 select-none pr-2 flex-shrink-0">
        {change.newLineNumber || ""}
      </span>
      <span className={cn(
        "w-4 text-center flex-shrink-0 select-none",
        change.type === "add" && "text-cascade-success",
        change.type === "remove" && "text-cascade-error",
        change.type === "context" && "text-cascade-textMuted/30"
      )}>
        {change.type === "add" ? "+" : change.type === "remove" ? "-" : " "}
      </span>
      <span className={cn(
        "flex-1 whitespace-pre",
        change.type === "add" && "text-cascade-success/90",
        change.type === "remove" && "text-cascade-error/90",
        change.type === "context" && "text-cascade-textMuted"
      )}>
        {change.content}
      </span>
    </div>
  );
}
