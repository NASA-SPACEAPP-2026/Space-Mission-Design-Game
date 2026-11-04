import * as pc from "playcanvas";
import { expect, test } from "vitest";
import { groundStep, thirdPersonCameraOffset } from "../src/movement";

// The camera in main.ts is oriented with setLocalEulerAngles(pitch, yaw, 0), so
// the expected directions come straight from the engine's own rotation.
const cameraAxes = (yawRadians: number) => {
  const rotation = new pc.Quat().setFromEulerAngles(0, yawRadians * pc.math.RAD_TO_DEG, 0);
  return {
    forward: rotation.transformVector(new pc.Vec3(0, 0, -1)),
    right: rotation.transformVector(new pc.Vec3(1, 0, 0))
  };
};

for (const yaw of [0, Math.PI / 6, Math.PI / 2, -Math.PI / 2, Math.PI, 2.4, -4]) {
  test(`forward and side input follow the camera at yaw ${yaw.toFixed(2)}`, () => {
    const { forward, right } = cameraAxes(yaw);

    const ahead = groundStep(yaw, 1, 0);
    expect(ahead.x).toBeCloseTo(forward.x);
    expect(ahead.z).toBeCloseTo(forward.z);

    const sideways = groundStep(yaw, 0, 1);
    expect(sideways.x).toBeCloseTo(right.x);
    expect(sideways.z).toBeCloseTo(right.z);

    const back = groundStep(yaw, -1, 0);
    expect(back.x).toBeCloseTo(-forward.x);
    expect(back.z).toBeCloseTo(-forward.z);
  });
}

test("a diagonal joystick push blends forward and right", () => {
  const yaw = Math.PI / 2; // looking towards -X
  const step = groundStep(yaw, 0.6, 0.8);
  expect(step.x).toBeCloseTo(-0.6);
  expect(step.z).toBeCloseTo(-0.8);
});

test("the third-person camera stays behind the view direction", () => {
  for (const yaw of [0, Math.PI / 3, Math.PI / 2, Math.PI, -2]) {
    const offset = thirdPersonCameraOffset(yaw, 5.2, 3.2);
    const forward = groundStep(yaw, 1, 0);
    expect(offset.x).toBeCloseTo(-forward.x * 5.2);
    expect(offset.z).toBeCloseTo(-forward.z * 5.2);
    expect(offset.y).toBe(3.2);
  }
});

test("at yaw 0 the third-person camera keeps its original position", () => {
  const offset = thirdPersonCameraOffset(0, 5.2, 3.2);
  expect(offset.x).toBeCloseTo(0);
  expect(offset.y).toBe(3.2);
  expect(offset.z).toBeCloseTo(5.2);
});
