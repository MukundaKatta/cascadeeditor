import { FileNode } from "@/types";
import { generateId, getLanguageFromPath } from "./utils";

// Demo file system for the editor
const DEMO_FILES: FileNode[] = [
  {
    id: generateId(),
    name: "src",
    path: "/project/src",
    type: "directory",
    children: [
      {
        id: generateId(),
        name: "index.ts",
        path: "/project/src/index.ts",
        type: "file",
        language: "typescript",
        content: `import express from "express";
import { router } from "./routes";
import { connectDatabase } from "./database";
import { logger } from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", router);

async function start() {
  await connectDatabase();
  app.listen(PORT, () => {
    logger.info(\`Server running on port \${PORT}\`);
  });
}

start().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
`,
      },
      {
        id: generateId(),
        name: "routes.ts",
        path: "/project/src/routes.ts",
        type: "file",
        language: "typescript",
        content: `import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser } from "./controllers/users";
import { authenticate } from "./middleware/auth";

export const router = Router();

router.get("/users", authenticate, getUsers);
router.post("/users", authenticate, createUser);
router.put("/users/:id", authenticate, updateUser);
router.delete("/users/:id", authenticate, deleteUser);
`,
      },
      {
        id: generateId(),
        name: "database.ts",
        path: "/project/src/database.ts",
        type: "file",
        language: "typescript",
        content: `import { Pool } from "pg";
import { logger } from "./utils/logger";

let pool: Pool;

export async function connectDatabase(): Promise<void> {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
  });

  try {
    const client = await pool.connect();
    client.release();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Database connection failed:", error);
    throw error;
  }
}

export function getPool(): Pool {
  if (!pool) throw new Error("Database not initialized");
  return pool;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
`,
      },
      {
        id: generateId(),
        name: "controllers",
        path: "/project/src/controllers",
        type: "directory",
        children: [
          {
            id: generateId(),
            name: "users.ts",
            path: "/project/src/controllers/users.ts",
            type: "file",
            language: "typescript",
            content: `import { Request, Response } from "express";
import { query } from "../database";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await query<User>("SELECT * FROM users ORDER BY created_at DESC");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

export async function createUser(req: Request, res: Response) {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }
  try {
    const [user] = await query<User>(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const [user] = await query<User>(
      "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING *",
      [name, email, id]
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [user] = await query<User>("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
}
`,
          },
        ],
      },
      {
        id: generateId(),
        name: "middleware",
        path: "/project/src/middleware",
        type: "directory",
        children: [
          {
            id: generateId(),
            name: "auth.ts",
            path: "/project/src/middleware/auth.ts",
            type: "file",
            language: "typescript",
            content: `import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
`,
          },
        ],
      },
      {
        id: generateId(),
        name: "utils",
        path: "/project/src/utils",
        type: "directory",
        children: [
          {
            id: generateId(),
            name: "logger.ts",
            path: "/project/src/utils/logger.ts",
            type: "file",
            language: "typescript",
            content: `type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_COLORS: Record<LogLevel, string> = {
  debug: "\\x1b[36m",
  info: "\\x1b[32m",
  warn: "\\x1b[33m",
  error: "\\x1b[31m",
};

const RESET = "\\x1b[0m";

class Logger {
  private level: LogLevel = "info";

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    if (levels.indexOf(level) < levels.indexOf(this.level)) return;

    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level];
    console.log(\`\${color}[\${timestamp}] [\${level.toUpperCase()}]\${RESET} \${message}\`, ...args);
  }

  debug(message: string, ...args: unknown[]) { this.log("debug", message, ...args); }
  info(message: string, ...args: unknown[]) { this.log("info", message, ...args); }
  warn(message: string, ...args: unknown[]) { this.log("warn", message, ...args); }
  error(message: string, ...args: unknown[]) { this.log("error", message, ...args); }
}

export const logger = new Logger();
`,
          },
        ],
      },
    ],
  },
  {
    id: generateId(),
    name: "package.json",
    path: "/project/package.json",
    type: "file",
    language: "json",
    content: `{
  "name": "demo-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/pg": "^8.10.9",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
`,
  },
  {
    id: generateId(),
    name: "tsconfig.json",
    path: "/project/tsconfig.json",
    type: "file",
    language: "json",
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
`,
  },
  {
    id: generateId(),
    name: ".gitignore",
    path: "/project/.gitignore",
    type: "file",
    language: "plaintext",
    content: `node_modules/
dist/
.env
*.log
`,
  },
];

export function getDemoFileSystem(): FileNode[] {
  return DEMO_FILES;
}

export function findFileByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findFileByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function getAllFiles(nodes: FileNode[]): FileNode[] {
  const files: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === "file") files.push(node);
    if (node.children) files.push(...getAllFiles(node.children));
  }
  return files;
}

export function createFileNode(
  path: string,
  content: string
): FileNode {
  const name = path.split("/").pop() || "";
  return {
    id: generateId(),
    name,
    path,
    type: "file",
    language: getLanguageFromPath(path),
    content,
  };
}
