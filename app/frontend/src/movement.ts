/**
 * Ground-plane movement for the first-person controls.
 *
 * PlayCanvas cameras look down -Z, and a positive yaw (rotation around +Y)
 * turns them to the left. Rotating the camera's forward (0, 0, -1) and right
 * (1, 0, 0) vectors by that yaw gives:
 *   forward = (-sin(yaw), -cos(yaw))
 *   right   = ( cos(yaw), -sin(yaw))
 * so "forward" input always moves where the camera is looking.
 */
export const groundStep = (
  yaw: number,
  forwardInput: number,
  sideInput: number
): { x: number; z: number } => {
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  return {
    x: -sin * forwardInput + cos * sideInput,
    z: -cos * forwardInput - sin * sideInput
  };
};

/**
 * Where the third-person camera sits relative to the player: `distance`
 * behind the direction the camera is looking (the opposite of the forward
 * vector above) and `height` above the ground, so it orbits the astronaut as
 * the view turns.
 */
export const thirdPersonCameraOffset = (
  yaw: number,
  distance: number,
  height: number
): { x: number; y: number; z: number } => ({
  x: Math.sin(yaw) * distance,
  y: height,
  z: Math.cos(yaw) * distance
});
