<script>
  export let rpm = 850;
  export let gear = 1;
  export let speed = 0;
  export let event = '';
  export let eventTime = 0;
  export let disabled = false;
  export let compact = false;
  export let onGear = () => {};

  const gates = [
    { gear: 1, x: 24, y: 30 }, { gear: 2, x: 24, y: 108 },
    { gear: 3, x: 66, y: 30 }, { gear: 4, x: 66, y: 108 },
    { gear: 5, x: 108, y: 30 }, { gear: 'R', x: 108, y: 108 },
    { gear: 'N', x: 66, y: 69 }
  ];
  const point = (angle, radius) => ({
    x: 80 + Math.sin(angle * Math.PI / 180) * radius,
    y: 80 - Math.cos(angle * Math.PI / 180) * radius
  });
  const ticks = Array.from({ length: 46 }, (_, i) => ({
    outer: point(-135 + i * 6, 65),
    inner: point(-135 + i * 6, i % 5 === 0 ? 54 : 60),
    major: i % 5 === 0, red: i >= 35
  }));
  const numerals = Array.from({ length: 10 }, (_, i) => ({ ...point(-135 + i * 30, 44), value: i }));
  let previousGear = gear;
  let leverFrom = gates.find(gate => gate.gear === gear) || gates[6];
  let hasShifted = false;
  $: leverTo = gates.find(gate => gate.gear === gear) || gates[6];
  $: if (gear !== previousGear) {
    leverFrom = gates.find(gate => gate.gear === previousGear) || gates[6];
    previousGear = gear;
    hasShifted = true;
  }
  $: shownRPM = Math.max(0, Math.round(Number.isFinite(rpm) ? rpm : 0));
  $: needleAngle = -135 + Math.min(shownRPM, 9000) / 9000 * 270;
  $: blocked = eventTime > 0 && !!event;
  $: status = blocked ? event === 'direction-blocked' ? 'Stop before changing direction.' : 'Slow down before choosing that gear.'
    : gear === 'N' ? 'Neutral' : 'Press a gear to shift.';
</script>

<section class="instruments" class:compact aria-label={compact ? 'Driving instruments' : 'Manual transmission instruments'}>
  <div class="tachometer">
    <svg viewBox="0 0 160 160" role="img" aria-label={`Tachometer: ${shownRPM.toLocaleString()} RPM${compact ? `, ${Math.round(Math.abs(speed) * 3.6)} kilometres per hour` : ''}`}>
      <circle class="bezel" cx="80" cy="80" r="77" />
      <circle class="face" cx="80" cy="80" r="72" />
      <path class="redline-band" d="M 146.65 62.14 A 69 69 0 0 1 128.79 128.79" />
      {#each ticks as mark}
        <line class:redline={mark.red} class:major={mark.major} x1={mark.outer.x} y1={mark.outer.y} x2={mark.inner.x} y2={mark.inner.y} />
      {/each}
      {#each numerals as number}<text class="numeral" x={number.x} y={number.y + 4}>{number.value}</text>{/each}
      <text class="unit" x="80" y="54">×1000 r/min</text>
      <g class="needle" style:transform={`rotate(${needleAngle}deg)`}>
        <path d="M 80 18 L 82.6 87 L 80 94 L 77.4 87 Z" />
      </g>
      <circle class="hub" cx="80" cy="80" r="7" />
      <circle class="hub-center" cx="80" cy="80" r="3" />
      <text class="digital-rpm" x="80" y="113">{shownRPM.toLocaleString()}</text>
      <text class="unit" x="80" y="124">RPM</text>
      {#if compact}<text class="compact-speed" x="80" y="145">{Math.round(Math.abs(speed) * 3.6)} <tspan>km/h</tspan></text>
      {:else}<text class="model" x="80" y="146">MX-5</text>{/if}
    </svg>
  </div>

  {#if !compact}
    <div class="shifter">
      <span class="shifter-label">5-speed manual</span>
      <div class="gearbox">
        <svg viewBox="0 0 132 138" aria-hidden="true">
          <rect class="shift-plate" x="3" y="8" width="126" height="123" rx="24" />
          <path class="gate-shadow" d="M24 30V108 M66 30V108 M108 30V108 M24 69H108" />
          <path class="gate-track" d="M24 30V108 M66 30V108 M108 30V108 M24 69H108" />
          <ellipse class="lever-boot" cx="66" cy="77" rx="20" ry="15" />
          {#key gear}
            <line class="lever-shaft" class:shaft-moving={hasShifted} x1="66" y1="77" x2={leverTo.x} y2={leverTo.y} />
            <g class="lever" class:moving={hasShifted} style={`--from-x: ${leverFrom.x}px; --from-y: ${leverFrom.y}px; --to-x: ${leverTo.x}px; --to-y: ${leverTo.y}px; transform: translate(${leverTo.x}px, ${leverTo.y}px);`}>
              <circle class="knob-edge" r="15" />
              <circle class="knob-top" cy="-1" r="12" />
              <path class="knob-pattern" d="M-5 -6V5 M0 -6V5 M5 -6V5 M-5 0H5" />
            </g>
          {/key}
        </svg>
        {#each gates as gate}
          <button class="gear-position" class:selected={gear === gate.gear} class:neutral={gate.gear === 'N'}
            style:left={`${gate.x / 132 * 100}%`} style:top={`${gate.y / 138 * 100}%`}
            aria-label={gate.gear === 'N' ? 'Select neutral' : gate.gear === 'R' ? 'Select reverse gear' : `Select gear ${gate.gear}`}
            aria-pressed={gear === gate.gear} {disabled} on:click={() => onGear(gate.gear)}>{gate.gear}</button>
        {/each}
      </div>
    </div>

    <div class="drive-state">
      <div class="speed"><strong>{Math.round(Math.abs(speed) * 3.6)}</strong><span>km/h</span><b aria-label={`Current gear ${gear}`}>{gear}</b></div>
      <p class="assist-label">Assisted shifting</p>
      <p class="engine-state" class:warning={blocked} role="status">{status}</p>
      <span class="shift-guide"><kbd>1–5</kbd> gears · <kbd>R</kbd> reverse</span>
    </div>
  {/if}
</section>

<style>
  .instruments { box-sizing: border-box; display: flex; align-items: center; gap: 12px; width: 488px; max-width: 100%; padding: 12px; border: 1px solid #676d66; border-radius: 10px; background: #222722f5; color: #f1eedc; box-shadow: inset 0 1px #b5b6a626, 0 4px 14px #17201922; pointer-events: auto; font-family: 'DM Sans', sans-serif; }
  .tachometer { width: 160px; height: 160px; flex: 0 0 160px; }
  svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .bezel { fill: #151b18; stroke: #848b7e; stroke-width: 1.5; }.face { fill: #222622; stroke: #454d43; stroke-width: 1; }
  .redline-band { fill: none; stroke: #b94b35; stroke-width: 4; }
  line { stroke: #dfdfcb; stroke-width: 1; }.major { stroke-width: 2; }.redline { stroke: #ec795e; }
  text { text-anchor: middle; fill: #eeeedd; font-family: 'DM Sans', sans-serif; font-variant-numeric: tabular-nums; }
  .numeral { font-size: 12px; font-weight: 500; }.unit { font-size: 6px; letter-spacing: .06em; fill: #bec5b7; }.digital-rpm { font-size: 15px; }.model { font-size: 9px; font-style: italic; letter-spacing: .06em; fill: #afb9a7; }
  .needle { transform-origin: 80px 80px; transition: transform 70ms linear; }.needle path { fill: #fa6c46; }.hub { fill: #111813; stroke: #707766; stroke-width: 1; }.hub-center { fill: #424b3f; }
  .shifter { width: 132px; flex: 0 0 132px; align-self: stretch; }.shifter-label { display: block; text-align: center; font-size: 9px; color: #b5bbaa; line-height: 19px; }
  .gearbox { height: 138px; position: relative; }.shift-plate { fill: #30362f; stroke: #535c4d; }.gate-shadow { stroke: #161b16; stroke-width: 10; fill: none; stroke-linecap: round; }.gate-track { stroke: #505846; stroke-width: 2; fill: none; stroke-linecap: round; }
  .lever-boot { fill: #252c24; stroke: #47503f; }.lever-shaft { stroke: #9b9f91; stroke-width: 5; }.knob-edge { fill: #141b15; stroke: #79806e; stroke-width: 1; }.knob-top { fill: #313c2c; }.knob-pattern { fill: none; stroke: #b4b9a6; stroke-width: .7; }
  .gear-position { position: absolute; transform: translate(-50%, -50%); display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #f3eed9; font: 500 14px 'DM Sans', sans-serif; cursor: pointer; text-shadow: 0 1px 3px #111; }
  .gear-position.selected { color: #fff8dc; font-weight: 700; }.gear-position:hover { background: #e8efd014; }.gear-position.neutral { width: 30px; height: 30px; font-size: 10px; }.gear-position:disabled { cursor: default; }
  button:focus-visible { outline: 2px solid #ead194; outline-offset: 3px; }
  .moving { animation: shift-gate 240ms ease-in-out; }
  .shaft-moving { animation: lift-shaft 240ms linear; }
  @keyframes lift-shaft { 0%, 99% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes shift-gate { 0% { transform: translate(var(--from-x), var(--from-y)); } 32% { transform: translate(var(--from-x), 69px); } 66% { transform: translate(var(--to-x), 69px); } 100% { transform: translate(var(--to-x), var(--to-y)); } }
  .drive-state { width: 148px; min-width: 0; align-self: stretch; display: flex; flex-direction: column; }
  .speed { display: flex; align-items: baseline; gap: 4px; padding: 0 0 8px; }.speed strong { font: 500 30px/1 'DM Sans', sans-serif; font-variant-numeric: tabular-nums; }.speed span { color: #bec5b7; font-size: 9px; }.speed b { display: grid; place-items: center; margin-left: auto; width: 30px; height: 30px; border: 1px solid #666e5d; border-radius: 4px; font-size: 20px; font-weight: 500; }
  .assist-label { margin: 13px 0 0; color: #d4ddc7; font-size: 11px; }
  kbd { font: 9px 'DM Sans', sans-serif; white-space: nowrap; border: 1px solid #83916b80; border-radius: 2px; padding: 1px 3px; }
  .engine-state { margin: 8px 0 5px; min-height: 26px; font-size: 10px; line-height: 1.35; color: #bdc9ad; }.engine-state.warning { color: #ffc393; }
  .shift-guide { margin-top: auto; color: #afb9a7; font-size: 8px; line-height: 1.8; white-space: nowrap; }.shift-guide kbd { font-size: 8px; padding: 0 2px; }
  .compact { width: 104px; padding: 0; border: 0; border-radius: 50%; background: transparent; box-shadow: none; pointer-events: none; }.compact .tachometer { width: 104px; height: 104px; flex-basis: 104px; }.compact .digital-rpm { font-size: 18px; }.compact-speed { font-size: 22px; }.compact-speed tspan { font-size: 8px; }.compact .model { display: none; }
  @media (prefers-reduced-motion: reduce) { .needle { transition: none; }.moving, .shaft-moving { animation: none; } }
</style>
