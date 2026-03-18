import { Extension, ExtensionHooks, CommandItem, OpenFile } from "@/types";
import { generateId } from "./utils";

class ExtensionManager {
  private extensions: Map<string, Extension> = new Map();
  private commandRegistry: Map<string, CommandItem> = new Map();

  register(extension: Extension): void {
    this.extensions.set(extension.id, extension);
    if (extension.isEnabled && extension.hooks.onActivate) {
      extension.hooks.onActivate();
    }
    if (extension.isEnabled && extension.hooks.registerCommands) {
      const commands = extension.hooks.registerCommands();
      for (const cmd of commands) {
        this.commandRegistry.set(cmd.id, cmd);
      }
    }
  }

  unregister(extensionId: string): void {
    const ext = this.extensions.get(extensionId);
    if (ext?.isEnabled && ext.hooks.onDeactivate) {
      ext.hooks.onDeactivate();
    }
    this.extensions.delete(extensionId);
    // Remove commands from this extension
    for (const [cmdId, cmd] of this.commandRegistry) {
      if (cmdId.startsWith(extensionId)) {
        this.commandRegistry.delete(cmdId);
      }
    }
  }

  enable(extensionId: string): void {
    const ext = this.extensions.get(extensionId);
    if (ext) {
      ext.isEnabled = true;
      if (ext.hooks.onActivate) ext.hooks.onActivate();
      if (ext.hooks.registerCommands) {
        const commands = ext.hooks.registerCommands();
        for (const cmd of commands) {
          this.commandRegistry.set(cmd.id, cmd);
        }
      }
    }
  }

  disable(extensionId: string): void {
    const ext = this.extensions.get(extensionId);
    if (ext) {
      ext.isEnabled = false;
      if (ext.hooks.onDeactivate) ext.hooks.onDeactivate();
    }
  }

  getAll(): Extension[] {
    return Array.from(this.extensions.values());
  }

  getEnabled(): Extension[] {
    return this.getAll().filter((e) => e.isEnabled);
  }

  getCommands(): CommandItem[] {
    return Array.from(this.commandRegistry.values());
  }

  notifyFileOpen(file: OpenFile): void {
    for (const ext of this.getEnabled()) {
      if (ext.hooks.onFileOpen) ext.hooks.onFileOpen(file);
    }
  }

  notifyFileSave(file: OpenFile): void {
    for (const ext of this.getEnabled()) {
      if (ext.hooks.onFileSave) ext.hooks.onFileSave(file);
    }
  }

  notifyEditorChange(content: string, filePath: string): void {
    for (const ext of this.getEnabled()) {
      if (ext.hooks.onEditorChange) ext.hooks.onEditorChange(content, filePath);
    }
  }

  notifyCommand(command: string): void {
    for (const ext of this.getEnabled()) {
      if (ext.hooks.onCommand) ext.hooks.onCommand(command);
    }
  }
}

export const extensionManager = new ExtensionManager();

// ===== Built-in Extensions =====

export function registerBuiltinExtensions(): void {
  const bracketColorizer: Extension = {
    id: "cascade.bracket-colorizer",
    name: "Bracket Colorizer",
    version: "1.0.0",
    description: "Colorizes matching brackets for better code readability",
    author: "CascadeEditor",
    isEnabled: true,
    hooks: {
      onActivate: () => console.log("[ext] Bracket Colorizer activated"),
      onDeactivate: () => console.log("[ext] Bracket Colorizer deactivated"),
      registerCommands: () => [
        {
          id: "cascade.bracket-colorizer.toggle",
          label: "Toggle Bracket Colorizer",
          category: "extension" as const,
          action: () => {
            const ext = extensionManager.getAll().find((e) => e.id === "cascade.bracket-colorizer");
            if (ext) {
              if (ext.isEnabled) extensionManager.disable(ext.id);
              else extensionManager.enable(ext.id);
            }
          },
        },
      ],
    },
  };

  const gitLens: Extension = {
    id: "cascade.git-lens",
    name: "Git Lens",
    version: "1.0.0",
    description: "Shows git blame information inline",
    author: "CascadeEditor",
    isEnabled: true,
    hooks: {
      onActivate: () => console.log("[ext] Git Lens activated"),
      registerCommands: () => [
        {
          id: "cascade.git-lens.toggle-blame",
          label: "Toggle Git Blame",
          category: "extension" as const,
          action: () => console.log("[ext] Toggling git blame"),
        },
        {
          id: "cascade.git-lens.show-history",
          label: "Show File History",
          category: "extension" as const,
          action: () => console.log("[ext] Showing file history"),
        },
      ],
    },
  };

  const autoImport: Extension = {
    id: "cascade.auto-import",
    name: "Auto Import",
    version: "1.0.0",
    description: "Automatically adds missing imports",
    author: "CascadeEditor",
    isEnabled: true,
    hooks: {
      onActivate: () => console.log("[ext] Auto Import activated"),
      onFileSave: (file) => {
        console.log(`[ext] Checking imports for ${file.path}`);
      },
      registerCommands: () => [
        {
          id: "cascade.auto-import.organize",
          label: "Organize Imports",
          category: "extension" as const,
          shortcut: "Shift+Alt+O",
          action: () => console.log("[ext] Organizing imports"),
        },
      ],
    },
  };

  extensionManager.register(bracketColorizer);
  extensionManager.register(gitLens);
  extensionManager.register(autoImport);
}
