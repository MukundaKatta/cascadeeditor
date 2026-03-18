import { create } from "zustand";
import {
  FileNode,
  OpenFile,
  EditorTab,
  EditorMode,
  InlineSuggestion,
  SmartTabPrediction,
  AIConversation,
  AIMessage,
  CascadeFlow,
  CascadeStep,
  AgentTask,
  AgentAction,
  DiffHunk,
  FileDiff,
  TerminalSession,
  TerminalLine,
  GitStatus,
  GitCommit,
  CommandItem,
  Notification,
  PanelConfig,
  ConversationContext,
} from "@/types";
import { generateId, getLanguageFromPath } from "@/lib/utils";
import { getDemoFileSystem, findFileByPath, getAllFiles } from "@/lib/file-system";

interface EditorState {
  // Mode
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;

  // File system
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;

  // Open files and tabs
  openFiles: OpenFile[];
  activeFileId: string | null;
  tabs: EditorTab[];
  openFile: (path: string) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  saveFile: (id: string) => void;

  // Inline suggestions (Copilot mode)
  suggestions: InlineSuggestion[];
  activeSuggestion: InlineSuggestion | null;
  setSuggestions: (suggestions: InlineSuggestion[]) => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;

  // Smart Tab
  smartTabPrediction: SmartTabPrediction | null;
  setSmartTabPrediction: (pred: SmartTabPrediction | null) => void;
  acceptSmartTab: () => void;

  // AI Conversations
  conversations: AIConversation[];
  activeConversationId: string | null;
  selectedModel: string;
  createConversation: () => string;
  addMessage: (conversationId: string, message: AIMessage) => void;
  updateLastAssistantMessage: (conversationId: string, content: string) => void;
  setActiveConversation: (id: string | null) => void;
  setSelectedModel: (model: string) => void;
  getContext: () => ConversationContext;

  // Cascade Flow
  cascadeFlows: CascadeFlow[];
  activeCascadeId: string | null;
  createCascadeFlow: (title: string, description: string) => string;
  setCascadeSteps: (flowId: string, steps: CascadeStep[]) => void;
  updateCascadeStep: (flowId: string, stepId: string, updates: Partial<CascadeStep>) => void;
  updateCascadeFlow: (flowId: string, updates: Partial<CascadeFlow>) => void;
  setActiveCascade: (id: string | null) => void;

  // Agent
  agentTasks: AgentTask[];
  activeTaskId: string | null;
  createAgentTask: (prompt: string) => string;
  setAgentPlan: (taskId: string, plan: CascadeStep[]) => void;
  addAgentAction: (taskId: string, action: AgentAction) => void;
  updateAgentAction: (taskId: string, actionId: string, updates: Partial<AgentAction>) => void;
  updateAgentTask: (taskId: string, updates: Partial<AgentTask>) => void;
  setActiveTask: (id: string | null) => void;

  // Diff
  activeDiffs: FileDiff[];
  setActiveDiffs: (diffs: FileDiff[]) => void;
  updateHunkStatus: (filePath: string, hunkId: string, status: DiffHunk["status"]) => void;
  acceptAllHunks: (filePath: string) => void;
  rejectAllHunks: (filePath: string) => void;

  // Terminal
  terminals: TerminalSession[];
  activeTerminalId: string | null;
  createTerminal: () => string;
  addTerminalLine: (terminalId: string, line: TerminalLine) => void;
  setActiveTerminal: (id: string) => void;

  // Git
  gitStatus: GitStatus;
  gitHistory: GitCommit[];
  setGitStatus: (status: GitStatus) => void;
  setGitHistory: (history: GitCommit[]) => void;

  // UI
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  sidebarPanel: "files" | "search" | "git" | "extensions" | "ai";
  setSidebarPanel: (panel: "files" | "search" | "git" | "extensions" | "ai") => void;
  bottomPanel: "terminal" | "problems" | "output" | "cascade" | null;
  setBottomPanel: (panel: "terminal" | "problems" | "output" | "cascade" | null) => void;
  rightPanel: "chat" | "agent" | null;
  setRightPanel: (panel: "chat" | "agent" | null) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;

  // Theme
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;

  // Initialize
  initialize: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Mode
  mode: "copilot",
  setMode: (mode) => set({ mode }),

  // File system
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),

  // Open files
  openFiles: [],
  activeFileId: null,
  tabs: [],

  openFile: (path) => {
    const state = get();
    const existing = state.openFiles.find((f) => f.path === path);
    if (existing) {
      set({
        activeFileId: existing.id,
        tabs: state.tabs.map((t) => ({ ...t, isActive: t.fileId === existing.id })),
      });
      return;
    }

    const fileNode = findFileByPath(state.fileTree, path);
    if (!fileNode || fileNode.type !== "file") return;

    const newFile: OpenFile = {
      id: generateId(),
      path: fileNode.path,
      name: fileNode.name,
      content: fileNode.content || "",
      language: fileNode.language || getLanguageFromPath(path),
      isModified: false,
      originalContent: fileNode.content || "",
    };

    const newTab: EditorTab = {
      id: generateId(),
      fileId: newFile.id,
      path: newFile.path,
      name: newFile.name,
      isActive: true,
      isPinned: false,
      isPreview: false,
    };

    set({
      openFiles: [...state.openFiles, newFile],
      activeFileId: newFile.id,
      tabs: [...state.tabs.map((t) => ({ ...t, isActive: false })), newTab],
    });
  },

  closeFile: (id) => {
    const state = get();
    const idx = state.openFiles.findIndex((f) => f.id === id);
    const newOpenFiles = state.openFiles.filter((f) => f.id !== id);
    const newTabs = state.tabs.filter((t) => t.fileId !== id);

    let newActiveId = state.activeFileId;
    if (state.activeFileId === id) {
      if (newOpenFiles.length > 0) {
        const newIdx = Math.min(idx, newOpenFiles.length - 1);
        newActiveId = newOpenFiles[newIdx].id;
        newTabs.forEach((t) => (t.isActive = t.fileId === newActiveId));
      } else {
        newActiveId = null;
      }
    }

    set({ openFiles: newOpenFiles, tabs: newTabs, activeFileId: newActiveId });
  },

  setActiveFile: (id) => {
    set((s) => ({
      activeFileId: id,
      tabs: s.tabs.map((t) => ({ ...t, isActive: t.fileId === id })),
    }));
  },

  updateFileContent: (id, content) => {
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.id === id ? { ...f, content, isModified: content !== f.originalContent } : f
      ),
    }));
  },

  saveFile: (id) => {
    const state = get();
    const file = state.openFiles.find((f) => f.id === id);
    if (!file) return;
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.id === id ? { ...f, isModified: false, originalContent: f.content } : f
      ),
    }));
  },

  // Suggestions
  suggestions: [],
  activeSuggestion: null,
  setSuggestions: (suggestions) => set({ suggestions, activeSuggestion: suggestions[0] || null }),
  acceptSuggestion: (id) => {
    const state = get();
    const suggestion = state.suggestions.find((s) => s.id === id);
    if (!suggestion) return;
    set({
      suggestions: state.suggestions.filter((s) => s.id !== id),
      activeSuggestion: null,
    });
  },
  dismissSuggestion: (id) => {
    const state = get();
    set({
      suggestions: state.suggestions.filter((s) => s.id !== id),
      activeSuggestion: state.activeSuggestion?.id === id ? null : state.activeSuggestion,
    });
  },

  // Smart Tab
  smartTabPrediction: null,
  setSmartTabPrediction: (pred) => set({ smartTabPrediction: pred }),
  acceptSmartTab: () => {
    const state = get();
    if (!state.smartTabPrediction) return;
    const pred = state.smartTabPrediction;
    const file = state.openFiles.find((f) => f.path === pred.filePath);
    if (file) {
      const lines = file.content.split("\n");
      if (lines[pred.line]) {
        lines[pred.line] = lines[pred.line].replace(pred.oldText, pred.newText);
        get().updateFileContent(file.id, lines.join("\n"));
      }
    }
    set({ smartTabPrediction: null });
  },

  // Conversations
  conversations: [],
  activeConversationId: null,
  selectedModel: "gpt-4-turbo",

  createConversation: () => {
    const id = generateId();
    const conversation: AIConversation = {
      id,
      title: "New conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: get().selectedModel,
    };
    set((s) => ({
      conversations: [conversation, ...s.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  addMessage: (conversationId, message) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, message],
              updatedAt: Date.now(),
              title:
                c.messages.length === 0 && message.role === "user"
                  ? message.content.slice(0, 50)
                  : c.title,
            }
          : c
      ),
    }));
  },

  updateLastAssistantMessage: (conversationId, content) => {
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = [...c.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
          msgs[lastIdx] = { ...msgs[lastIdx], content };
        }
        return { ...c, messages: msgs, updatedAt: Date.now() };
      }),
    }));
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  getContext: () => {
    const state = get();
    const activeFile = state.openFiles.find((f) => f.id === state.activeFileId);
    return {
      openFiles: state.openFiles.map((f) => f.path),
      activeFile: activeFile?.path,
      gitBranch: state.gitStatus.branch,
      recentCommits: state.gitHistory.slice(0, 5).map((c) => `${c.shortHash}: ${c.message}`),
    };
  },

  // Cascade Flow
  cascadeFlows: [],
  activeCascadeId: null,

  createCascadeFlow: (title, description) => {
    const id = generateId();
    const flow: CascadeFlow = {
      id,
      title,
      description,
      steps: [],
      status: "planning",
      createdAt: Date.now(),
      totalSteps: 0,
      completedSteps: 0,
    };
    set((s) => ({
      cascadeFlows: [flow, ...s.cascadeFlows],
      activeCascadeId: id,
    }));
    return id;
  },

  setCascadeSteps: (flowId, steps) => {
    set((s) => ({
      cascadeFlows: s.cascadeFlows.map((f) =>
        f.id === flowId
          ? { ...f, steps, totalSteps: steps.length, status: "executing" as const }
          : f
      ),
    }));
  },

  updateCascadeStep: (flowId, stepId, updates) => {
    set((s) => ({
      cascadeFlows: s.cascadeFlows.map((f) => {
        if (f.id !== flowId) return f;
        const steps = f.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        );
        const completedSteps = steps.filter(
          (st) => st.status === "completed" || st.status === "skipped"
        ).length;
        return { ...f, steps, completedSteps };
      }),
    }));
  },

  updateCascadeFlow: (flowId, updates) => {
    set((s) => ({
      cascadeFlows: s.cascadeFlows.map((f) =>
        f.id === flowId ? { ...f, ...updates } : f
      ),
    }));
  },

  setActiveCascade: (id) => set({ activeCascadeId: id }),

  // Agent
  agentTasks: [],
  activeTaskId: null,

  createAgentTask: (prompt) => {
    const id = generateId();
    const task: AgentTask = {
      id,
      prompt,
      plan: [],
      actions: [],
      status: "planning",
      createdAt: Date.now(),
    };
    set((s) => ({
      agentTasks: [task, ...s.agentTasks],
      activeTaskId: id,
    }));
    return id;
  },

  setAgentPlan: (taskId, plan) => {
    set((s) => ({
      agentTasks: s.agentTasks.map((t) =>
        t.id === taskId ? { ...t, plan, status: "awaiting_approval" as const } : t
      ),
    }));
  },

  addAgentAction: (taskId, action) => {
    set((s) => ({
      agentTasks: s.agentTasks.map((t) =>
        t.id === taskId ? { ...t, actions: [...t.actions, action] } : t
      ),
    }));
  },

  updateAgentAction: (taskId, actionId, updates) => {
    set((s) => ({
      agentTasks: s.agentTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              actions: t.actions.map((a) =>
                a.id === actionId ? { ...a, ...updates } : a
              ),
            }
          : t
      ),
    }));
  },

  updateAgentTask: (taskId, updates) => {
    set((s) => ({
      agentTasks: s.agentTasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  },

  setActiveTask: (id) => set({ activeTaskId: id }),

  // Diff
  activeDiffs: [],
  setActiveDiffs: (diffs) => set({ activeDiffs: diffs }),
  updateHunkStatus: (filePath, hunkId, status) => {
    set((s) => ({
      activeDiffs: s.activeDiffs.map((d) =>
        d.filePath === filePath
          ? {
              ...d,
              hunks: d.hunks.map((h) => (h.id === hunkId ? { ...h, status } : h)),
            }
          : d
      ),
    }));
  },
  acceptAllHunks: (filePath) => {
    set((s) => ({
      activeDiffs: s.activeDiffs.map((d) =>
        d.filePath === filePath
          ? { ...d, hunks: d.hunks.map((h) => ({ ...h, status: "accepted" as const })) }
          : d
      ),
    }));
  },
  rejectAllHunks: (filePath) => {
    set((s) => ({
      activeDiffs: s.activeDiffs.map((d) =>
        d.filePath === filePath
          ? { ...d, hunks: d.hunks.map((h) => ({ ...h, status: "rejected" as const })) }
          : d
      ),
    }));
  },

  // Terminal
  terminals: [],
  activeTerminalId: null,

  createTerminal: () => {
    const id = generateId();
    const terminal: TerminalSession = {
      id,
      name: `Terminal ${get().terminals.length + 1}`,
      output: [
        {
          id: generateId(),
          content: "Welcome to CascadeEditor Terminal",
          type: "system",
          timestamp: Date.now(),
        },
        {
          id: generateId(),
          content: "$ ",
          type: "input",
          timestamp: Date.now(),
        },
      ],
      isActive: true,
      cwd: "/project",
    };
    set((s) => ({
      terminals: [...s.terminals.map((t) => ({ ...t, isActive: false })), terminal],
      activeTerminalId: id,
    }));
    return id;
  },

  addTerminalLine: (terminalId, line) => {
    set((s) => ({
      terminals: s.terminals.map((t) =>
        t.id === terminalId ? { ...t, output: [...t.output, line] } : t
      ),
    }));
  },

  setActiveTerminal: (id) => {
    set((s) => ({
      terminals: s.terminals.map((t) => ({ ...t, isActive: t.id === id })),
      activeTerminalId: id,
    }));
  },

  // Git
  gitStatus: {
    branch: "main",
    ahead: 2,
    behind: 0,
    staged: [{ path: "src/index.ts", status: "modified" }],
    unstaged: [{ path: "src/routes.ts", status: "modified" }],
    untracked: ["src/utils/helpers.ts"],
  },
  gitHistory: [
    {
      hash: "abc1234567890",
      shortHash: "abc1234",
      message: "feat: add user authentication middleware",
      author: "Developer",
      date: "2024-01-15T10:30:00Z",
      files: ["src/middleware/auth.ts", "src/routes.ts"],
    },
    {
      hash: "def2345678901",
      shortHash: "def2345",
      message: "refactor: extract database helper functions",
      author: "Developer",
      date: "2024-01-14T15:45:00Z",
      files: ["src/database.ts"],
    },
    {
      hash: "ghi3456789012",
      shortHash: "ghi3456",
      message: "fix: handle null user in update endpoint",
      author: "Developer",
      date: "2024-01-13T09:15:00Z",
      files: ["src/controllers/users.ts"],
    },
  ],
  setGitStatus: (status) => set({ gitStatus: status }),
  setGitHistory: (history) => set({ gitHistory: history }),

  // UI
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  sidebarPanel: "files",
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
  bottomPanel: null,
  setBottomPanel: (panel) => set((s) => ({ bottomPanel: s.bottomPanel === panel ? null : panel })),
  rightPanel: "chat",
  setRightPanel: (panel) => set((s) => ({ rightPanel: s.rightPanel === panel ? null : panel })),

  notifications: [],
  addNotification: (notification) => {
    const id = generateId();
    const n = { ...notification, id };
    set((s) => ({ notifications: [...s.notifications, n] }));
    if (notification.duration !== 0) {
      setTimeout(() => {
        set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }));
      }, notification.duration || 4000);
    }
  },
  removeNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  // Theme
  theme: "dark",
  setTheme: (theme) => set({ theme }),

  // Initialize
  initialize: () => {
    const tree = getDemoFileSystem();
    set({ fileTree: tree });
    // Open the first file
    const allFiles = getAllFiles(tree);
    if (allFiles.length > 0) {
      get().openFile(allFiles[0].path);
    }
    // Create a default terminal
    get().createTerminal();
  },
}));
