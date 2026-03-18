# CascadeEditor

AI-assisted code editor with conversational coding, inline diffs, and multi-model support inspired by modern AI IDEs.

<!-- Add screenshot here -->

## Features

- **Monaco Code Editor** — Full-featured code editing with syntax highlighting and IntelliSense
- **AI Chat Panel** — Conversational coding assistant for generating and modifying code
- **Cascade Panel** — Multi-step AI code transformations with cascading edits
- **Agent Panel** — Autonomous coding agent that plans and executes complex tasks
- **Diff View** — Side-by-side diff visualization for reviewing AI-suggested changes
- **File Tree** — Project file browser with folder navigation
- **Search Panel** — Full-text search across project files
- **Git Integration** — Git status, staging, and commit management
- **Model Picker** — Switch between AI models for different tasks
- **Conversation History** — Browse and resume previous AI conversations
- **Command Palette** — Quick-access command palette for editor actions
- **Extensions Panel** — Browse and manage editor extensions

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Code Editor:** Monaco Editor (@monaco-editor/react)
- **Diff Engine:** diff library
- **Animation:** Framer Motion
- **Database:** Supabase
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

```bash
git clone <repo-url>
cd cascadeeditor
npm install
```

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/
│   ├── editor/           # Monaco editor and tabs
│   ├── sidebar/          # File tree, search, git, extensions
│   ├── conversation/     # Chat panel, model picker, history
│   ├── cascade/          # Cascade transformation panel
│   ├── agent/            # Autonomous agent panel
│   ├── diff/             # Diff view component
│   ├── command-palette/  # Command palette
│   └── common/           # Shared UI primitives
├── lib/                  # Utilities and Supabase client
└── types/                # TypeScript type definitions
```

