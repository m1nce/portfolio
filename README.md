# Minchan Kim’s portfolio

SvelteKit portfolio with a freely drivable Three.js valley at `/world/`.

```sh
npm install
npm run dev
npm run check
```

Use WASD or arrow keys to drive, Down/S to brake and reverse, Space to stop, E to talk, M for the map, C to cycle cameras, and P to pause. The default camera looks down from above; High chase and Chase follow the car’s heading. On touch screens, point the joystick where you want to go in the current view. The map pins destinations; it does not move the car. Conversations pause the same world in place.

The stock green NB2 is a procedural prototype model. NPCs are original pixel drawings of a draft character cast. The homepage’s valley image is concept artwork; the playable scene uses real terrain and vehicle geometry.

Pushes to `main` run the build and checks, then publish to [GitHub Pages](https://m1nce.github.io/portfolio/).
