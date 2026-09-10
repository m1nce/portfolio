# Minchan Kim’s portfolio

SvelteKit portfolio with a freely drivable Three.js valley at `/world/`.

```sh
npm install
npm run dev
npm run check
```

Desktop: W/Up accelerates, A/D or Left/Right steers, S/Down or Space brakes. The car starts in first gear, ready to drive. Press **1–5** or click the H-pattern shifter to change gears; **R** selects reverse once stopped and **N** selects neutral. Clutch operation is automatic. Throttle and rev changes build gradually, and steering eases in with less response at higher speeds. The tachometer and optional engine sound follow the revs.

Speed comes from engine torque through the selected gear, gravity along the actual terrain, rolling resistance, and aerodynamic drag. Fifth can lose speed or roll backward on a climb when it lacks enough wheel torque. Lifting off in third gives stronger engine braking than fifth; neutral coasts freely under gravity. Automatic hill hold keeps the running car parked in gear until you press the gas. A stalled car can roll; the brake holds it on slopes. The signed grade beside the elevation shows the slope in the direction the car faces.

After driving, coming to a stop in **1–5 or R** stalls the engine: the revs fall to zero and the wheels lose engine power. Select **N** before stopping to keep it idling. If it stalls, stop the car and press **I** or click **Start engine**; the starter cranks briefly before the engine catches. Restarting uses automatic clutch assistance. Unsafe downshifts and direction changes are still rejected with a short hint; there is no damage lockout.

Compact and touch layouts keep automatic transmission without stalling, a small tachometer, and the screen-direction joystick. Engine sound is optional on both layouts; the pause menu includes the sound toggle and [recording credits](static/audio/CREDITS.md).

The engine audio blends three locally hosted MX-5 recording loops by RPM and throttle, with separate starter and shutdown samples. The five clips total about 239 KB and load only when sound is enabled. The rev source has an HKS exhaust and is filtered for a softer sound; it is an adapted MX-5 sound, not an exact stock NB2 recording set. Sources, licenses and edits are listed in the credits.

E talks, M opens the map, C cycles Overhead → High chase → Chase, and P pauses. The map pins destinations without moving the car. Conversations pause the same world in place.

Explore 4.6 km of connected roads with switchbacks, ridges, a reservoir and four scenic turnouts. Contours on the map show the same terrain used by the renderer and driving surface. Roads span 88 m of elevation; buildings, trees, rocks and the reservoir edge stop the car.

The stock green NB2 is a procedural model with an open tan cockpit, fixed projector headlights, curved body panels and five-spoke wheels. NPCs are original pixel drawings of a draft character cast. The homepage’s valley image is concept artwork; the playable scene uses real terrain and vehicle geometry.

Pushes to `main` run the build and checks, then publish to [GitHub Pages](https://m1nce.github.io/portfolio/).
