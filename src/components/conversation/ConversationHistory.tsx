"use client";

import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { formatTimestamp, truncate } from "@/lib/utils";

interface ConversationHistoryProps {
  onClose: () => void;
}

export function ConversationHistory({ onClose }: ConversationHistoryProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
  } = useEditorStore();

  return (
    <div className="flex flex-col h-full bg-cascade-bg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-cascade-border">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-cascade-textMuted hover:text-cascade-text">
            <Icon name="chevronRight" size={14} className="rotate-180" />
          </button>
          <span className="text-sm font-medium text-cascade-text">Conversations</span>
        </div>
        <button
          onClick={() => {
            createConversation();
            onClose();
          }}
          className="p-1 rounded hover:bg-cascade-surfaceHover text-cascade-textMuted hover:text-cascade-text"
          title="New conversation"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-cascade-textMuted">
            No conversations yet
          </div>
        )}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            className={cn(
              "w-full text-left px-3 py-2 border-b border-cascade-border/50 transition-colors",
              conv.id === activeConversationId
                ? "bg-cascade-primary/10 border-l-2 border-l-cascade-primary"
                : "hover:bg-cascade-surfaceHover"
            )}
            onClick={() => {
              setActiveConversation(conv.id);
              onClose();
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-cascade-text truncate font-medium">
                {truncate(conv.title, 30)}
              </span>
              <span className="text-[10px] text-cascade-textMuted flex-shrink-0 ml-2">
                {formatTimestamp(conv.updatedAt)}
              </span>
            </div>
            <div className="text-xs text-cascade-textMuted mt-0.5">
              {conv.messages.length} messages
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
