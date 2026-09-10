import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Metres, Y up, nose toward -Z. The open cabin and wheel arches are cut into
// the body surfaces; the renderer can rotate the four wheel groups independently.
export function createNB2() {
  const car = new THREE.Group();
  car.name = 'Stock British green NB2 MX-5';
  const material = (name, color, options = {}) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...options });
    result.name = name;
    return result;
  };
  const paint = material('British racing green', '#13533e', { metalness: 0.48, roughness: 0.27, side: THREE.DoubleSide });
  const trim = material('Black trim', '#17211d', { roughness: 0.83 });
  const rubber = material('Tire rubber', '#222522', { roughness: 0.95 });
  const silver = material('OEM silver alloy', '#c4cac3', { metalness: 0.78, roughness: 0.25 });
  const chrome = material('Chrome details', '#e2e6df', { metalness: 0.85, roughness: 0.16 });
  const leather = material('Tan leather', '#ba9059', { roughness: 0.87 });
  const leatherDark = material('Tan seat inset', '#927049');
  const lens = material('Headlamp lens', '#d8e4d5', { metalness: 0.28, roughness: 0.13 });
  const lampDark = material('Headlamp housing', '#353d37', { metalness: 0.35, roughness: 0.3 });
  const red = material('Rear lamps', '#b4312b', { metalness: 0.2, roughness: 0.25 });
  const amber = material('Amber indicators', '#dc8c39', { roughness: 0.3 });
  const glass = material('Windshield glass', '#b9d1c5', { metalness: 0.08, roughness: 0.1, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
  const staticParts = [];
  function mesh(name, geometry, mat, parent = car) {
    const object = new THREE.Mesh(geometry, mat);
    object.name = name;
    object.castShadow = mat !== glass;
    object.receiveShadow = true;
    parent.add(object);
    if (parent === car) staticParts.push(object);
    return object;
  }
  function box(name, mat, size, position, parent = car) {
    const object = mesh(name, new THREE.BoxGeometry(...size), mat, parent);
    object.position.set(...position);
    return object;
  }
  function ellipsoid(name, mat, size, position, parent = car) {
    const object = mesh(name, new THREE.SphereGeometry(1, 16, 10), mat, parent);
    object.scale.set(...size);
    object.position.set(...position);
    return object;
  }
  function beam(name, mat, from, to, radius, parent = car) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const object = mesh(name, new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), mat, parent);
    object.position.copy(a).add(b).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return object;
  }
  function surface(name, mat, uCount, vCount, point) {
    const vertices = [], indices = [];
    for (let u = 0; u <= uCount; u++) for (let v = 0; v <= vCount; v++) vertices.push(...point(u / uCount, v / vCount));
    for (let u = 0; u < uCount; u++) for (let v = 0; v < vCount; v++) {
      const a = u * (vCount + 1) + v, b = a + vCount + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(name, geometry, mat);
  }
  const sections = [
    [-1.97, 0.63, 0.53], [-1.79, 0.77, 0.65], [-1.45, 0.815, 0.73],
    [-1.13, 0.84, 0.78], [-0.6, 0.80, 0.75], [0, 0.79, 0.735],
    [0.69, 0.82, 0.76], [1.13, 0.84, 0.795], [1.64, 0.80, 0.75], [1.97, 0.65, 0.61],
  ];
  function section(z) {
    const found = sections.findIndex((item) => item[0] >= z);
    const i = found < 0 ? sections.length - 2 : Math.max(0, found - 1);
    const a = sections[i], b = sections[i + 1];
    const before = sections[Math.max(0, i - 1)], after = sections[Math.min(sections.length - 1, i + 2)];
    const span = b[0] - a[0], t = THREE.MathUtils.clamp((z - a[0]) / span, 0, 1);
    return [1, 2].map((axis) => {
      const slopeA = (b[axis] - before[axis]) / (b[0] - before[0]);
      const slopeB = (after[axis] - a[axis]) / (after[0] - a[0]);
      return (2 * t ** 3 - 3 * t ** 2 + 1) * a[axis] + (t ** 3 - 2 * t ** 2 + t) * slopeA * span
        + (-2 * t ** 3 + 3 * t ** 2) * b[axis] + (t ** 3 - t ** 2) * slopeB * span;
    });
  }
  const topHeight = (z, across) => section(z)[1] - (1 - across * across) * (z < -0.6 ? 0.055 : 0.025);
  function archBottom(z) {
    let bottom = 0.205;
    for (const wheelZ of [-1.13, 1.13]) {
      const distance = Math.abs(z - wheelZ);
      if (distance < 0.385) bottom = Math.max(bottom, 0.323 + Math.sqrt(0.385 ** 2 - distance ** 2));
    }
    return bottom;
  }
  for (const side of [-1, 1]) {
    surface('Shaped fender and door skin', paint, 180, 5, (u, v) => {
      const z = -1.97 + u * 3.94, [width, top] = section(z), lower = archBottom(z);
      const bevel = Math.sin(v * Math.PI / 2) * 0.065;
      return [side * width * (0.94 + bevel), THREE.MathUtils.lerp(top, lower, v), z];
    });
    // A narrow shoulder surrounds the open interior instead of a solid roof slab.
    surface('Door upper shoulder', paint, 40, 5, (u, v) => {
      const z = -0.56 + u * 1.4, width = section(z)[0];
      const x = THREE.MathUtils.lerp(0.635, width * 0.94, v);
      return [side * x, topHeight(z, x / (width * 0.94)), z];
    });
    surface('Inner door panel', leather, 24, 3, (u, v) => {
      const z = -0.53 + u * 1.34;
      return [side * (0.635 - v * 0.015), THREE.MathUtils.lerp(topHeight(z, 0.8) - 0.02, 0.34, v), z];
    });
    beam('Door belt weatherstrip', trim, [side * 0.637, 0.735, -0.5], [side * 0.637, 0.742, 0.79], 0.016);
    box('Door pull', trim, [0.035, 0.044, 0.21], [side * 0.612, 0.62, 0.02]);
    box('Stock silver door handle', silver, [0.017, 0.037, 0.115], [side * 0.802, 0.685, 0.48]);
    beam('Rocker sill', paint, [side * 0.795, 0.22, -0.70], [side * 0.803, 0.22, 0.70], 0.047);
    // Thin painted lips give the openings a continuous rounded fender edge.
    const archPoints = [];
    for (const wheelZ of [-1.13, 1.13]) {
      archPoints.length = 0;
      for (let i = 0; i <= 24; i++) {
        const angle = i / 24 * Math.PI, z = wheelZ + Math.cos(angle) * 0.385;
        archPoints.push(new THREE.Vector3(side * section(z)[0] * 1.002, 0.323 + Math.sin(angle) * 0.385, z));
      }
      mesh('Rounded wheel arch lip', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints), 24, 0.018, 5, false), paint);
      const liner = mesh('Dark inner wheelhouse', new THREE.CircleGeometry(0.382, 24, 0, Math.PI), trim);
      liner.rotation.y = side * Math.PI / 2;
      liner.position.set(side * 0.688, 0.323, wheelZ);
    }
  }
  for (const [start, end, name] of [[-1.97, -0.56, 'Long sculpted bonnet'], [0.84, 1.97, 'Short rear deck']]) {
    surface(name, paint, 50, 20, (u, v) => {
      const z = THREE.MathUtils.lerp(start, end, u), across = v * 2 - 1;
      return [across * section(z)[0] * 0.94, topHeight(z, across), z];
    });
  }
  for (const z of [-1.97, 1.97]) {
    surface('Rounded bumper face', paint, 22, 8, (u, v) => {
      const across = u * 2 - 1;
      return [across * section(z)[0] * (0.94 + Math.sin(v * Math.PI / 2) * 0.065), THREE.MathUtils.lerp(topHeight(z, across), 0.205, v), z + Math.sign(z) * Math.sin(v * Math.PI) * (1 - across * across) * 0.035];
    });
  }
  box('Recessed cockpit floor', trim, [1.24, 0.065, 1.31], [0, 0.295, 0.145]);
  box('Rear cabin bulkhead', leather, [1.26, 0.34, 0.09], [0, 0.54, 0.8]);
  ellipsoid('Folded black fabric roof', trim, [0.655, 0.075, 0.16], [0, 0.806, 0.89]);
  for (const z of [0.81, 0.9, 0.98]) beam('Folded roof seams', trim, [-0.56, 0.872, z], [0.56, 0.872, z], 0.012);
  for (const x of [-0.32, 0.32]) {
    ellipsoid('Tan seat cushion', leather, [0.225, 0.074, 0.235], [x, 0.45, 0.29]);
    ellipsoid('Seat cushion inset', leatherDark, [0.15, 0.025, 0.19], [x, 0.505, 0.27]);
    const seatShape = new THREE.Shape();
    seatShape.moveTo(-0.17, 0);
    seatShape.quadraticCurveTo(-0.224, 0.025, -0.207, 0.24);
    seatShape.quadraticCurveTo(-0.195, 0.36, -0.13, 0.375);
    seatShape.lineTo(-0.129, 0.49);
    seatShape.quadraticCurveTo(-0.125, 0.54, -0.075, 0.54);
    seatShape.lineTo(0.075, 0.54);
    seatShape.quadraticCurveTo(0.125, 0.54, 0.129, 0.49);
    seatShape.lineTo(0.13, 0.375);
    seatShape.quadraticCurveTo(0.195, 0.36, 0.207, 0.24);
    seatShape.quadraticCurveTo(0.224, 0.025, 0.17, 0);
    seatShape.closePath();
    const back = mesh('Stock seat with integrated headrest', new THREE.ExtrudeGeometry(seatShape, { depth: 0.075, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 2, curveSegments: 8, steps: 1 }), leather);
    back.position.set(x, 0.47, 0.485); back.rotation.x = 0.11;
    const inset = ellipsoid('Seat back inset', leatherDark, [0.138, 0.147, 0.013], [x, 0.673, 0.472]);
    inset.rotation.x = 0.11;
    beam('Seatbelt', trim, [x - 0.18, 0.5, 0.45], [x - 0.18, 0.96, 0.6], 0.012);
  }
  ellipsoid('Dashboard', trim, [0.638, 0.14, 0.185], [0, 0.702, -0.416]);
  ellipsoid('Instrument binnacle', trim, [0.198, 0.115, 0.13], [-0.32, 0.807, -0.39]);
  box('Center console', trim, [0.165, 0.115, 0.73], [0, 0.457, 0.17]);
  box('Center stack', trim, [0.205, 0.225, 0.09], [0, 0.634, -0.259]).rotation.x = -0.13;
  box('Radio face', silver, [0.142, 0.038, 0.012], [0, 0.66, -0.202]);
  for (const x of [-0.046, 0.046]) ellipsoid('Round center vent', lampDark, [0.027, 0.027, 0.01], [x, 0.727, -0.205]);
  beam('Gear shift', silver, [0, 0.516, -0.04], [0, 0.62, -0.055], 0.014);
  ellipsoid('Five speed gear knob', trim, [0.032, 0.031, 0.03], [0, 0.634, -0.055]);
  beam('Handbrake', trim, [0.07, 0.51, 0.23], [0.07, 0.55, 0.07], 0.022);
  beam('Steering column', trim, [-0.32, 0.63, -0.36], [-0.32, 0.77, -0.13], 0.026);
  const steeringWheel = mesh('Three spoke steering wheel', new THREE.TorusGeometry(0.143, 0.017, 7, 22), trim);
  steeringWheel.position.set(-0.32, 0.77, -0.13);
  steeringWheel.rotation.x = -0.38;
  for (const angle of [Math.PI / 6, Math.PI * 5 / 6, Math.PI * 3 / 2]) {
    beam('Steering wheel spoke', trim, [-0.32, 0.77, -0.13], [-0.32 + Math.cos(angle) * 0.137, 0.77 + Math.sin(angle) * 0.127, -0.13 - Math.sin(angle) * 0.05], 0.012);
  }
  ellipsoid('Steering wheel hub', trim, [0.048, 0.043, 0.018], [-0.32, 0.77, -0.114]);
  surface('Raked transparent windshield', glass, 10, 4, (u, v) => {
    const across = u * 2 - 1, halfWidth = THREE.MathUtils.lerp(0.68, 0.608, v);
    return [across * halfWidth, THREE.MathUtils.lerp(0.75, 1.233, v), THREE.MathUtils.lerp(-0.565, -0.221, v) - (1 - across * across) * 0.035];
  });
  for (const side of [-1, 1]) {
    beam('Body colored A pillar', paint, [side * 0.684, 0.752, -0.565], [side * 0.608, 1.235, -0.221], 0.031);
    beam('Windshield rubber seal', trim, [side * 0.652, 0.753, -0.566], [side * 0.583, 1.22, -0.224], 0.009);
  }
  beam('Windshield upper frame', paint, [-0.608, 1.235, -0.221], [0.608, 1.235, -0.221], 0.031);
  beam('Windshield lower frame', paint, [-0.684, 0.752, -0.565], [0.684, 0.752, -0.565], 0.028);
  beam('Wiper left', trim, [-0.45, 0.773, -0.558], [-0.065, 0.80, -0.533], 0.009);
  beam('Wiper right', trim, [0.05, 0.773, -0.558], [0.45, 0.80, -0.533], 0.009);
  box('Rearview mirror', trim, [0.155, 0.067, 0.039], [0, 1.125, -0.16]);
  for (const side of [-1, 1]) {
    beam('Mirror stalk', paint, [side * 0.758, 0.755, -0.45], [side * 0.843, 0.8, -0.44], 0.023);
    ellipsoid('Stock oval mirror', paint, [0.132, 0.07, 0.092], [side * 0.875, 0.812, -0.424]);
    ellipsoid('Mirror glass', chrome, [0.10, 0.049, 0.009], [side * 0.885, 0.815, -0.339]);
    // Lens surfaces follow the bonnet instead of sitting on it like pop-up pods.
    const almond = new THREE.Shape();
    almond.moveTo(-0.237, 0.003);
    almond.bezierCurveTo(-0.12, -0.13, 0.13, -0.11, 0.24, -0.006);
    almond.bezierCurveTo(0.12, 0.087, -0.12, 0.086, -0.237, 0.003);
    for (const [mat, scale, lift] of [[lampDark, 1.06, 0.008], [lens, 1, 0.012]]) {
      const geometry = new THREE.ShapeGeometry(almond, 16), positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = side * (0.498 + positions.getX(i) * scale), z = -1.72 + positions.getY(i) * scale + (Math.abs(x) - 0.5) * 0.32;
        positions.setXYZ(i, x, topHeight(z, x / (section(z)[0] * 0.94)) + lift, z);
      }
      if (side > 0) geometry.setIndex(Array.from(geometry.index.array).reverse());
      geometry.computeVertexNormals();
      mesh('Flush fixed NB2 headlamp', geometry, mat);
    }
    for (const [offset, radius] of [[-0.066, 0.054], [0.077, 0.039]]) {
      const x = side * (0.498 + offset), z = -1.72 + offset * 0.32;
      ellipsoid('Round projector reflector', chrome, [radius, 0.008, radius], [x, topHeight(z, x / (section(z)[0] * 0.94)) + 0.017, z]);
      ellipsoid('Projector glass center', lampDark, [radius * 0.64, 0.008, radius * 0.64], [x, topHeight(z, x / (section(z)[0] * 0.94)) + 0.026, z]);
    }
    const indicatorX = side * 0.668, indicatorZ = -1.67;
    ellipsoid('Small headlamp turn indicator', amber, [0.022, 0.008, 0.033], [indicatorX, topHeight(indicatorZ, indicatorX / (section(indicatorZ)[0] * 0.94)) + 0.015, indicatorZ]);
    ellipsoid('Stock round foglamp surround', trim, [0.076, 0.062, 0.032], [side * 0.559, 0.346, -1.997]);
    ellipsoid('Stock foglamp lens', lens, [0.051, 0.047, 0.011], [side * 0.559, 0.35, -2.026]);
    ellipsoid('Side amber marker', amber, [0.016, 0.025, 0.065], [side * 0.801, 0.459, -1.66]);
    const tail = ellipsoid('NB oval rear lamp housing', red, [0.198, 0.065, 0.022], [side * 0.44, 0.531, 1.99]);
    tail.rotation.y = side * 0.16;
    ellipsoid('Round red rear lamp', red, [0.054, 0.047, 0.008], [side * 0.519, 0.535, 2.011]);
    ellipsoid('Clear reverse lamp', lens, [0.057, 0.023, 0.008], [side * 0.35, 0.514, 2.013]);
    ellipsoid('Rear amber indicator', amber, [0.044, 0.019, 0.008], [side * 0.346, 0.553, 2.013]);
    beam('Bonnet panel seam', trim, [side * 0.403, 0.604, -1.93], [side * 0.572, 0.725, -0.619], 0.0035);
  }
  ellipsoid('NB2 oval grille opening', trim, [0.419, 0.104, 0.022], [0, 0.355, -2.007]);
  for (const y of [0.315, 0.35, 0.385]) beam('Grille slat', lampDark, [-0.365, y, -2.028], [0.365, y, -2.028], 0.007);
  box('Recessed rear plate panel', trim, [0.385, 0.175, 0.023], [0, 0.467, 1.997]);
  box('Stock rear license plate', lens, [0.318, 0.107, 0.006], [0, 0.474, 2.012]);
  box('Rear plate registration marks', lampDark, [0.219, 0.025, 0.009], [0, 0.477, 2.019]);
  beam('Single stock exhaust', silver, [-0.52, 0.229, 1.80], [-0.52, 0.229, 2.061], 0.05);
  ellipsoid('Exhaust outlet', trim, [0.039, 0.039, 0.003], [-0.52, 0.229, 2.067]);
  ellipsoid('Front Mazda oval badge', chrome, [0.041, 0.009, 0.026], [0, 0.535, -1.961]);
  ellipsoid('Rear Mazda oval badge', chrome, [0.029, 0.019, 0.008], [0, 0.597, 1.988]);
  box('Small MX-5 rear badge', chrome, [0.095, 0.018, 0.009], [0.282, 0.465, 1.989]);

  const wheels = [];
  for (const z of [-1.13, 1.13]) for (const side of [-1, 1]) {
    const steering = new THREE.Group();
    steering.name = `${z < 0 ? 'Front' : 'Rear'} ${side < 0 ? 'left' : 'right'} wheel carrier`;
    steering.position.set(side * 0.749, 0.323, z);
    car.add(steering);
    const wheel = new THREE.Group();
    steering.add(wheel);
    const tire = mesh('Rounded stock tire', new THREE.TorusGeometry(0.244, 0.078, 10, 28), rubber, wheel);
    tire.rotation.y = Math.PI / 2;
    tire.scale.z = 1.15;
    const rim = mesh('Silver outer rim lip', new THREE.TorusGeometry(0.208, 0.013, 6, 28), silver, wheel);
    rim.rotation.y = Math.PI / 2; rim.position.x = side * 0.082;
    const barrel = mesh('Alloy wheel barrel', new THREE.CylinderGeometry(0.213, 0.213, 0.14, 28, 1, true), lampDark, wheel);
    barrel.rotation.z = Math.PI / 2;
    const disc = mesh('Brake disc', new THREE.CylinderGeometry(0.168, 0.168, 0.012, 24), silver, wheel);
    disc.rotation.z = Math.PI / 2; disc.position.x = side * 0.035;
    for (let spoke = 0; spoke < 5; spoke++) {
      const angle = spoke * Math.PI * 2 / 5;
      const blade = box('OEM five spoke alloy', silver, [0.032, 0.049, 0.166], [side * 0.085, Math.sin(angle) * 0.123, Math.cos(angle) * 0.123], wheel);
      blade.rotation.x = -angle;
    }
    const hub = mesh('OEM center cap', new THREE.CylinderGeometry(0.049, 0.049, 0.041, 16), silver, wheel);
    hub.rotation.z = Math.PI / 2; hub.position.x = side * 0.08;
    for (let lug = 0; lug < 4; lug++) {
      const angle = lug * Math.PI / 2 + Math.PI / 4;
      ellipsoid('Wheel lug', chrome, [0.008, 0.008, 0.008], [side * 0.106, Math.sin(angle) * 0.052, Math.cos(angle) * 0.052], wheel);
    }
    wheels.push({ wheel, steering, front: z < 0 });
  }

  // Batch by material within the body and each animated wheel: 27 draw calls,
  // no texture downloads and no per-frame model allocations.
  for (const [parent, parts] of [[car, staticParts], ...wheels.map(({ wheel }) => [wheel, [...wheel.children]])]) {
    const byMaterial = new Map();
    for (const part of parts) {
      part.updateMatrix();
      const geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
      geometry.applyMatrix4(part.matrix);
      geometry.deleteAttribute('uv');
      const geometries = byMaterial.get(part.material) ?? [];
      geometries.push(geometry);
      byMaterial.set(part.material, geometries);
      parent.remove(part);
      part.geometry.dispose();
    }
    for (const [mat, geometries] of byMaterial) {
      const merged = new THREE.Mesh(mergeGeometries(geometries), mat);
      merged.name = mat === paint ? 'NB2 body' : mat.name;
      merged.castShadow = mat !== glass;
      merged.receiveShadow = true;
      parent.add(merged);
      for (const geometry of geometries) geometry.dispose();
    }
  }
  return { car, wheels };
}
