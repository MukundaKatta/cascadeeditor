import { describe, it, expect } from "vitest";
import { Cascadeeditor } from "../src/core.js";
describe("Cascadeeditor", () => {
  it("init", () => { expect(new Cascadeeditor().getStats().ops).toBe(0); });
  it("op", async () => { const c = new Cascadeeditor(); await c.process(); expect(c.getStats().ops).toBe(1); });
  it("reset", async () => { const c = new Cascadeeditor(); await c.process(); c.reset(); expect(c.getStats().ops).toBe(0); });
});
