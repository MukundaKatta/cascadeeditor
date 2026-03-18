"use client";

import { useState, useEffect } from "react";
import { Extension } from "@/types";
import { extensionManager } from "@/lib/extension-manager";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";

export function ExtensionsPanel() {
  const [extensions, setExtensions] = useState<Extension[]>([]);

  useEffect(() => {
    setExtensions(extensionManager.getAll());
  }, []);

  const toggleExtension = (id: string) => {
    const ext = extensions.find((e) => e.id === id);
    if (!ext) return;
    if (ext.isEnabled) {
      extensionManager.disable(id);
    } else {
      extensionManager.enable(id);
    }
    setExtensions(extensionManager.getAll());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <div className="relative">
          <Icon name="search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cascade-textMuted" />
          <input
            type="text"
            placeholder="Search extensions..."
            className="w-full bg-cascade-bg border border-cascade-border rounded px-7 py-1.5 text-sm text-cascade-text placeholder:text-cascade-textMuted focus:outline-none focus:border-cascade-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-medium text-cascade-textMuted uppercase tracking-wider">
          Installed ({extensions.length})
        </div>
        {extensions.map((ext) => (
          <div
            key={ext.id}
            className="px-3 py-2 border-b border-cascade-border/50 hover:bg-cascade-surfaceHover"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-cascade-primary/20 flex items-center justify-center">
                  <Icon name="puzzle" size={16} className="text-cascade-primary" />
                </div>
                <div>
                  <div className="text-sm text-cascade-text font-medium">{ext.name}</div>
                  <div className="text-xs text-cascade-textMuted">{ext.author}</div>
                </div>
              </div>
              <button
                onClick={() => toggleExtension(ext.id)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  ext.isEnabled
                    ? "bg-cascade-success/20 text-cascade-success"
                    : "bg-cascade-surface text-cascade-textMuted"
                }`}
              >
                {ext.isEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <p className="text-xs text-cascade-textMuted mt-1">{ext.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge size="sm">v{ext.version}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
