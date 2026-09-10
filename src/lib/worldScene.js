import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WORLD_SIZE, LANDMARKS, DISCOVERIES, WATER, OBSTACLES, ROADS, ROAD_WIDTH, terrainHeight, roadDistance } from './worldMap.js';
import { cameraPose, cameraTerrainHeight } from './worldCamera.js';
import { createNB2 } from './nb2Model.js';

// The renderer follows the same coordinates as the driving model and the map.
export function createWorldScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor('#becbc8');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#becbc8', 230, WORLD_SIZE);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.2, WORLD_SIZE + 400);
  const sky = new THREE.HemisphereLight('#d9e8e1', '#8c7856', 1.65);
  scene.add(sky);
  const sun = new THREE.DirectionalLight('#ffe3b0', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -50;
  sun.shadow.camera.right = sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 5;
  sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0007;
  sun.shadow.normalBias = 0.12;
  scene.add(sun, sun.target);

  const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...options });
  const colors = {
    asphalt: material('#454e49'), shoulder: material('#ab9877'), line: material('#dbce95'),
    wood: material('#726044'), darkWood: material('#504b3c'), wall: material('#d9d1af'),
    roof: material('#6b7767'), glass: material('#536967', { metalness: 0.25, roughness: 0.3 }),
    stone: material('#969584', { flatShading: true }), trunk: material('#675944'),
    leaves: material('#58775c', { flatShading: true }), leavesLight: material('#768764', { flatShading: true }),
    grass: material('#aaad77', { side: THREE.DoubleSide }),
  };
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 10);
  function mesh(geometry, mat, parent = scene) {
    const object = new THREE.Mesh(geometry, mat);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(parent, mat, size, position) {
    const object = mesh(boxGeometry, mat, parent);
    object.scale.set(...size);
    object.position.set(...position);
    return object;
  }
  function cylinder(parent, mat, radius, height, position) {
    const object = mesh(cylinderGeometry, mat, parent);
    object.scale.set(radius, height, radius);
    object.position.set(...position);
    return object;
  }
  function beam(parent, mat, from, to, radius) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const object = cylinder(parent, mat, radius, a.distanceTo(b), [0, 0, 0]);
    object.position.copy(a).add(b).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return object;
  }
  let randomSeed = 73481;
  function random() {
    randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  }

  // Hills beyond the driving boundary give the valley a horizon in every direction.
  const terrainExtent = WORLD_SIZE + 440;
  const terrain = new THREE.PlaneGeometry(terrainExtent, terrainExtent, Math.ceil(terrainExtent / 5), Math.ceil(terrainExtent / 5));
  terrain.rotateX(-Math.PI / 2);
  const positions = terrain.attributes.position;
  const groundColors = [];
  const straw = new THREE.Color('#a5a172'), sage = new THREE.Color('#658366'), rock = new THREE.Color('#8d9484');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    const height = cameraTerrainHeight(x, z);
    positions.setY(i, height);
    const patch = 0.5 + 0.25 * Math.sin(x * 0.027 + z * 0.019) + 0.19 * Math.cos(z * 0.043 - x * 0.021);
    const slope = Math.hypot(terrainHeight(x + 2, z) - terrainHeight(x - 2, z), terrainHeight(x, z + 2) - terrainHeight(x, z - 2)) / 4;
    const shade = straw.clone().lerp(sage, patch * 0.8 + Math.max(0, -z / WORLD_SIZE) * 0.3)
      .lerp(rock, Math.min(Math.max(height - 90, 0) / 70 + Math.max(0, slope - 0.22) * 1.2, 0.8));
    shade.multiplyScalar(0.95 + random() * 0.1);
    groundColors.push(shade.r, shade.g, shade.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
  terrain.computeVertexNormals();
  const ground = mesh(terrain, material('#ffffff', { vertexColors: true }));
  ground.castShadow = false;

  for (const lake of WATER) {
    const surface = mesh(new THREE.CircleGeometry(1, 80), material('#547f7c', { roughness: 0.25, metalness: 0.32 }));
    surface.rotation.x = -Math.PI / 2;
    surface.scale.set(lake.rx, lake.rz, 1);
    surface.position.set(lake.x, lake.level + 0.08, lake.z);
    surface.castShadow = false;
    const shoreline = mesh(new THREE.RingGeometry(0.99, 1.035, 80), material('#c8ba91', { roughness: 0.95 }));
    shoreline.rotation.x = -Math.PI / 2;
    shoreline.scale.set(lake.rx, lake.rz, 1);
    shoreline.position.set(lake.x, lake.level + 0.1, lake.z);
    shoreline.castShadow = false;
  }

  function ribbon(points, width, mat, offset = 0, lift = 0.075) {
    const vertices = [], indices = [];
    const closed = points.length > 2 && Math.hypot(points[0].x - points.at(-1).x, points[0].z - points.at(-1).z) < 0.01;
    for (let i = 0; i < points.length; i++) {
      const before = points[i === 0 && closed ? points.length - 2 : Math.max(0, i - 1)];
      const after = points[i === points.length - 1 && closed ? 1 : Math.min(points.length - 1, i + 1)];
      const dx = after.x - before.x, dz = after.z - before.z;
      const length = Math.hypot(dx, dz) || 1;
      for (const side of [-1, 1]) {
        const distance = offset + side * width / 2;
        const x = points[i].x - dz / length * distance;
        const z = points[i].z + dx / length * distance;
        vertices.push(x, terrainHeight(x, z) + lift, z);
      }
      if (i < points.length - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const object = mesh(geometry, mat);
    object.castShadow = false;
    return object;
  }
  const roadJunctions = ROADS.slice(1).flatMap(road => [road[0], road.at(-1)])
    .filter(point => ROADS.filter(road => road.some(other => Math.hypot(point.x - other.x, point.z - other.z) < .01)).length > 1);
  const atJunction = point => roadJunctions.some(junction => Math.hypot(point.x - junction.x, point.z - junction.z) < ROAD_WIDTH * 1.35);
  for (const road of ROADS) ribbon(road, ROAD_WIDTH + 2.3, colors.shoulder, 0, 0.035);
  for (const road of ROADS) ribbon(road, ROAD_WIDTH, colors.asphalt);
  for (const road of ROADS) {
    let section = [];
    for (let i = 0; i <= road.length; i++) {
      if (i < road.length && !atJunction(road[i])) { section.push(road[i]); continue; }
      if (section.length > 1) {
        ribbon(section, 0.09, colors.line, ROAD_WIDTH / 2 - 0.4, 0.095);
        ribbon(section, 0.09, colors.line, -ROAD_WIDTH / 2 + 0.4, 0.095);
      }
      section = [];
    }
    let distance = 0;
    const dashes = [];
    for (let i = 1; i < road.length; i++) {
      distance += Math.hypot(road[i].x - road[i - 1].x, road[i].z - road[i - 1].z);
      if (distance % 8 < 3.4 && !atJunction(road[i]) && !atJunction(road[i - 1])) {
        const dash = ribbon([road[i - 1], road[i]], 0.16, colors.line, 0, 0.1);
        scene.remove(dash);
        dashes.push(dash.geometry);
      }
    }
    if (dashes.length) mesh(mergeGeometries(dashes), colors.line).castShadow = false;
    for (const geometry of dashes) geometry.dispose();
  }

  function groundPatch(x, z, width, depth, mat) {
    const geometry = new THREE.PlaneGeometry(width, depth, 5, 5);
    geometry.rotateX(-Math.PI / 2);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, terrainHeight(p.getX(i) + x, p.getZ(i) + z) + 0.055);
    geometry.computeVertexNormals();
    const object = mesh(geometry, mat);
    object.position.set(x, 0, z);
    object.castShadow = false;
  }
  function signTexture(text, background = '#284b3c', foreground = '#f0ead0') {
    const surface = document.createElement('canvas');
    surface.width = 512; surface.height = 128;
    const context = surface.getContext('2d');
    context.fillStyle = background;
    context.fillRect(0, 0, 512, 128);
    context.strokeStyle = foreground;
    context.lineWidth = 3;
    context.strokeRect(9, 9, 494, 110);
    context.fillStyle = foreground;
    context.font = '600 39px system-ui, sans-serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(text, 256, 66, 466);
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  function buildingSign(group, title, x, y, z, width = 6.5) {
    const mat = new THREE.MeshBasicMaterial({ map: signTexture(title) });
    const object = mesh(new THREE.PlaneGeometry(width, width / 4), mat, group);
    object.position.set(x, y, z);
    return object;
  }
  function roof(group, width, depth, height, y, mat) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0); shape.lineTo(0, height); shape.lineTo(width / 2, 0); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    const object = mesh(geometry, mat, group);
    object.position.set(0, y, -depth / 2);
  }
  for (const obstacle of OBSTACLES) {
    if (!['garage', 'field-station', 'pavilion'].includes(obstacle.kind)) continue;
    const group = new THREE.Group();
    group.position.set(obstacle.x, terrainHeight(obstacle.x, obstacle.z), obstacle.z);
    scene.add(group);
    if (obstacle.kind === 'garage') {
      group.rotation.y = Math.PI;
      groundPatch(obstacle.x + 5, obstacle.z - 2, 23, 21, colors.shoulder);
      box(group, colors.wall, [10, 4.2, 8], [0, 2.1, 0]);
      roof(group, 11.3, 9.3, 1.55, 4.2, colors.roof);
      const door = material('#a0a797');
      box(group, door, [3.8, 3.1, 0.14], [-2.4, 1.55, 4.05]);
      box(group, door, [3.8, 3.1, 0.14], [2.3, 1.55, 4.05]);
      for (let y = 0.4; y < 3.1; y += 0.45) {
        box(group, colors.roof, [3.8, 0.025, 0.035], [-2.4, y, 4.14]);
        box(group, colors.roof, [3.8, 0.025, 0.035], [2.3, y, 4.14]);
      }
      buildingSign(group, 'Sunday garage', 0, 4.7, 4.7, 7.3);
      box(group, colors.darkWood, [1.2, 1.5, 1], [5.7, 0.75, 2]);
      box(group, material('#b95d42'), [0.75, 1.8, 0.65], [-5.7, 0.9, 3]);
    } else if (obstacle.kind === 'field-station') {
      group.rotation.y = Math.PI;
      groundPatch(obstacle.x - 4, obstacle.z - 10, 25, 28, colors.shoulder);
      box(group, colors.wall, [9.5, 4.4, 7], [0, 2.2, 0]);
      roof(group, 11, 8.5, 1.9, 4.4, colors.roof);
      box(group, colors.wood, [11, 0.4, 3], [0, 0.3, 4.4]);
      box(group, colors.darkWood, [1.55, 2.75, 0.18], [0, 1.7, 3.56]);
      for (const x of [-3.2, 3.2]) {
        box(group, colors.wood, [2.6, 2.1, 0.2], [x, 2.5, 3.55]);
        box(group, colors.glass, [2.25, 1.75, 0.23], [x, 2.5, 3.58]);
        box(group, colors.wall, [0.09, 1.8, 0.25], [x, 2.5, 3.62]);
      }
      buildingSign(group, 'Field station', 0, 5, 4.3, 6.5);
      cylinder(group, colors.wall, 1.25, 2, [5.9, 1, -1.5]);
      box(group, colors.roof, [3, 0.14, 2], [2.5, 5.2, -2]).rotation.x = -0.22;
      beam(group, colors.wood, [5, 0, 6], [5, 6.4, 6], 0.1);
      box(group, material('#c08b4f'), [1.6, 0.8, 0.035], [5.75, 5.7, 6]);
    } else {
      groundPatch(obstacle.x - 4, obstacle.z + 10, 25, 30, colors.shoulder);
      box(group, colors.wall, [12, 0.65, 10], [0, 0.3, 0]);
      for (const x of [-5, 5]) for (const z of [-4, 4]) cylinder(group, colors.wood, 0.22, 4.9, [x, 2.9, z]);
      roof(group, 13, 11, 2.2, 5.3, material('#815c45'));
      box(group, colors.darkWood, [9, 2.6, 0.22], [0, 2.1, -4.15]);
      buildingSign(group, 'Lookout Pavilion', 0, 4.9, 5.6, 7);
      for (const x of [-3.6, 3.6]) {
        box(group, colors.wood, [2.4, 0.18, 0.7], [x, 1, 1.3]);
        box(group, colors.wood, [2.4, 0.6, 0.14], [x, 1.3, 1.6]);
      }
      beam(group, colors.wood, [-5, 5, 5], [5, 5, 5], 0.09);
      for (let i = 0; i < 7; i++) {
        const pennant = mesh(new THREE.ConeGeometry(0.35, 0.75, 3), material(i % 2 ? '#d7b56d' : '#708c7d'), group);
        pennant.rotation.z = Math.PI;
        pennant.position.set(-4.2 + i * 1.4, 4.5, 5.1);
      }
    }
  }

  for (const place of DISCOVERIES) {
    groundPatch(place.x, place.z, 17, 19, colors.shoulder);
    const sign = new THREE.Group();
    sign.position.set(place.x + 7, terrainHeight(place.x + 7, place.z + 6), place.z + 6);
    scene.add(sign);
    for (const x of [-2.1, 2.1]) cylinder(sign, colors.wood, 0.1, 2.5, [x, 1.25, 0]);
    box(sign, colors.wood, [5.7, 1.45, .1], [0, 2, -.06]);
    buildingSign(sign, place.name, 0, 2.0, 0, 5.6);
  }
  for (const obstacle of OBSTACLES) {
    if (!['tower', 'picnic-table', 'bench'].includes(obstacle.kind)) continue;
    const group = new THREE.Group();
    group.position.set(obstacle.x, terrainHeight(obstacle.x, obstacle.z), obstacle.z);
    scene.add(group);
    if (obstacle.kind === 'tower') {
      for (const x of [-2.5, 2.5]) for (const z of [-2.5, 2.5]) {
        cylinder(group, colors.darkWood, 0.22, 7, [x, 3.5, z]);
        beam(group, colors.wood, [x, .5, z], [-x, 6, z], .09);
      }
      box(group, colors.wood, [6.5, .3, 6.5], [0, 6.3, 0]);
      for (const x of [-2.8, 2.8]) for (const z of [-2.8, 2.8]) cylinder(group, colors.wood, .14, 2.8, [x, 7.8, z]);
      for (const z of [-2.8, 2.8]) {
        beam(group, colors.wood, [-2.8, 7.4, z], [2.8, 7.4, z], .1);
        box(group, colors.wall, [4.8, .65, .1], [0, 8.1, z]);
      }
      const cap = mesh(new THREE.ConeGeometry(5, 2, 4), colors.roof, group);
      cap.position.y = 9.8; cap.rotation.y = Math.PI / 4;
      for (let step = 0; step < 12; step++) box(group, colors.wood, [1.1, .12, .35], [3.6, .3 + step * .5, 2 - step * .35]);
    } else {
      const table = obstacle.kind === 'picnic-table';
      box(group, colors.wood, [3.3, .16, table ? 1.4 : .65], [0, table ? 1.05 : .75, 0]);
      for (const x of [-1.2, 1.2]) {
        box(group, colors.darkWood, [.18, table ? 1 : .7, .55], [x, table ? .5 : .35, 0]);
      }
      if (table) for (const z of [-1.1, 1.1]) box(group, colors.wood, [3.5, .13, .4], [0, .65, z]);
      if (!table) box(group, colors.wood, [3.3, .6, .13], [0, 1.05, .36]);
    }
  }

  // One mesh for the uphill road's guardrails; posts are instanced below it.
  const railVertices = [], railIndices = [], railPosts = [];
  const mountainRoad = ROADS[0];
  const junctions = ROADS.slice(1).flatMap(road => [road[0], road.at(-1)]);
  for (let i = 1; i < mountainRoad.length; i++) {
    const a = mountainRoad[i - 1], b = mountainRoad[i];
    if (b.z > -25 || [...LANDMARKS, ...DISCOVERIES, ...junctions].some(point => Math.hypot(point.x - b.x, point.z - b.z) < 25)) continue;
    const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
    const nx = -dz / length, nz = dx / length;
    const side = terrainHeight(b.x + nx * 8, b.z + nz * 8) < terrainHeight(b.x - nx * 8, b.z - nz * 8) ? 1 : -1;
    const offset = side * (ROAD_WIDTH / 2 + .8);
    const points = [a, b].map(point => ({ x: point.x + nx * offset, z: point.z + nz * offset }));
    const base = railVertices.length / 3;
    for (const point of points) for (const lift of [.78, 1.06]) railVertices.push(point.x, terrainHeight(point.x, point.z) + lift, point.z);
    railIndices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    if (i % 5 === 0) railPosts.push(points[1]);
  }
  const railGeometry = new THREE.BufferGeometry();
  railGeometry.setAttribute('position', new THREE.Float32BufferAttribute(railVertices, 3));
  railGeometry.setIndex(railIndices); railGeometry.computeVertexNormals();
  mesh(railGeometry, material('#a6aaa0', { metalness: .4, roughness: .6, side: THREE.DoubleSide }));
  const posts = new THREE.InstancedMesh(boxGeometry, colors.darkWood, railPosts.length);
  const postTransform = new THREE.Object3D();
  railPosts.forEach((point, index) => {
    postTransform.position.set(point.x, terrainHeight(point.x, point.z) + .5, point.z);
    postTransform.scale.set(.12, 1, .12); postTransform.updateMatrix(); posts.setMatrixAt(index, postTransform.matrix);
  });
  posts.castShadow = true; scene.add(posts);

  const treePositions = OBSTACLES.filter((obstacle) => obstacle.kind === 'tree');
  const trunks = new THREE.InstancedMesh(cylinderGeometry, colors.trunk, treePositions.length);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), colors.leaves, treePositions.length * 3);
  const pineCrowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), colors.leavesLight, treePositions.length * 2);
  const transform = new THREE.Object3D();
  let oakCount = 0, pineCount = 0;
  treePositions.forEach((tree, index) => {
    const y = terrainHeight(tree.x, tree.z), height = 4.8 + random() * 3.4;
    transform.position.set(tree.x, y + height * 0.37, tree.z);
    transform.scale.set(0.34 + random() * 0.2, height * 0.75, 0.34);
    transform.rotation.set(0, random() * 6, 0.04);
    transform.updateMatrix(); trunks.setMatrixAt(index, transform.matrix);
    if (tree.z < -100 || index % 5 === 0) {
      for (let layer = 0; layer < 2; layer++) {
        transform.position.set(tree.x, y + height * (0.6 + layer * 0.3), tree.z);
        transform.scale.set(height * (0.34 - layer * 0.07), height * 0.72, height * (0.34 - layer * 0.07));
        transform.rotation.set(0, random() * 6, 0);
        transform.updateMatrix(); pineCrowns.setMatrixAt(pineCount++, transform.matrix);
      }
    } else {
      for (let lobe = 0; lobe < 3; lobe++) {
        transform.position.set(tree.x + (lobe - 1) * 1.1, y + height * (0.72 + (lobe % 2) * 0.17), tree.z + Math.sin(lobe * 4) * 0.8);
        transform.scale.set(height * 0.36, height * (0.25 + random() * 0.09), height * 0.32);
        transform.rotation.set(random(), random() * 6, random());
        transform.updateMatrix(); crowns.setMatrixAt(oakCount++, transform.matrix);
      }
    }
  });
  crowns.count = oakCount; pineCrowns.count = pineCount;
  for (const trees of [trunks, crowns, pineCrowns]) { trees.castShadow = true; trees.receiveShadow = true; scene.add(trees); }

  const rocks = OBSTACLES.filter((obstacle) => obstacle.kind === 'rock');
  for (const rock of rocks) {
    const object = mesh(new THREE.DodecahedronGeometry(1, 0), colors.stone);
    object.position.set(rock.x, terrainHeight(rock.x, rock.z) + rock.radius * 0.35, rock.z);
    object.scale.set(rock.radius, rock.radius * 0.75, rock.radius * 0.85);
    object.rotation.set(0.2, random() * 6, 0.12);
    if (rock.radius >= 7) {
      for (let layer = 0; layer < 3; layer++) {
        const face = mesh(new THREE.DodecahedronGeometry(1, 0), colors.stone);
        face.position.set(rock.x + Math.sin(layer * 2) * rock.radius * .4, terrainHeight(rock.x, rock.z) + layer * rock.radius * .25, rock.z + Math.cos(layer * 2) * rock.radius * .3);
        face.scale.set(rock.radius * (.85 - layer * .1), rock.radius * .28, rock.radius * .6);
        face.rotation.set(.03, layer * .3, .1);
      }
    }
  }
  const tuftGeometry = new THREE.BufferGeometry();
  tuftGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.2, 0, 0, -0.1, 0.65, 0, 0.03, 0, 0,
    0.08, 0, 0.02, 0.3, 0.48, 0.02, 0.25, 0, 0.02,
    0, 0, -0.16, 0, 0.7, 0.09, 0, 0, 0.08,
  ], 3));
  tuftGeometry.computeVertexNormals();
  const tufts = new THREE.InstancedMesh(tuftGeometry, colors.grass, 4200);
  let tuftCount = 0;
  for (let i = 0; i < 6200 && tuftCount < 4200; i++) {
    const x = (random() - 0.5) * (WORLD_SIZE - 20), z = (random() - 0.5) * (WORLD_SIZE - 20);
    if (roadDistance(x, z) < ROAD_WIDTH / 2 + 1.2 || [...LANDMARKS, ...DISCOVERIES].some((point) => Math.hypot(point.x - x, point.z - z) < 17)
      || WATER.some(lake => Math.hypot((x - lake.x) / (lake.rx + 3), (z - lake.z) / (lake.rz + 3)) < 1)) continue;
    transform.position.set(x, terrainHeight(x, z), z);
    const scale = 0.65 + random() * 1.5;
    transform.scale.set(scale, scale * (0.5 + random() * 0.5), scale);
    transform.rotation.set(0, random() * Math.PI, 0);
    transform.updateMatrix(); tufts.setMatrixAt(tuftCount++, transform.matrix);
  }
  tufts.count = tuftCount; scene.add(tufts);

  // NPCs are deliberately drawn on a tiny pixel grid; nearest filtering preserves it.
  function npcTexture(id) {
    const surface = document.createElement('canvas');
    surface.width = 24; surface.height = 36;
    const context = surface.getContext('2d');
    const pixel = (color, x, y, w, h) => { context.fillStyle = color; context.fillRect(x, y, w, h); };
    const oak = /oak/i.test(id), hamilton = /hamilton/i.test(id);
    const hair = oak ? '#c1c5bd' : hamilton ? '#6b4935' : '#292f32';
    const skin = '#e8b98a', shade = '#ba825e', outline = '#303e38';
    // Offset boots, a dark outline and asymmetric hair keep the tiny silhouettes readable.
    pixel(outline, 6, 29, 5, 6); pixel(outline, 13, 29, 5, 6);
    pixel(oak ? '#78634e' : hamilton ? '#b5a889' : '#4b6174', 7, 25, 4, 8);
    pixel(oak ? '#78634e' : hamilton ? '#b5a889' : '#4b6174', 13, 25, 4, 8);
    pixel(outline, 5, 14, 14, 14);
    pixel(oak ? '#dfdfce' : hamilton ? '#254964' : '#e3e0ce', 6, 14, 12, 13);
    pixel(oak ? '#a4443e' : hamilton ? '#d8cbb1' : '#d0cfc3', 10, 14, 4, 12);
    pixel(oak ? '#f0edda' : hamilton ? '#375e78' : '#f2efdf', 4, 16, 3, 8);
    pixel(oak ? '#f0edda' : hamilton ? '#375e78' : '#f2efdf', 17, 16, 3, 8);
    pixel(skin, 4, 24, 3, 3); pixel(skin, 17, 24, 3, 3);
    pixel(shade, 10, 12, 4, 3);
    pixel(outline, 6, 3, 12, 10); pixel(skin, 7, 5, 10, 8);
    pixel(shade, 7, 11, 10, 2); pixel(skin, 5, 7, 2, 3); pixel(skin, 17, 7, 2, 3);
    pixel(hair, 6, 2, 12, 4); pixel(hair, 5, 4, 3, 3); pixel(hair, 16, 4, 3, 4);
    pixel(outline, 8, 8, 2, 1); pixel(outline, 14, 8, 2, 1); pixel('#986d52', 11, 11, 3, 1);
    if (oak) {
      pixel('#e0e0d1', 5, 3, 4, 2); pixel('#e0e0d1', 8, 0, 3, 3); pixel('#e0e0d1', 12, 1, 5, 2);
      pixel('#fbf5df', 7, 15, 2, 9); pixel('#fbf5df', 15, 15, 2, 9); pixel('#97a79a', 7, 21, 2, 1);
      pixel('#8f9a8f', 7, 7, 4, 1); pixel('#8f9a8f', 13, 7, 4, 1);
    } else if (hamilton) {
      pixel(hair, 17, 8, 3, 7); pixel('#dcc998', 17, 12, 3, 1);
      pixel('#f0e8d1', 10, 14, 4, 5); pixel('#d0b070', 7, 18, 1, 7); pixel('#d0b070', 16, 18, 1, 7);
      pixel('#b4a16d', 5, 15, 3, 1); pixel('#b4a16d', 16, 15, 3, 1);
    } else {
      pixel(hair, 5, 2, 10, 3); pixel(hair, 8, 5, 3, 2); pixel(hair, 14, 5, 3, 3);
      pixel('#6e8280', 8, 18, 7, 1); pixel('#6e8280', 8, 20, 4, 1);
    }
    const texture = new THREE.CanvasTexture(surface);
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  const markers = [];
  for (const landmark of LANDMARKS) {
    const y = terrainHeight(landmark.x, landmark.z);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: npcTexture(`${landmark.id} ${landmark.name}`), transparent: true, alphaTest: 0.2, depthWrite: false }));
    sprite.position.set(landmark.x, y + 1.45, landmark.z);
    sprite.scale.set(1.92, 2.88, 1);
    scene.add(sprite);
    const shadow = mesh(new THREE.CircleGeometry(1.1, 20), new THREE.MeshBasicMaterial({ color: '#333f30', transparent: true, opacity: 0.22, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(landmark.x, y + 0.12, landmark.z); shadow.castShadow = false;
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTexture(landmark.name, '#f0ead0', '#284b3c'), transparent: true, depthWrite: false }));
    marker.position.set(landmark.x, y + 4.15, landmark.z);
    marker.scale.set(6.4, 1.6, 1);
    scene.add(marker);
    markers.push({ object: marker, landmark });
  }

  for (const landmark of DISCOVERIES) {
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTexture(landmark.name, '#e9d8a7', '#304d40'), transparent: true, depthWrite: false }));
    marker.scale.set(7.2, 1.8, 1);
    scene.add(marker);
    markers.push({ object: marker, landmark });
  }

  const { car, wheels } = createNB2();
  scene.add(car);

  const cameraTarget = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  const markerOffset = new THREE.Vector3();
  let cameraHeading = 0, cameraDistance = 0, cameraHeight = 0;
  let firstFrame = true, previousHeading = 0, aspect = 1, disposed = false;
  function resize(width, height) {
    if (disposed || width <= 0 || height <= 0) return;
    aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    firstFrame = true;
  }
  function render(state, dt, view = 'overhead') {
    if (disposed) return;
    const h = terrainHeight(state.x, state.z);
    car.position.set(state.x, h + 0.1, state.z);
    const forwardX = Math.sin(state.heading), forwardZ = -Math.cos(state.heading);
    const front = terrainHeight(state.x + forwardX * 2, state.z + forwardZ * 2);
    const back = terrainHeight(state.x - forwardX * 2, state.z - forwardZ * 2);
    const right = terrainHeight(state.x + Math.cos(state.heading), state.z + Math.sin(state.heading));
    const left = terrainHeight(state.x - Math.cos(state.heading), state.z - Math.sin(state.heading));
    car.rotation.set(Math.atan2(front - back, 4), -state.heading, Math.atan2(right - left, 2), 'YXZ');
    if (dt > 0) {
      const turn = Math.atan2(Math.sin(state.heading - previousHeading), Math.cos(state.heading - previousHeading));
      for (const { wheel, steering, front: isFront } of wheels) {
        wheel.rotation.x -= state.speed * dt / 0.322;
        if (isFront) steering.rotation.y = THREE.MathUtils.lerp(steering.rotation.y, -THREE.MathUtils.clamp(turn / dt * 0.2, -0.35, 0.35), 0.2);
      }
    }
    previousHeading = state.heading;
    if (firstFrame || dt > 0) {
      const pose = cameraPose(state, aspect, view);
      desiredTarget.set(pose.target.x, pose.target.y, pose.target.z);
      const desiredHeading = Math.atan2(pose.target.x - pose.position.x, -(pose.target.z - pose.position.z));
      const desiredDistance = Math.hypot(pose.target.x - pose.position.x, pose.target.z - pose.position.z);
      const follow = firstFrame ? 1 : 1 - Math.exp(-dt * 8);
      // Orbit on the shortest arc, so switching opposing views never flies through the car.
      const headingDifference = Math.atan2(Math.sin(desiredHeading - cameraHeading), Math.cos(desiredHeading - cameraHeading));
      cameraHeading += headingDifference * follow;
      cameraDistance = THREE.MathUtils.lerp(cameraDistance, desiredDistance, follow);
      cameraHeight = THREE.MathUtils.lerp(cameraHeight, pose.position.y - pose.target.y, follow);
      cameraTarget.lerp(desiredTarget, follow);
      camera.position.set(cameraTarget.x - Math.sin(cameraHeading) * cameraDistance,
        cameraTarget.y + cameraHeight, cameraTarget.z + Math.cos(cameraHeading) * cameraDistance);
      camera.position.y = Math.max(camera.position.y, cameraTerrainHeight(camera.position.x, camera.position.z) + 6);
      camera.fov = THREE.MathUtils.lerp(camera.fov, pose.fov, follow);
      camera.updateProjectionMatrix();
      camera.lookAt(cameraTarget);
      sun.position.set(state.x - 35, h + 75, state.z + 35);
      sun.target.position.set(state.x, h, state.z);
      firstFrame = false;
    }
    markerOffset.set(0, 3.2, 0).applyQuaternion(camera.quaternion);
    for (const { object, landmark } of markers) {
      // Keep names above the pixel sprites on screen, including the near-vertical view.
      object.position.set(landmark.x, terrainHeight(landmark.x, landmark.z) + 1.45, landmark.z).add(markerOffset);
      const distance = Math.hypot(state.x - landmark.x, state.z - landmark.z);
      object.material.opacity = THREE.MathUtils.clamp((68 - distance) / 25, 0, 1);
      object.visible = distance < 68;
    }
    renderer.render(scene, camera);
  }
  function destroy() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set(), materials = new Set(), textures = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
    });
    for (const mat of Object.values(colors)) materials.add(mat);
    for (const mat of materials) {
      for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value);
      mat.dispose();
    }
    for (const texture of textures) texture.dispose();
    for (const geometry of geometries) geometry.dispose();
    sun.shadow.dispose();
    renderer.dispose();
  }
  return { render, resize, destroy, getCameraHeading: () => Math.atan2(Math.sin(cameraHeading), Math.cos(cameraHeading)) };
}
