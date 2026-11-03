# NASA 3D assets used in the PlayCanvas world

Source hub: [NASA 3D Resources](https://science.nasa.gov/3d-resources/)

The downloaded models are from NASA's public mirror, [NASA-3D-Resources](https://github.com/nasa/NASA-3D-Resources).

## Models

- `Astronaut.glb`
  - NASA mirror file: [`3D Models/Astronaut/Astronaut.glb`](https://github.com/nasa/NASA-3D-Resources/blob/master/3D%20Models/Astronaut/Astronaut.glb)
  - Used as the first-person player's actual 3D avatar (hidden from the first-person camera and visible in the optional third-person view), and as the menu-scene astronaut.
- `Crab-Nebula.glb`
  - NASA mirror file: [`3D Printing/Crab Nebula/Crab Nebula.glb`](https://github.com/nasa/NASA-3D-Resources/blob/master/3D%20Printing/Crab%20Nebula/Crab%20Nebula.glb)
  - Displayed as a distant science landmark in the lunar scene.

The frontend loads the local copies from `app/frontend/public/assets/nasa/`; it does not fetch models from GitHub at runtime.

## Usage and attribution

NASA's hub describes its 3D models as free to download and use. Follow the [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) and retain source attribution when redistributing the project.
