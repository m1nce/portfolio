<script>
  import { WORLD_SIZE, ROADS, LANDMARKS, DISCOVERIES, WATER, MAP_TERRAIN, MAP_CONTOURS } from '$lib/worldMap.js';
  export let car;
  export let destinationId = null;
  export let compact = false;
  export let found = [];
  const half = WORLD_SIZE / 2;
  const roads = ROADS.map(points => points.map(p => `${p.x},${p.z}`).join(' '));
  const terrain = MAP_TERRAIN;
  const contours = MAP_CONTOURS;
  $: arrowSize = compact ? 22 : 16;
</script>

<svg viewBox="{-half} {-half} {WORLD_SIZE} {WORLD_SIZE}" role="img" aria-label="Mountain map with elevation contours, switchbacks, reservoir, character stops and scenic turnouts. The green arrow shows your position.">
  <rect x={-half} y={-half} width={WORLD_SIZE} height={WORLD_SIZE} fill="#d8d7b9" />
  {#each terrain as band}<path d={band.path} fill={band.fill} />{/each}
  {#each contours as contour}<path d={contour.path} fill="none" stroke="#67745b" stroke-opacity={compact ? .25 : .4} stroke-width={compact ? 1.8 : 1} />{/each}
  {#each WATER as lake}<ellipse cx={lake.x} cy={lake.z} rx={lake.rx} ry={lake.rz} fill="#88adb0" stroke="#658d91" stroke-width="3" />{/each}
  {#each roads as points}
    <polyline {points} fill="none" stroke="#f7f0d9" stroke-width={compact ? 12 : 10} stroke-linejoin="round" />
    <polyline {points} fill="none" stroke="#716d57" stroke-width={compact ? 6 : 5} stroke-linejoin="round" />
  {/each}
  {#each DISCOVERIES as place}
    <g transform="translate({place.x} {place.z})">
      {#if destinationId === place.id}<circle r="25" fill="none" stroke="#b15c35" stroke-width="4" />{/if}
      <path d="M0-11 11 0 0 11-11 0Z" fill={found.includes(place.id) ? '#355e43' : '#f4ebce'} stroke="#486348" stroke-width="3" />
    </g>
  {/each}
  {#each LANDMARKS as place, i}
    <circle cx={place.x} cy={place.z} r={destinationId === place.id ? 23 : 15} fill="#faf8e9" stroke={destinationId === place.id ? '#b15c35' : '#335341'} stroke-width="3" />
    {#if !compact}<text x={place.x} y={place.z + 5} text-anchor="middle" fill="#233c2e" font-size="15" font-weight="700">{i + 1}</text>{/if}
  {/each}
  <g transform="translate({car.x} {car.z}) rotate({car.heading * 180 / Math.PI})">
    <path d="M0 {-arrowSize} {arrowSize * .65} {arrowSize * .7} 0 {arrowSize * .35} {-arrowSize * .65} {arrowSize * .7}Z" fill="#214c35" stroke="#fffced" stroke-width="3" />
  </g>
  {#if !compact}<text x={half - 55} y={-half + 50} fill="#335341" font-size="24" text-anchor="middle">N ↑</text>{/if}
</svg>

<style>svg { display: block; width: 100%; height: 100%; }</style>
