# Minchan Kim’s portfolio

SvelteKit portfolio with a freely drivable Three.js valley at `/world/`.

```sh
npm install
npm run dev
npm run check
```

Desktop: W/Up accelerates, A/D or Left/Right steers, S/Down or Space brakes. Select manual gears with **1–5** and **R** for reverse when stopped, then use W/Up to accelerate in that gear. Higher gears trade launch acceleration for speed. Compact and touch layouts use automatic transmission with a joystick: point where you want to go in the current view.

E talks, M opens the map, C cycles Overhead → High chase → Chase, and P pauses. The map pins destinations without moving the car. Conversations pause the same world in place.

Explore 4.6 km of connected roads with switchbacks, ridges, a reservoir and four scenic turnouts. Contours on the map show the same terrain used by the renderer and driving surface. Roads span 88 m of elevation; buildings, trees, rocks and the reservoir edge stop the car.

The stock green NB2 is a procedural model with an open tan cockpit, fixed projector headlights, curved body panels and five-spoke wheels. NPCs are original pixel drawings of a draft character cast. The homepage’s valley image is concept artwork; the playable scene uses real terrain and vehicle geometry.

Pushes to `main` run the build and checks, then publish to [GitHub Pages](https://m1nce.github.io/portfolio/).
