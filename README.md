# Minchan Kim’s portfolio

SvelteKit portfolio with a freely drivable Three.js valley at `/world/`.

```sh
npm install
npm run dev
npm run check
```

Desktop: W/Up accelerates, A/D or Left/Right steers, S/Down or Space brakes. The car starts in first gear, ready to drive. Press **1–5** or click the H-pattern shifter to change gears; **R** selects reverse once stopped and **N** selects neutral. Clutch operation is automatic. Throttle and rev changes build gradually, and steering eases in with less response at higher speeds. The tachometer and optional engine sound follow the revs.

Speed comes from engine torque through the selected gear, gravity along the actual terrain, rolling resistance, and aerodynamic drag. Fifth can lose speed or roll backward on a climb when it lacks enough wheel torque. Lifting off in third gives stronger engine braking than fifth; neutral coasts freely under gravity. Automatic hill hold keeps an unattended car parked in gear until you press the gas, and the brake holds it on slopes. The signed grade beside the elevation shows the slope in the direction the car faces.

Stopping and shifting cannot stall or damage the engine. Unsafe downshifts and direction changes are rejected with a short hint to slow down; the current gear and momentum are preserved.

Compact and touch layouts keep automatic transmission, a small tachometer, and the screen-direction joystick.

E talks, M opens the map, C cycles Overhead → High chase → Chase, and P pauses. The map pins destinations without moving the car. Conversations pause the same world in place.

Explore 4.6 km of connected roads with switchbacks, ridges, a reservoir and four scenic turnouts. Contours on the map show the same terrain used by the renderer and driving surface. Roads span 88 m of elevation; buildings, trees, rocks and the reservoir edge stop the car.

The stock green NB2 is a procedural model with an open tan cockpit, fixed projector headlights, curved body panels and five-spoke wheels. NPCs are original pixel drawings of a draft character cast. The homepage’s valley image is concept artwork; the playable scene uses real terrain and vehicle geometry.

Pushes to `main` run the build and checks, then publish to [GitHub Pages](https://m1nce.github.io/portfolio/).
