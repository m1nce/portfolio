export function driveState(scrollY, scrollableHeight, paused = false, previous = { progress: 0, distance: 0 }) {
  if (paused) return previous;
  const distance = Math.max(0, Math.min(scrollY, scrollableHeight));
  return { progress: scrollableHeight > 0 ? distance / scrollableHeight : 0, distance };
}

// Both the road and car use document-space Y, so the car stays on every bend.
export function roadPosition(y, width) {
  const roadWidth = Math.min(126, Math.max(52, width * 0.24));
  const amplitude = Math.max(0, Math.min(width * 0.23, (width - roadWidth) / 2 - 16));
  const bend = Math.max(160, width * 0.32);
  const phase = y / bend - 0.65;
  const slope = amplitude / bend * Math.cos(phase);
  return { x: width * 0.5 + amplitude * Math.sin(phase), angle: -Math.atan(slope) * 180 / Math.PI, roadWidth };
}
