<script>
  import { onMount } from 'svelte';

  let canvas;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let W, H, raf;

    function resize() {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    let t = 0;

    function sig(x) {
      return (
        Math.sin(x * 0.034 + t * 0.5) * 0.42 +
        Math.sin(x * 0.079 + t * 0.3 + 1.3) * 0.28 +
        Math.sin(x * 0.019 + t * 0.2 + 3.1) * 0.30
      );
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const mid = H / 2;
      const amp = H * 0.36;

      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0,   'oklch(72% 0.14 185 / 0.1)');
      grad.addColorStop(0.25, 'oklch(72% 0.14 185 / 0.85)');
      grad.addColorStop(0.75, 'oklch(72% 0.14 185 / 0.85)');
      grad.addColorStop(1,   'oklch(72% 0.14 185 / 0.1)');

      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const y = mid + sig(x) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      t += 0.4;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  });
</script>

<canvas bind:this={canvas} class="signal-canvas" aria-hidden="true"></canvas>

<style>
  .signal-canvas {
    width: 100%;
    height: 64px;
    display: block;
  }
</style>
