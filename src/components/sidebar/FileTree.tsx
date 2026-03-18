"use client";

import { useState } from "react";
import { FileNode } from "@/types";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import { getFileIcon } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const { openFile, activeFileId, openFiles } = useEditorStore();

  const isActive = openFiles.some(
    (f) => f.path === node.path && f.id === activeFileId
  );

  const handleClick = () => {
    if (node.type === "directory") {
      setIsExpanded(!isExpanded);
    } else {
      openFile(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-[3px] cursor-pointer text-sm",
          "hover:bg-cascade-surfaceHover transition-colors",
          isActive && "bg-cascade-primary/10 text-cascade-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "directory" ? (
          <>
            <Icon
              name={isExpanded ? "chevronDown" : "chevronRight"}
              size={14}
              className="text-cascade-textMuted flex-shrink-0"
            />
            <Icon
              name={isExpanded ? "folder-open" : "folder"}
              size={14}
              className="text-cascade-warning flex-shrink-0"
            />
          </>
        ) : (
          <>
            <span className="w-[14px]" />
            <span className="text-[10px] font-mono font-bold text-cascade-primary/70 w-[14px] text-center flex-shrink-0">
              {getFileIcon(node.name)}
            </span>
          </>
        )}
        <span className={cn("truncate", node.type === "file" && "text-cascade-text")}>
          {node.name}
        </span>
      </div>
      {node.type === "directory" && isExpanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === "directory" ? -1 : 1;
            })
            .map((child) => (
              <FileTreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const { fileTree } = useEditorStore();

  return (
    <div className="py-1">
      {fileTree.map((node) => (
        <FileTreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}
