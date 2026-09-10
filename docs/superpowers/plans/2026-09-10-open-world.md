# Playable open-world portfolio

Approved: build the browser prototype after the Figma exploration (file mSMLMpMc8wMwBJ2AeWyuix, page 52:144).

## Scope
One continuous Southern California valley, a stock British green NB2 MX-5, connected roads and free roaming. Pixel-art Oak, Takumi and Hamilton are a draft cast. Conversations reveal existing portfolio facts without moving the car. No League of Legends. A conventional homepage offers all portfolio information without playing.

## Contracts
- `world.js`: `WORLD_SIZE=360`, `SPAWN={x:-65,z:80,heading:0,speed:0}`, `ROADS` array of arrays of `{x,z}` (already sampled points; renderer/map use these directly), `ROAD_WIDTH=9`, `LANDMARKS` array `{id,name,place,x,z,color,description,topics:[{label,text,link?,linkLabel?}]}`, `OBSTACLES` array `{x,z,radius,kind}`. Exports `terrainHeight(x,z)`, `roadDistance(x,z)`, `stepWorldCar(state,input,dt)`, `joystickInput(x,y)`, `nearestLandmark(state)`.
- Heading 0 is north (-Z), pi/2 east (+X). Input `{throttle: -1..1, steering:-1..1, brake:boolean, targetHeading?:number}`. Positive steering turns right while travelling forward. Joystick uses x right and y down; maps to targetHeading with no camera rotation. World bounds +/-180. State immutable `{x,z,heading,speed}`; dt capped .05. `nearestLandmark` returns landmark within 14 units only when speed <3.
- `worldScene.js`: `createWorldScene(canvas)` returns `{render(state,dt), resize(width,height), destroy()}`. Fixed camera yaw, looking north from south; world X projects right. Follow camera must stay still for render(state,0), except initial placement. Real terrain/roads/car geometry; nearest-filtered pixel NPC sprites. Imports shared model and Three.js.
- `/world/` Svelte page owns input/RAF, keyboard arrows/WASD and screen-direction phone joystick, pause, map, native dialogue; releases input on blur/visibility/modal. Map and talk freeze position and camera. Native controls and portfolio fallback.
- `/` conventional portfolio reuses existing facts/data/styles, leads to `/world/`. Layout suppresses global header on world only.

## Implementation and verification
1. Pure driving model plus assert-based checks for 360-degree travel, reverse, joystick directions, boundaries, collisions, time-step cap and interaction radius.
2. Three.js renderer with warm lit terrain, loop roads, landmarks, recognizable stock car, pixel NPCs and bounded mobile rendering cost.
3. Structured homepage and game interface, in-place dialogue and live map.
4. Build, model checks, browser verify desktop/mobile movement, pause/dialog stability, asset paths and conventional content. Independent review and fix material issues.
5. Publish through existing GitHub Pages workflow and verify the public route.
