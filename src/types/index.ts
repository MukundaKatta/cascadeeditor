// ===== File System Types =====
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
  language?: string;
  isOpen?: boolean;
  isModified?: boolean;
  lastModified?: number;
}

export interface OpenFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isModified: boolean;
  originalContent: string;
  cursorPosition?: CursorPosition;
  scrollPosition?: { top: number; left: number };
}

export interface CursorPosition {
  line: number;
  column: number;
}

// ===== Editor Types =====
export type EditorMode = "copilot" | "agent";

export interface EditorTab {
  id: string;
  fileId: string;
  path: string;
  name: string;
  isActive: boolean;
  isPinned: boolean;
  isPreview: boolean;
}

export interface InlineSuggestion {
  id: string;
  fileId: string;
  line: number;
  column: number;
  text: string;
  displayText: string;
  type: "completion" | "refactor" | "fix";
  confidence: number;
}

export interface SmartTabPrediction {
  id: string;
  filePath: string;
  line: number;
  column: number;
  oldText: string;
  newText: string;
  reason: string;
}

// ===== Diff Types =====
export interface DiffHunk {
  id: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  changes: DiffChange[];
  status: "pending" | "accepted" | "rejected";
}

export interface DiffChange {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileDiff {
  filePath: string;
  hunks: DiffHunk[];
  status: "created" | "modified" | "deleted";
}

// ===== AI / Model Types =====
export type AIProvider = "openai" | "anthropic" | "local";

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  supportsStreaming: boolean;
  capabilities: ("completion" | "chat" | "code" | "vision")[];
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string;
  tokens?: { input: number; output: number };
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  model: string;
  context?: ConversationContext;
}

export interface ConversationContext {
  openFiles: string[];
  activeFile?: string;
  selectedCode?: string;
  gitBranch?: string;
  recentCommits?: string[];
  terminalOutput?: string;
  projectStructure?: string;
}

// ===== Cascade Flow Types =====
export type CascadeStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface CascadeStep {
  id: string;
  title: string;
  description: string;
  type: "analyze" | "plan" | "create" | "modify" | "delete" | "run_command" | "search" | "test" | "review";
  status: CascadeStepStatus;
  result?: string;
  error?: string;
  filePath?: string;
  diff?: FileDiff;
  command?: string;
  duration?: number;
  children?: CascadeStep[];
}

export interface CascadeFlow {
  id: string;
  title: string;
  description: string;
  steps: CascadeStep[];
  status: "planning" | "executing" | "paused" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  totalSteps: number;
  completedSteps: number;
}

// ===== Agent Types =====
export type AgentActionType =
  | "create_file"
  | "modify_file"
  | "delete_file"
  | "run_command"
  | "search_codebase"
  | "read_file"
  | "install_package"
  | "git_operation";

export interface AgentAction {
  id: string;
  type: AgentActionType;
  description: string;
  params: Record<string, unknown>;
  result?: string;
  error?: string;
  status: CascadeStepStatus;
  timestamp: number;
  filePath?: string;
  diff?: FileDiff;
}

export interface AgentTask {
  id: string;
  prompt: string;
  plan: CascadeStep[];
  actions: AgentAction[];
  status: "planning" | "awaiting_approval" | "executing" | "completed" | "failed" | "cancelled";
  createdAt: number;
  completedAt?: number;
}

// ===== Command Palette Types =====
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: string;
  category: "file" | "edit" | "ai" | "git" | "terminal" | "view" | "extension";
  action: () => void | Promise<void>;
  isAICommand?: boolean;
}

// ===== Terminal Types =====
export interface TerminalSession {
  id: string;
  name: string;
  output: TerminalLine[];
  isActive: boolean;
  cwd: string;
}

export interface TerminalLine {
  id: string;
  content: string;
  type: "input" | "output" | "error" | "system";
  timestamp: number;
}

// ===== Git Types =====
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
}

export interface GitFileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  oldPath?: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

// ===== Extension Types =====
export interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  isEnabled: boolean;
  hooks: ExtensionHooks;
}

export interface ExtensionHooks {
  onActivate?: () => void;
  onDeactivate?: () => void;
  onFileOpen?: (file: OpenFile) => void;
  onFileSave?: (file: OpenFile) => void;
  onCommand?: (command: string) => void;
  registerCommands?: () => CommandItem[];
  onEditorChange?: (content: string, filePath: string) => void;
}

// ===== Layout Types =====
export type PanelPosition = "left" | "right" | "bottom";

export interface PanelConfig {
  id: string;
  title: string;
  position: PanelPosition;
  isVisible: boolean;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
}

// ===== Notification Types =====
export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}
