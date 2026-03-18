import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    dockerfile: "dockerfile",
    toml: "toml",
    ini: "ini",
    env: "plaintext",
    txt: "plaintext",
    graphql: "graphql",
    vue: "vue",
    svelte: "svelte",
  };
  return languageMap[ext] || "plaintext";
}

export function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, string> = {
    ts: "TS",
    tsx: "TX",
    js: "JS",
    jsx: "JX",
    py: "PY",
    rs: "RS",
    go: "GO",
    java: "JV",
    json: "{}",
    html: "<>",
    css: "#",
    md: "MD",
    yaml: "YM",
    yml: "YM",
    sql: "SQ",
    sh: "$",
    dockerfile: "DK",
  };
  return iconMap[ext] || "F";
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function buildProjectStructure(files: string[]): string {
  const tree: Record<string, unknown> = {};
  for (const file of files) {
    const parts = file.split("/");
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part] as Record<string, unknown>;
      }
    }
  }

  function renderTree(node: Record<string, unknown>, prefix: string = ""): string {
    const entries = Object.entries(node);
    let result = "";
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      result += prefix + connector + key + "\n";
      if (value !== null) {
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        result += renderTree(value as Record<string, unknown>, childPrefix);
      }
    });
    return result;
  }

  return renderTree(tree);
}
