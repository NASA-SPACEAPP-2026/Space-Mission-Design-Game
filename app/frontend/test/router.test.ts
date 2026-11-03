import { describe, expect, it } from "vitest";
import { missionPath, resolveRoute } from "../src/router";

describe("frontend route resolver", () => {
  it("recognizes the four dedicated application routes", () => {
    expect(resolveRoute("/")).toEqual({ kind: "home", path: "/" });
    expect(resolveRoute("/profile")).toEqual({ kind: "profile", path: "/profile" });
    expect(resolveRoute("/missions")).toEqual({ kind: "missions", path: "/missions" });
    expect(resolveRoute("/missions/lunar-survey")).toEqual({
      kind: "mission",
      path: "/missions/lunar-survey",
      missionId: "lunar-survey"
    });
  });

  it("supports a trailing slash on mission deep links", () => {
    expect(resolveRoute("/missions/mission-42/")).toEqual({
      kind: "mission",
      path: "/missions/mission-42/",
      missionId: "mission-42"
    });
  });

  it("encodes mission identifiers and rejects malformed or unknown routes", () => {
    expect(missionPath("mission 42")).toBe("/missions/mission%2042");
    expect(resolveRoute("/missions/%2Fprivate").kind).toBe("not-found");
    expect(resolveRoute("/missions/")).toEqual({ kind: "not-found", path: "/missions/" });
    expect(resolveRoute("/settings")).toEqual({ kind: "not-found", path: "/settings" });
  });
});
