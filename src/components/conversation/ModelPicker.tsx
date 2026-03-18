"use client";

import { useEditorStore } from "@/store/editor-store";
import { AVAILABLE_MODELS } from "@/lib/ai-models";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";

interface ModelPickerProps {
  onClose: () => void;
}

export function ModelPicker({ onClose }: ModelPickerProps) {
  const { selectedModel, setSelectedModel } = useEditorStore();

  const providers = [
    { id: "openai", name: "OpenAI", color: "text-green-400" },
    { id: "anthropic", name: "Anthropic", color: "text-orange-400" },
  ];

  return (
    <div className="border-b border-cascade-border bg-cascade-surface animate-slide-in">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-cascade-text">Select Model</span>
        <button onClick={onClose} className="text-cascade-textMuted hover:text-cascade-text">
          <Icon name="x" size={14} />
        </button>
      </div>

      {providers.map((provider) => {
        const models = AVAILABLE_MODELS.filter((m) => m.provider === provider.id);
        if (models.length === 0) return null;

        return (
          <div key={provider.id} className="px-3 pb-2">
            <div className={cn("text-[10px] font-medium uppercase tracking-wider mb-1", provider.color)}>
              {provider.name}
            </div>
            {models.map((model) => (
              <button
                key={model.id}
                className={cn(
                  "w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors",
                  selectedModel === model.id
                    ? "bg-cascade-primary/10 text-cascade-primary"
                    : "text-cascade-text hover:bg-cascade-surfaceHover"
                )}
                onClick={() => {
                  setSelectedModel(model.id);
                  onClose();
                }}
              >
                <div className="flex items-center gap-2">
                  {selectedModel === model.id && <Icon name="check" size={12} />}
                  <span>{model.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge size="sm">{(model.contextWindow / 1000).toFixed(0)}k</Badge>
                  {model.supportsStreaming && (
                    <Badge variant="primary" size="sm">stream</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
