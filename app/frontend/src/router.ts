export type AppRoute =
  | { kind: "home"; path: "/" }
  | { kind: "profile"; path: "/profile" }
  | { kind: "missions"; path: "/missions" }
  | { kind: "mission"; path: string; missionId: string }
  | { kind: "not-found"; path: string };

const decodeSegment = (segment: string): string | null => {
  try {
    const value = decodeURIComponent(segment);
    return value.trim() && !value.includes("/") ? value : null;
  } catch {
    return null;
  }
};

export const resolveRoute = (pathname: string): AppRoute => {
  const path = pathname || "/";
  if (path === "/") {
    return { kind: "home", path: "/" };
  }
  if (path === "/profile") {
    return { kind: "profile", path };
  }
  if (path === "/missions") {
    return { kind: "missions", path };
  }

  const match = /^\/missions\/([^/]+)\/?$/.exec(path);
  if (match) {
    const missionId = decodeSegment(match[1]);
    if (missionId) {
      return { kind: "mission", path, missionId };
    }
  }
  return { kind: "not-found", path };
};

export const missionPath = (missionId: string): string =>
  `/missions/${encodeURIComponent(missionId)}`;
