import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const loadCampus = async () => {
  const src = await readFile(new URL("../public/game/05-campus.js", import.meta.url), "utf8");
  return runInNewContext(`${src}\n;CAM`, { Math, console });
};

const dir = (e, end) => {
  const p = end ? e.p.slice(-2).reverse() : e.p.slice(0, 2), dx = p[1][0] - p[0][0], dy = p[1][1] - p[0][1], L = Math.hypot(dx, dy);
  return [dx / L, dy / L];
};

const checkGraph = (G) => {
  G.edges.forEach((e) => {
    expect(e.p[0]).toEqual(G.nodes[e.a].p);
    expect(e.p[e.p.length - 1]).toEqual(G.nodes[e.b].p);
  });
  G.nodes.forEach((n, ni) => {
    if (n.ends.length < 2) return;
    expect(n.through).not.toBeNull();
    const [u, v] = n.through.map((k) => dir(G.edges[k], G.edges[k].a === ni ? 0 : 1));
    expect(u[0] * v[0] + u[1] * v[1]).toBeCloseTo(-1, 9);
  });
};

describe("road graph", () => {
  it("joins the campus roads at shared nodes with straight through-roads", async () => {
    const CAM = await loadCampus(), G = CAM.graph();
    expect(G.nodes.filter((n) => n.ends.length === 3).length).toBe(3);
    checkGraph(G);
  });

  it("snaps an endpoint that stops short of another road onto it", async () => {
    const CAM = await loadCampus();
    const G = CAM.roadGraph([[[[0, 0], [10, 0]], 15], [[[5, 5], [5, 0.3]], 11]]);
    const j = G.nodes.find((n) => n.ends.length === 3);
    expect(j.p).toEqual([5, 0]);
    checkGraph(G);
  });
});
