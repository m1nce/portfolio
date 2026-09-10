# Minchan Kim’s portfolio

SvelteKit portfolio with a freely drivable Three.js valley at `/world/`.

```sh
npm install
npm run dev
npm run check
```

Desktop: W/Up accelerates, A/D or Left/Right steers, S/Down or Space brakes. The car starts idling in neutral. Hold **Shift** for the clutch, select **1–5** or **R**, add gas, then release Shift to engage. **N** selects neutral. The animated H-pattern lever follows each accepted shift; the tachometer follows engine RPM, including free revving with the clutch down.

Shifting without the clutch grinds and briefly interrupts power. Stopping in gear without the clutch, or trying to pull away in too high a gear, can stall the engine; hold the clutch or select neutral and press **I** to restart. Releasing the clutch after a mechanically unsafe downshift over-revs and damages the engine: return to the garage to repair it. These are game events, with no counters. Optional engine sound includes grinding and stall feedback.

Compact and touch layouts keep automatic transmission, a small tachometer, and the screen-direction joystick.

E talks, M opens the map, C cycles Overhead → High chase → Chase, and P pauses. The map pins destinations without moving the car. Conversations pause the same world in place.

Explore 4.6 km of connected roads with switchbacks, ridges, a reservoir and four scenic turnouts. Contours on the map show the same terrain used by the renderer and driving surface. Roads span 88 m of elevation; buildings, trees, rocks and the reservoir edge stop the car.

The stock green NB2 is a procedural model with an open tan cockpit, fixed projector headlights, curved body panels and five-spoke wheels. NPCs are original pixel drawings of a draft character cast. The homepage’s valley image is concept artwork; the playable scene uses real terrain and vehicle geometry.

Pushes to `main` run the build and checks, then publish to [GitHub Pages](https://m1nce.github.io/portfolio/).
