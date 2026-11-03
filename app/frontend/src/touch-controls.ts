/**
 * Touch input for the first-person world: a virtual joystick for movement and
 * drag-to-look on the 3D canvas. Keyboard and mouse keep working unchanged.
 */

export type Vec2 = { x: number; y: number };

export const JOYSTICK_DEAD_ZONE = 0.12;

const ZERO: Vec2 = { x: 0, y: 0 };

/**
 * Converts the thumb offset from the joystick centre (CSS pixels, y grows
 * downwards) into a movement vector: x is strafe (right is positive), y is
 * forward (up on screen is positive). The length goes from 0 at the dead zone
 * to 1 at the edge of the joystick, so a light push walks slowly.
 */
export const joystickVector = (
  offsetX: number,
  offsetY: number,
  radius: number,
  deadZone = JOYSTICK_DEAD_ZONE
): Vec2 => {
  const distance = Math.hypot(offsetX, offsetY);
  if (!(radius > 0) || distance === 0) {
    return { ...ZERO };
  }
  const strength = Math.min(1, distance / radius);
  if (strength <= deadZone) {
    return { ...ZERO };
  }
  const scaled = (strength - deadZone) / (1 - deadZone);
  return { x: (offsetX / distance) * scaled, y: (-offsetY / distance) * scaled };
};

/** Keeps the knob inside the joystick base. */
export const clampToRadius = (offsetX: number, offsetY: number, radius: number): Vec2 => {
  const distance = Math.hypot(offsetX, offsetY);
  if (distance <= radius || distance === 0) {
    return { x: offsetX, y: offsetY };
  }
  const ratio = radius / distance;
  return { x: offsetX * ratio, y: offsetY * ratio };
};

/**
 * Tells whether the on-screen controls should be shown. Phones and tablets
 * match `(pointer: coarse)` right away; on hybrid devices the last pointer
 * type used wins (touch shows the controls, mouse hides them).
 * Returns a getter for the current state.
 */
export const watchTouchUi = (onChange: (touch: boolean) => void): (() => boolean) => {
  const query = window.matchMedia("(pointer: coarse)");
  let touch = query.matches;
  const update = (value: boolean): void => {
    if (value !== touch) {
      touch = value;
      onChange(touch);
    }
  };
  query.addEventListener("change", (event) => update(event.matches));
  window.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "touch") {
        update(true);
      } else if (event.pointerType === "mouse") {
        update(false);
      }
    },
    { capture: true, passive: true }
  );
  onChange(touch);
  return () => touch;
};

export interface TouchControlsOptions {
  /** Surface that rotates the view when dragged (the 3D canvas). */
  lookSurface: HTMLElement;
  /** Joystick base: the touch area that controls movement. */
  stick: HTMLElement;
  /** Knob drawn inside the base. */
  knob: HTMLElement;
  /** True while the player can move (in the world, not paused, no console open). */
  isActive: () => boolean;
  /** Called with the finger movement, in CSS pixels, while dragging the look surface. */
  onLook: (deltaX: number, deltaY: number) => void;
}

export interface TouchControls {
  /** Current movement vector: x strafe, y forward, length 0..1. Do not mutate. */
  readonly move: Readonly<Vec2>;
  /** Releases the joystick and any look drag, e.g. when pausing. */
  reset: () => void;
}

export const createTouchControls = (options: TouchControlsOptions): TouchControls => {
  const { lookSurface, stick, knob, isActive, onLook } = options;
  const move: Vec2 = { x: 0, y: 0 };

  let stickPointer: number | null = null;
  let center: Vec2 = { x: 0, y: 0 };
  let radius = 1;

  let lookPointer: number | null = null;
  let lastX = 0;
  let lastY = 0;

  const capture = (element: HTMLElement, pointerId: number): void => {
    try {
      element.setPointerCapture(pointerId);
    } catch {
      // The pointer may already be gone; events still reach the element it started on.
    }
  };

  const drawKnob = (x: number, y: number): void => {
    knob.style.transform = `translate(${x}px, ${y}px)`;
  };

  const releaseStick = (): void => {
    stickPointer = null;
    move.x = 0;
    move.y = 0;
    drawKnob(0, 0);
    stick.classList.remove("active");
  };

  const updateStick = (event: PointerEvent): void => {
    const offsetX = event.clientX - center.x;
    const offsetY = event.clientY - center.y;
    const vector = joystickVector(offsetX, offsetY, radius);
    move.x = vector.x;
    move.y = vector.y;
    const shown = clampToRadius(offsetX, offsetY, radius);
    drawKnob(shown.x, shown.y);
  };

  stick.addEventListener("pointerdown", (event) => {
    if (!isActive() || stickPointer !== null) {
      return;
    }
    event.preventDefault();
    stickPointer = event.pointerId;
    const rect = stick.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    radius = rect.width / 2;
    capture(stick, event.pointerId);
    stick.classList.add("active");
    updateStick(event);
  });
  stick.addEventListener("pointermove", (event) => {
    if (event.pointerId === stickPointer) {
      updateStick(event);
    }
  });
  const endStick = (event: PointerEvent): void => {
    if (event.pointerId === stickPointer) {
      releaseStick();
    }
  };
  stick.addEventListener("pointerup", endStick);
  stick.addEventListener("pointercancel", endStick);
  stick.addEventListener("lostpointercapture", endStick);

  lookSurface.addEventListener("pointerdown", (event) => {
    // The mouse keeps using pointer lock; only fingers and pens drag to look.
    if (event.pointerType === "mouse" || !isActive() || lookPointer !== null) {
      return;
    }
    lookPointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    capture(lookSurface, event.pointerId);
  });
  lookSurface.addEventListener("pointermove", (event) => {
    if (event.pointerId !== lookPointer) {
      return;
    }
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (isActive()) {
      onLook(deltaX, deltaY);
    }
  });
  const endLook = (event: PointerEvent): void => {
    if (event.pointerId === lookPointer) {
      lookPointer = null;
    }
  };
  lookSurface.addEventListener("pointerup", endLook);
  lookSurface.addEventListener("pointercancel", endLook);
  lookSurface.addEventListener("lostpointercapture", endLook);

  return {
    move,
    reset: () => {
      lookPointer = null;
      releaseStick();
    }
  };
};
