"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { Icon } from "@/components/common/Icon";
import { getAllFiles, findFileByPath } from "@/lib/file-system";

interface SearchResult {
  filePath: string;
  fileName: string;
  line: number;
  content: string;
  matchStart: number;
  matchEnd: number;
}

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const { fileTree, openFile } = useEditorStore();

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const allFiles = getAllFiles(fileTree);
    const searchResults: SearchResult[] = [];

    let pattern: RegExp;
    try {
      const flags = caseSensitive ? "g" : "gi";
      pattern = isRegex ? new RegExp(searchQuery, flags) : new RegExp(escapeRegex(searchQuery), flags);
    } catch {
      return;
    }

    for (const file of allFiles) {
      if (!file.content) continue;
      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const match = pattern.exec(lines[i]);
        if (match) {
          searchResults.push({
            filePath: file.path,
            fileName: file.name,
            line: i + 1,
            content: lines[i].trim(),
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
          pattern.lastIndex = 0;
        }
      }
    }

    setResults(searchResults.slice(0, 100));
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 space-y-2">
        <div className="relative">
          <Icon name="search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-cascade-textMuted" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search in files..."
            className="w-full bg-cascade-bg border border-cascade-border rounded px-7 py-1.5 text-sm text-cascade-text placeholder:text-cascade-textMuted focus:outline-none focus:border-cascade-primary"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-2 py-0.5 text-xs rounded border ${
              caseSensitive
                ? "border-cascade-primary text-cascade-primary bg-cascade-primary/10"
                : "border-cascade-border text-cascade-textMuted hover:bg-cascade-surfaceHover"
            }`}
          >
            Aa
          </button>
          <button
            onClick={() => setIsRegex(!isRegex)}
            className={`px-2 py-0.5 text-xs rounded border font-mono ${
              isRegex
                ? "border-cascade-primary text-cascade-primary bg-cascade-primary/10"
                : "border-cascade-border text-cascade-textMuted hover:bg-cascade-surfaceHover"
            }`}
          >
            .*
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-1 text-xs text-cascade-textMuted">
            {results.length} results
          </div>
          {results.map((result, idx) => (
            <button
              key={idx}
              className="w-full text-left px-3 py-1 hover:bg-cascade-surfaceHover text-xs"
              onClick={() => openFile(result.filePath)}
            >
              <div className="flex items-center gap-1">
                <span className="text-cascade-primary truncate">{result.fileName}</span>
                <span className="text-cascade-textMuted">:{result.line}</span>
              </div>
              <div className="text-cascade-textMuted truncate font-mono mt-0.5">
                {result.content}
              </div>
            </button>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="px-3 py-4 text-xs text-cascade-textMuted text-center">
          No results found
        </div>
      )}
    </div>
  );
}
