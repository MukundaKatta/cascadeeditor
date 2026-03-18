import { DiffHunk, DiffChange, FileDiff } from "@/types";
import { generateId } from "./utils";

export function computeDiff(oldText: string, newText: string, filePath: string): FileDiff {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const hunks = generateHunks(oldLines, newLines);

  let status: FileDiff["status"] = "modified";
  if (oldText === "") status = "created";
  if (newText === "") status = "deleted";

  return { filePath, hunks, status };
}

function generateHunks(oldLines: string[], newLines: string[]): DiffHunk[] {
  const lcs = computeLCS(oldLines, newLines);
  const changes = buildChanges(oldLines, newLines, lcs);
  return groupIntoHunks(changes);
}

function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

interface RawChange {
  type: "add" | "remove" | "context";
  content: string;
  oldLine?: number;
  newLine?: number;
}

function buildChanges(oldLines: string[], newLines: string[], dp: number[][]): RawChange[] {
  const changes: RawChange[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  const stack: RawChange[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: "context", content: oldLines[i - 1], oldLine: i, newLine: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "add", content: newLines[j - 1], newLine: j });
      j--;
    } else if (i > 0) {
      stack.push({ type: "remove", content: oldLines[i - 1], oldLine: i });
      i--;
    }
  }

  for (let k = stack.length - 1; k >= 0; k--) {
    changes.push(stack[k]);
  }

  return changes;
}

function groupIntoHunks(changes: RawChange[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const contextLines = 3;
  let currentChanges: DiffChange[] = [];
  let hunkOldStart = 0;
  let hunkNewStart = 0;
  let lastChangeIdx = -10;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const isChange = change.type !== "context";

    if (isChange) {
      // Add preceding context
      if (currentChanges.length === 0 || i - lastChangeIdx > contextLines * 2) {
        // Start new hunk
        if (currentChanges.length > 0) {
          hunks.push(createHunk(currentChanges, hunkOldStart, hunkNewStart));
          currentChanges = [];
        }
        // Add preceding context lines
        const contextStart = Math.max(0, i - contextLines);
        hunkOldStart = changes[contextStart]?.oldLine || 1;
        hunkNewStart = changes[contextStart]?.newLine || 1;
        for (let c = contextStart; c < i; c++) {
          if (changes[c].type === "context") {
            currentChanges.push({
              type: "context",
              content: changes[c].content,
              oldLineNumber: changes[c].oldLine,
              newLineNumber: changes[c].newLine,
            });
          }
        }
      }

      currentChanges.push({
        type: change.type as "add" | "remove",
        content: change.content,
        oldLineNumber: change.oldLine,
        newLineNumber: change.newLine,
      });
      lastChangeIdx = i;
    } else if (currentChanges.length > 0 && i - lastChangeIdx <= contextLines) {
      currentChanges.push({
        type: "context",
        content: change.content,
        oldLineNumber: change.oldLine,
        newLineNumber: change.newLine,
      });
    }
  }

  if (currentChanges.length > 0) {
    hunks.push(createHunk(currentChanges, hunkOldStart, hunkNewStart));
  }

  return hunks;
}

function createHunk(changes: DiffChange[], oldStart: number, newStart: number): DiffHunk {
  const oldLines = changes.filter((c) => c.type === "remove" || c.type === "context").length;
  const newLines = changes.filter((c) => c.type === "add" || c.type === "context").length;

  return {
    id: generateId(),
    oldStart,
    oldLines,
    newStart,
    newLines,
    changes,
    status: "pending",
  };
}

export function applyHunks(originalText: string, hunks: DiffHunk[]): string {
  const lines = originalText.split("\n");
  const result = [...lines];
  let offset = 0;

  const acceptedHunks = hunks
    .filter((h) => h.status === "accepted")
    .sort((a, b) => a.oldStart - b.oldStart);

  for (const hunk of acceptedHunks) {
    const removals = hunk.changes
      .filter((c) => c.type === "remove")
      .map((c) => (c.oldLineNumber || 0) - 1 + offset);
    const additions = hunk.changes.filter((c) => c.type === "add");

    // Remove old lines
    for (let i = removals.length - 1; i >= 0; i--) {
      result.splice(removals[i], 1);
      offset--;
    }

    // Add new lines
    const insertAt = removals.length > 0 ? removals[0] : (hunk.newStart - 1 + offset);
    for (let i = 0; i < additions.length; i++) {
      result.splice(insertAt + i, 0, additions[i].content);
      offset++;
    }
  }

  return result.join("\n");
}
