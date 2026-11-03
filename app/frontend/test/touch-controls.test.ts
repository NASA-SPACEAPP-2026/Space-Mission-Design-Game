import { expect, test, vi } from "vitest";
import { clampToRadius, createTouchControls, joystickVector } from "../src/touch-controls";

type Handler = (event: Record<string, unknown>) => void;

/** Minimal stand-in for an HTMLElement: enough for the pointer handling under test. */
const fakeElement = (rect = { left: 0, top: 0, width: 0, height: 0 }) => {
  const handlers = new Map<string, Handler[]>();
  const classes = new Set<string>();
  const element = {
    style: { transform: "" },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      contains: (name: string) => classes.has(name)
    },
    addEventListener: (type: string, handler: Handler) => {
      handlers.set(type, [...(handlers.get(type) ?? []), handler]);
    },
    getBoundingClientRect: () => rect,
    setPointerCapture: () => undefined,
    fire: (type: string, event: Record<string, unknown>) => {
      for (const handler of handlers.get(type) ?? []) {
        handler({ preventDefault: () => undefined, pointerType: "touch", ...event });
      }
    }
  };
  return element;
};

const setup = (active = true) => {
  // Joystick base: 150px wide at (20, 300), so its centre is (95, 375) and its radius 75.
  const stick = fakeElement({ left: 20, top: 300, width: 150, height: 150 });
  const knob = fakeElement();
  const lookSurface = fakeElement();
  const state = { active };
  const onLook = vi.fn();
  const controls = createTouchControls({
    lookSurface: lookSurface as unknown as HTMLElement,
    stick: stick as unknown as HTMLElement,
    knob: knob as unknown as HTMLElement,
    isActive: () => state.active,
    onLook
  });
  return { controls, stick, knob, lookSurface, state, onLook };
};

test("joystickVector ignores the dead zone and reaches full speed at the edge", () => {
  expect(joystickVector(5, -5, 75)).toEqual({ x: 0, y: 0 });
  expect(joystickVector(0, 0, 75)).toEqual({ x: 0, y: 0 });
  expect(joystickVector(0, 10, 0)).toEqual({ x: 0, y: 0 });

  const forward = joystickVector(0, -75, 75);
  expect(forward.x).toBeCloseTo(0);
  expect(forward.y).toBeCloseTo(1);

  const right = joystickVector(75, 0, 75);
  expect(right.x).toBeCloseTo(1);
  expect(right.y).toBeCloseTo(0);

  const back = joystickVector(0, 300, 75); // far beyond the edge is still length 1
  expect(back.x).toBeCloseTo(0);
  expect(back.y).toBeCloseTo(-1);
});

test("joystickVector scales smoothly between the dead zone and the edge", () => {
  const half = joystickVector(0, -75 * 0.56, 75, 0.12); // (0.56 - 0.12) / 0.88 = 0.5
  expect(half.y).toBeCloseTo(0.5);
});

test("clampToRadius keeps the knob inside the base", () => {
  expect(clampToRadius(30, 40, 75)).toEqual({ x: 30, y: 40 });
  const clamped = clampToRadius(150, 0, 75);
  expect(clamped.x).toBeCloseTo(75);
  expect(clamped.y).toBeCloseTo(0);
});

test("the joystick turns a thumb position into movement and releases on lift", () => {
  const { controls, stick, knob } = setup();

  stick.fire("pointerdown", { pointerId: 1, clientX: 95, clientY: 300 });
  expect(controls.move.x).toBeCloseTo(0);
  expect(controls.move.y).toBeCloseTo(1);
  expect(stick.classList.contains("active")).toBe(true);
  expect(knob.style.transform).toBe("translate(0px, -75px)");

  stick.fire("pointermove", { pointerId: 1, clientX: 170, clientY: 375 });
  expect(controls.move.x).toBeCloseTo(1);
  expect(controls.move.y).toBeCloseTo(0);

  stick.fire("pointermove", { pointerId: 2, clientX: 20, clientY: 375 }); // another finger
  expect(controls.move.x).toBeCloseTo(1);

  stick.fire("pointerup", { pointerId: 1 });
  expect(controls.move).toEqual({ x: 0, y: 0 });
  expect(stick.classList.contains("active")).toBe(false);
  expect(knob.style.transform).toBe("translate(0px, 0px)");
});

test("the joystick does nothing while the world is not active", () => {
  const { controls, stick } = setup(false);
  stick.fire("pointerdown", { pointerId: 1, clientX: 95, clientY: 300 });
  expect(controls.move).toEqual({ x: 0, y: 0 });
});

test("reset releases a held joystick", () => {
  const { controls, stick } = setup();
  stick.fire("pointerdown", { pointerId: 1, clientX: 95, clientY: 300 });
  expect(controls.move.y).toBeCloseTo(1);

  controls.reset();
  expect(controls.move).toEqual({ x: 0, y: 0 });
  stick.fire("pointermove", { pointerId: 1, clientX: 95, clientY: 300 }); // late event from the old touch
  expect(controls.move).toEqual({ x: 0, y: 0 });
});

test("dragging a finger on the canvas reports look deltas", () => {
  const { lookSurface, onLook } = setup();

  lookSurface.fire("pointerdown", { pointerId: 7, clientX: 100, clientY: 100 });
  lookSurface.fire("pointermove", { pointerId: 7, clientX: 130, clientY: 90 });
  lookSurface.fire("pointermove", { pointerId: 7, clientX: 130, clientY: 95 });
  expect(onLook).toHaveBeenNthCalledWith(1, 30, -10);
  expect(onLook).toHaveBeenNthCalledWith(2, 0, 5);

  lookSurface.fire("pointermove", { pointerId: 8, clientX: 500, clientY: 500 }); // other finger
  lookSurface.fire("pointerup", { pointerId: 7 });
  lookSurface.fire("pointermove", { pointerId: 7, clientX: 200, clientY: 200 });
  expect(onLook).toHaveBeenCalledTimes(2);
});

test("the mouse is left to pointer lock and does not drag-look", () => {
  const { lookSurface, onLook } = setup();
  lookSurface.fire("pointerdown", { pointerId: 1, pointerType: "mouse", clientX: 10, clientY: 10 });
  lookSurface.fire("pointermove", { pointerId: 1, pointerType: "mouse", clientX: 60, clientY: 10 });
  expect(onLook).not.toHaveBeenCalled();
});

test("looking is paused while the world is not active", () => {
  const { lookSurface, state, onLook } = setup();
  lookSurface.fire("pointerdown", { pointerId: 3, clientX: 0, clientY: 0 });
  state.active = false;
  lookSurface.fire("pointermove", { pointerId: 3, clientX: 40, clientY: 0 });
  expect(onLook).not.toHaveBeenCalled();
});

test("one finger can walk while another looks around", () => {
  const { controls, stick, lookSurface, onLook } = setup();
  stick.fire("pointerdown", { pointerId: 1, clientX: 95, clientY: 300 });
  lookSurface.fire("pointerdown", { pointerId: 2, clientX: 300, clientY: 200 });
  lookSurface.fire("pointermove", { pointerId: 2, clientX: 320, clientY: 200 });

  expect(controls.move.y).toBeCloseTo(1);
  expect(onLook).toHaveBeenCalledWith(20, 0);
});
