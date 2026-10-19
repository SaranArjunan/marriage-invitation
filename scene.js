/* =========================================================
   3D world: a decorated wedding mandapam at sunset.
   Three.js r128. Exposes window.World = { open(), setProgress(t) }.
   ========================================================= */
(function () {
  const canvas = document.getElementById('world');
  const fail = () => { document.body.classList.add('no3d'); window.World = null; };
  if (!window.THREE) return fail();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return fail(); }

  const mobile = Math.min(innerWidth, innerHeight) < 700;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x4a1a52, 26, 95);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rand = (a, b) => a + Math.random() * (b - a);
  const std = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0 }, o));
  const add = (mesh, x = 0, y = 0, z = 0, parent = scene) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

  const canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };

  /* ---------------- materials & textures ---------------- */
  const gold = std(0xe8b04a, { metalness: 0.6, roughness: 0.3, emissive: 0x3d2400 });
  const magenta = std(0xd81b60, { roughness: 0.5 });
  const maroon = std(0x8e1538, { roughness: 0.55 });
  const cream = std(0xfff1dc, { roughness: 0.45 });

  const glowTex = canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.22, 'rgba(255,236,190,.85)');
    r.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });

  // Colourful rangoli for the mandapam floor
  const rangoliTex = canvasTex(1024, 1024, (g) => {
    g.translate(512, 512);
    const disc = (r, c) => { g.fillStyle = c; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); };
    const petals = (r, n, len, w, c, inner) => {
      for (let i = 0; i < n; i++) {
        g.save(); g.rotate((i / n) * Math.PI * 2); g.translate(0, -r);
        g.fillStyle = c; g.strokeStyle = '#fff'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(0, 0, w / 2, len / 2, 0, 0, Math.PI * 2); g.fill(); g.stroke();
        if (inner) { g.fillStyle = inner; g.beginPath(); g.ellipse(0, 4, w / 4, len / 4, 0, 0, Math.PI * 2); g.fill(); }
        g.restore();
      }
    };
    const dots = (r, n, c) => { g.fillStyle = c; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 5, 0, 7); g.fill(); } };
    disc(512, '#d81b60'); disc(496, '#ffc300'); disc(482, '#f8ead0');
    petals(438, 40, 56, 24, '#1f9e4a', '#7ed957');
    disc(396, '#0f9db0'); disc(384, '#f8ead0');
    petals(330, 24, 96, 46, '#ff7b00', '#ffc300');
    dots(400, 72, '#d81b60');
    disc(252, '#6a2c91'); disc(240, '#f8ead0');
    petals(188, 16, 84, 42, '#d81b60', '#ff7fb0');
    dots(262, 54, '#ffc300');
    disc(112, '#ffc300');
    petals(72, 8, 62, 30, '#e63946', '#fff');
    disc(32, '#1f9e4a'); disc(14, '#fff');
  });

  // Ceiling: pleated fabric sunburst
  const ceilingTex = canvasTex(512, 512, (g) => {
    const cols = ['#d81b60', '#ffc300', '#ff7b00', '#0f9db0', '#6a2c91', '#ffc300'];
    g.translate(256, 256);
    for (let i = 0; i < 36; i++) {
      g.fillStyle = cols[i % cols.length];
      g.beginPath(); g.moveTo(0, 0);
      g.arc(0, 0, 380, (i / 36) * Math.PI * 2, ((i + 1) / 36) * Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#e8b04a'; g.beginPath(); g.arc(0, 0, 46, 0, 7); g.fill();
    g.fillStyle = '#d81b60'; g.beginPath(); g.arc(0, 0, 28, 0, 7); g.fill();
  });

  // Carved wooden temple door with brass and coloured inlay
  const doorTex = canvasTex(512, 1024, (g, w, h) => {
    const wood = g.createLinearGradient(0, 0, w, 0);
    wood.addColorStop(0, '#4a1d0c'); wood.addColorStop(0.5, '#73331a'); wood.addColorStop(1, '#4a1d0c');
    g.fillStyle = wood; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = `rgba(25,8,2,${Math.random() * 0.28})`;
      g.lineWidth = 1 + Math.random() * 2;
      const x = Math.random() * w;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, h * 0.3, x - 10, h * 0.6, x + 5, h); g.stroke();
    }
    g.strokeStyle = '#f0b84c'; g.lineWidth = 16; g.strokeRect(12, 12, w - 24, h - 24);
    const pw = (w - 110) / 2, ph = (h - 170) / 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const x = 42 + c * (pw + 26), y = 56 + r * (ph + 28);
      g.beginPath();
      if (r === 0) { g.moveTo(x, y + ph); g.lineTo(x, y + pw / 2); g.arc(x + pw / 2, y + pw / 2, pw / 2, Math.PI, 0); g.lineTo(x + pw, y + ph); g.closePath(); }
      else g.rect(x, y, pw, ph);
      g.fillStyle = '#3a1306'; g.fill();
      g.lineWidth = 9; g.strokeStyle = '#f0b84c'; g.stroke();
      const cx = x + pw / 2, cy = y + ph / 2 + (r === 0 ? 20 : 0);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        g.fillStyle = k % 2 ? '#d81b60' : '#1f9e4a';
        g.beginPath(); g.ellipse(cx + Math.cos(a) * 48, cy + Math.sin(a) * 48, 10, 18, a + Math.PI / 2, 0, 7); g.fill();
      }
      g.fillStyle = '#f0b84c'; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill();
      g.fillStyle = '#d81b60'; g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fill();
      g.fillStyle = '#ffd86b'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
    }
    for (let y = 40; y < h - 20; y += 44) for (const x of [26, w - 26]) {
      g.fillStyle = '#ffd86b'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
      g.fillStyle = '#8a5a18'; g.beginPath(); g.arc(x + 1.5, y + 1.5, 3, 0, 7); g.fill();
    }
  });

  /* ---------------- sky, stars, ground ---------------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x160c3a) }, mid: { value: new THREE.Color(0xa0246a) }, low: { value: new THREE.Color(0xff8a3d) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top, mid, low; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.1 ? mix(mid, top, smoothstep(0.1, 0.55, h)) : mix(low, mid, smoothstep(-0.04, 0.1, h)); gl_FragColor = vec4(c, 1.0); }',
    })
  );
  scene.add(sky);
  {
    const n = 500, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = rand(0.25, 1.4);
      p[i * 3] = Math.cos(a) * Math.cos(e) * 250; p[i * 3 + 1] = Math.sin(e) * 250; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 250;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff4d6, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false })));
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std(0x2b1236, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  /* ---------------- lights ---------------- */
  scene.add(new THREE.HemisphereLight(0xffd0e4, 0x3a1446, 0.7));
  const sun = new THREE.DirectionalLight(0xffa060, 0.9); sun.position.set(-12, 10, -14); scene.add(sun);
  const front = new THREE.DirectionalLight(0xffe2c0, 0.55); front.position.set(4, 7, 16); scene.add(front);
  const warm = new THREE.PointLight(0xffb060, 0.9, 16, 1.8); warm.position.set(0, 2.4, 1.5); scene.add(warm);

  /* ---------------- flowers (one instanced mesh for thousands) ---------------- */
  const F = [];
  const PAL = { o: 0xff7300, y: 0xffc300, r: 0xd0103a, w: 0xfff8ec, p: 0xff4f9a, v: 0x9b30d0, m: 0xd81b60 };
  const flower = (x, y, z, s, c) => F.push(x, y, z, s, c);
  const leafPts = []; // mango leaves for thoranam: x,y,z,rotY,scale

  /* ---------------- platform + rangoli + carpet ---------------- */
  add(cyl(6.5, 6.8, 0.45, cream, 64), 0, 0.225, 0);
  add(new THREE.Mesh(new THREE.TorusGeometry(6.52, 0.06, 8, 120), gold), 0, 0.45, 0).rotation.x = Math.PI / 2;
  const rangoli = new THREE.Mesh(new THREE.CircleGeometry(6.25, 72), std(0xffffff, { map: rangoliTex, roughness: 0.85 }));
  rangoli.rotation.x = -Math.PI / 2; add(rangoli, 0, 0.455, 0);
  add(box(2.6, 0.22, 0.6, cream), 0, 0.11, 6.85);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.2), std(0xb0123f, { roughness: 0.9 }));
  carpet.rotation.x = -Math.PI / 2; add(carpet, 0, 0.012, 8.6);
  for (let z = 7.2; z <= 10.2; z += 0.16) { flower(-1.2, 0.05, z, 0.06, Math.round(z * 6) % 2 ? PAL.o : PAL.y); flower(1.2, 0.05, z, 0.06, Math.round(z * 6) % 2 ? PAL.y : PAL.o); }

  /* ---------------- pillars ---------------- */
  const P = 3.6;
  [[-P, P], [P, P], [P, -P], [-P, -P]].forEach(([x, z]) => {
    add(box(0.9, 0.5, 0.9, maroon), x, 0.7, z);
    add(box(1.0, 0.08, 1.0, gold), x, 0.97, z);
    add(cyl(0.24, 0.27, 3.65, cream), x, 2.78, z);
    [1.3, 2.7, 4.1].forEach((y) => add(new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.045, 8, 24), gold), x, y, z).rotation.x = Math.PI / 2);
    add(box(0.85, 0.22, 0.85, gold), x, 4.68, z);
    // spiral of marigold & jasmine round each pillar
    const n = mobile ? 56 : 80;
    for (let i = 0; i < n; i++) {
      const t = i / n, a = t * Math.PI * 2 * 5.5;
      flower(x + Math.cos(a) * 0.29, 1.05 + t * 3.45, z + Math.sin(a) * 0.29, 0.06, i % 2 ? PAL.o : PAL.y);
      flower(x + Math.cos(a + Math.PI) * 0.28, 1.05 + t * 3.45, z + Math.sin(a + Math.PI) * 0.28, 0.045, PAL.w);
    }
  });

  /* ---------------- roof ---------------- */
  add(box(8.7, 0.36, 8.7, maroon), 0, 4.96, 0);
  add(box(8.85, 0.1, 8.85, gold), 0, 5.17, 0);
  add(box(8.85, 0.08, 8.85, gold), 0, 4.78, 0);
  const pyramid = add(new THREE.Mesh(new THREE.ConeGeometry(6.1, 2.5, 4), std(0xd81b60, { roughness: 0.45, flatShading: true })), 0, 6.47, 0);
  pyramid.rotation.y = Math.PI / 4;
  const tier = add(new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), std(0xff8a00, { roughness: 0.45, flatShading: true })), 0, 7.4, 0);
  tier.rotation.y = Math.PI / 4;
  add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), gold), 0, 8.1, 0);
  add(new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.55, 12), gold), 0, 8.6, 0);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 8.5), std(0xffffff, { map: ceilingTex, roughness: 0.9 }));
  ceiling.rotation.x = Math.PI / 2; add(ceiling, 0, 4.77, 0);

  /* ---------------- hanging flower strings & swags ---------------- */
  const ROOF_Y = 4.72, HALF = 4.25;
  const strand = (x, z, len) => {
    const n = Math.max(3, Math.floor(len / 0.105));
    for (let k = 0; k < n; k++) {
      const c = k === n - 1 ? PAL.r : k % 5 === 4 ? PAL.w : k % 2 ? PAL.y : PAL.o;
      flower(x, ROOF_Y - k * 0.105, z, k % 5 === 4 ? 0.042 : 0.056, c);
    }
  };
  for (let s = -HALF; s <= HALF + 0.01; s += mobile ? 0.34 : 0.28) {
    const len = 0.8 + 0.6 * Math.abs(Math.sin(s * 1.7));
    strand(s, HALF, Math.abs(s) > 1.8 ? len + 0.4 : 0.45);
    strand(s, -HALF, len); strand(HALF, s, len); strand(-HALF, s, len);
  }
  const swag = (a, b, sag, step, colors, s) => {
    const n = Math.floor(a.distanceTo(b) / step);
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = a.clone().lerp(b, t);
      p.y -= sag * 4 * t * (1 - t);
      flower(p.x, p.y, p.z, s, colors[Math.floor(i / 3) % colors.length]);
    }
  };
  const corners = [V(-P, 4.55, P + 0.05), V(P, 4.55, P + 0.05), V(P + 0.05, 4.55, -P), V(-P - 0.05, 4.55, -P)];
  const sides = [[V(-P, 4.55, P + 0.05), V(P, 4.55, P + 0.05)], [V(P + 0.05, 4.55, P), V(P + 0.05, 4.55, -P)], [V(P, 4.55, -P - 0.05), V(-P, 4.55, -P - 0.05)], [V(-P - 0.05, 4.55, -P), V(-P - 0.05, 4.55, P)]];
  sides.forEach(([a, b]) => {
    swag(a, b, 0.8, 0.09, [PAL.o, PAL.y], 0.085);
    swag(a.clone().setY(4.3), b.clone().setY(4.3), 1.2, 0.1, [PAL.p, PAL.w, PAL.m], 0.07);
  });
  void corners;
  // mango-leaf thoranam on the front beam
  for (let x = -HALF; x <= HALF; x += 0.2) leafPts.push(x, 4.76, HALF + 0.12, 0, 1);

  /* ---------------- stage: flower wall + couple sofa + standing lamps ---------------- */
  add(box(5.2, 0.36, 2.5, std(0xb0123f, { roughness: 0.85 })), 0, 0.63, -2.45);
  add(box(5.3, 0.06, 2.6, gold), 0, 0.82, -2.45);
  {
    const step = mobile ? 0.19 : 0.15;
    const ring = [PAL.w, PAL.r, PAL.o, PAL.y, PAL.p, PAL.v, PAL.m, PAL.y, PAL.w, PAL.o];
    for (let x = -2.2; x <= 2.21; x += step) for (let y = 0.95; y <= 4.55; y += step) {
      if (!(y <= 2.6 || x * x + (y - 2.6) ** 2 <= 2.2 * 2.2)) continue;
      const d = Math.hypot(x, y - 2.3);
      flower(x + rand(-0.02, 0.02), y, -3.3 + rand(-0.03, 0.03), step * 0.62, ring[Math.floor(d / 0.4) % ring.length]);
    }
    const arch = [];
    for (let y = 0.9; y < 2.6; y += 0.2) arch.push(V(-2.32, y, -3.24));
    for (let a = Math.PI; a >= 0; a -= Math.PI / 24) arch.push(V(Math.cos(a) * 2.32, 2.6 + Math.sin(a) * 2.32, -3.24));
    for (let y = 2.6; y >= 0.9; y -= 0.2) arch.push(V(2.32, y, -3.24));
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch), 120, 0.08, 8), gold));
    add(box(4.8, 3.9, 0.08, maroon), 0, 2.75, -3.42);
  }
  // royal sofa for the couple
  const sofa = new THREE.Group(); sofa.position.set(0, 0.85, -2.25); scene.add(sofa);
  add(box(2.3, 0.38, 0.8, std(0xffcf5a, { roughness: 0.55 })), 0, 0.19, 0, sofa);
  add(box(2.5, 1.0, 0.18, magenta), 0, 0.75, -0.38, sofa);
  add(box(2.6, 0.1, 0.24, gold), 0, 1.28, -0.38, sofa);
  [-1.22, 1.22].forEach((x) => { add(box(0.2, 0.62, 0.8, gold), x, 0.31, 0, sofa); add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), gold), x, 0.68, 0.3, sofa); });
  [-0.55, 0.55].forEach((x) => add(box(0.8, 0.5, 0.14, std(0xff4f9a, { roughness: 0.7 })), x, 0.62, -0.26, sofa));

  /* ---------------- lamps: kuthuvilakku + diyas ---------------- */
  const flames = [];
  const flameGeo = new THREE.ConeGeometry(0.045, 0.17, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd76a });
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffa040, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const addFlame = (x, y, z, glow = 0.8) => {
    const f = add(new THREE.Mesh(flameGeo, flameMat), x, y + 0.085, z);
    const s = add(new THREE.Sprite(glowMat), x, y + 0.08, z);
    s.scale.setScalar(glow);
    flames.push({ f, s, base: glow, ph: Math.random() * 10 });
  };
  [-2.95, 2.95].forEach((x) => {
    const z = -1.55, y0 = 0.45;
    add(cyl(0.3, 0.38, 0.12, gold, 24), x, y0 + 0.06, z);
    add(cyl(0.045, 0.07, 1.5, gold, 12), x, y0 + 0.86, z);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), gold), x, y0 + 0.9, z);
    add(cyl(0.3, 0.12, 0.13, gold, 24), x, y0 + 1.66, z);
    add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 10), gold), x, y0 + 1.9, z);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; addFlame(x + Math.cos(a) * 0.24, y0 + 1.72, z + Math.sin(a) * 0.24, 0.55); }
    const l = new THREE.PointLight(0xffa64a, 1.1, 7, 2); l.position.set(x, y0 + 2, z); scene.add(l);
  });
  const diya = (x, y, z) => {
    add(cyl(0.15, 0.08, 0.1, std(0xb5542a, { roughness: 0.8 }), 12), x, y + 0.05, z);
    addFlame(x, y + 0.1, z, 0.75);
  };
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + 0.14;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.3) continue; // keep the front steps clear
    diya(Math.sin(a) * 6.0, 0.45, Math.cos(a) * 6.0);
  }
  for (let z = 7.4; z <= 10.2; z += 0.9) { diya(-1.5, 0, z); diya(1.5, 0, z); }

  /* ---------------- banana trees at the entrance ---------------- */
  const bananaMat = std(0x3d9a3f, { roughness: 0.65, side: THREE.DoubleSide });
  const bananaLeaf = new THREE.PlaneGeometry(0.75, 2.4, 1, 10);
  bananaLeaf.translate(0, 1.2, 0);
  {
    const pos = bananaLeaf.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setZ(i, (y / 2.4) ** 2 * 1.1); }
    bananaLeaf.computeVertexNormals();
  }
  [[-4.7, 4.1], [4.7, 4.1]].forEach(([x, z]) => {
    add(cyl(0.16, 0.24, 3.0, std(0x6f9a3a, { roughness: 0.8 }), 12), x, 0.45 + 1.5, z);
    for (let k = 0; k < 7; k++) {
      const w = add(new THREE.Group(), x, 3.2, z);
      w.rotation.y = (k / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(bananaLeaf, bananaMat);
      leaf.rotation.x = -0.35 - (k % 2) * 0.2;
      w.add(leaf);
    }
  });

  /* ---------------- distant coconut palms ---------------- */
  {
    const trunkMat = std(0x3b2418, { roughness: 1 });
    const frondMat = std(0x1f4a26, { roughness: 1, side: THREE.DoubleSide });
    const frond = new THREE.PlaneGeometry(0.7, 4.2, 1, 6);
    frond.translate(0, 2.1, 0);
    const fp = frond.attributes.position;
    for (let i = 0; i < fp.count; i++) { const y = fp.getY(i); fp.setZ(i, (y / 4.2) ** 2 * 2.2); }
    frond.computeVertexNormals();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rand(-0.1, 0.1), r = rand(24, 38);
      const g = add(new THREE.Group(), Math.cos(a) * r, 0, Math.sin(a) * r);
      const h = rand(8, 12);
      const t = add(cyl(0.18, 0.32, h, trunkMat, 8), 0, h / 2, 0, g);
      g.rotation.z = rand(-0.12, 0.12);
      for (let k = 0; k < 9; k++) {
        const w = add(new THREE.Group(), 0, h, 0, g);
        w.rotation.y = (k / 9) * Math.PI * 2;
        const m = new THREE.Mesh(frond, frondMat);
        m.rotation.x = -0.5;
        w.add(m);
      }
      void t;
    }
  }

  /* ---------------- entrance gate with opening doors ---------------- */
  const GZ = 10.6;
  const gateMat = std(0x8e1538, { roughness: 0.5 });
  add(box(0.7, 6.6, 0.8, gateMat), -2.85, 3.3, GZ);
  add(box(0.7, 6.6, 0.8, gateMat), 2.85, 3.3, GZ);
  add(box(6.8, 0.8, 0.9, gateMat), 0, 6.6, GZ);
  add(box(6.9, 0.1, 0.95, gold), 0, 6.15, GZ);
  add(box(6.9, 0.1, 0.95, gold), 0, 7.05, GZ);
  [-2.85, 2.85].forEach((x) => { add(box(0.82, 0.1, 0.9, gold), x, 1.2, GZ); add(box(0.82, 0.1, 0.9, gold), x, 4.6, GZ); });
  [-2, 0, 2].forEach((x) => { add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), gold), x, 7.3, GZ); add(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 10), gold), x, 7.62, GZ); });
  for (let x = -3.1; x <= 3.1; x += 0.2) leafPts.push(x, 6.18, GZ + 0.48, 0, 1.1);
  for (let x = -3.0; x <= 3.01; x += 0.3) {
    const len = 0.5 + 0.35 * Math.abs(Math.sin(x * 2.3));
    for (let k = 0; k < Math.floor(len / 0.1); k++) flower(x, 6.12 - k * 0.1, GZ + 0.5, 0.05, k % 2 ? PAL.y : PAL.o);
  }
  const doorSide = std(0x4a1d0c, { roughness: 0.7 });
  const doorFace = std(0xffffff, { map: doorTex, roughness: 0.55 });
  const doorMats = [doorSide, doorSide, doorSide, doorSide, doorFace, doorFace];
  const makeDoor = (side) => {
    const pivot = add(new THREE.Group(), side * 2.5, 3.0, GZ);
    const d = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6.0, 0.16), doorMats);
    d.position.x = -side * 1.25;
    pivot.add(d);
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 24), gold);
    ringMesh.position.set(-side * 2.25, -0.3, 0.12);
    pivot.add(ringMesh);
    return pivot;
  };
  const doorL = makeDoor(-1), doorR = makeDoor(1);

  /* ---------------- build instanced flowers & leaves ---------------- */
  {
    const n = F.length / 5;
    const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true }), n);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const [x, y, z, s, c] = F.slice(i * 5, i * 5 + 5);
      m4.makeRotationY(Math.random() * 6.28);
      m4.scale(V(s, s, s));
      m4.setPosition(x, y, z);
      im.setMatrixAt(i, m4);
      im.setColorAt(i, col.setHex(c).convertSRGBToLinear());
    }
    im.instanceMatrix.needsUpdate = true;
    scene.add(im);

    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.quadraticCurveTo(0.08, -0.16, 0, -0.38); shape.quadraticCurveTo(-0.08, -0.16, 0, 0);
    const ln = leafPts.length / 5;
    const lm = new THREE.InstancedMesh(new THREE.ShapeGeometry(shape), std(0x2f8a3a, { side: THREE.DoubleSide, roughness: 0.6 }), ln);
    const q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < ln; i++) {
      const [x, y, z, , s] = leafPts.slice(i * 5, i * 5 + 5);
      e.set(rand(-0.25, 0.1), rand(-0.3, 0.3), rand(-0.2, 0.2));
      q.setFromEuler(e);
      m4.compose(V(x, y, z), q, V(s, s, s));
      lm.setMatrixAt(i, m4);
    }
    scene.add(lm);
  }

  /* ---------------- falling petals ---------------- */
  const PN = reduceMotion ? 0 : mobile ? 150 : 280;
  const petalMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.13), std(0xffffff, { side: THREE.DoubleSide, roughness: 0.8 }), Math.max(PN, 1));
  const petals = [];
  {
    const cols = [PAL.r, PAL.r, PAL.o, PAL.y, PAL.w, PAL.p];
    const col = new THREE.Color();
    for (let i = 0; i < PN; i++) {
      petals.push({ p: V(rand(-9, 9), rand(0, 11), rand(-6, 14)), v: rand(0.35, 0.8), r: V(rand(0, 6), rand(0, 6), rand(0, 6)), w: V(rand(-2, 2), rand(-2, 2), rand(-2, 2)), ph: rand(0, 6) });
      petalMesh.setColorAt(i, col.setHex(cols[i % cols.length]).convertSRGBToLinear());
    }
    petalMesh.count = PN;
    scene.add(petalMesh);
  }

  /* ---------------- floating gold dust ---------------- */
  const DN = mobile ? 160 : 320;
  const dustPos = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { dustPos[i * 3] = rand(-10, 10); dustPos[i * 3 + 1] = rand(0, 9); dustPos[i * 3 + 2] = rand(-8, 14); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.09, map: glowTex, color: 0xffd27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* ---------------- fireworks in the sunset sky ---------------- */
  const FW = mobile ? 540 : 960;
  const fwPos = new Float32Array(FW * 3), fwCol = new Float32Array(FW * 3), fwVel = new Float32Array(FW * 3), fwBase = new Float32Array(FW * 3), fwLife = new Float32Array(FW);
  const fwGeo = new THREE.BufferGeometry();
  fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3));
  fwGeo.setAttribute('color', new THREE.BufferAttribute(fwCol, 3));
  const fw = new THREE.Points(fwGeo, new THREE.PointsMaterial({ size: 1.1, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  fw.frustumCulled = false;
  scene.add(fw);
  const FW_COLS = [0xff3d8b, 0xffc300, 0x3ee08f, 0x4cc9f0, 0xb26bff, 0xff7a00, 0xffffff];
  let fwCursor = 0, fwNext = 0;
  const burst = () => {
    const cx = rand(-26, 26), cy = rand(16, 28), cz = rand(-55, -30);
    const c1 = new THREE.Color(FW_COLS[Math.floor(Math.random() * FW_COLS.length)]);
    const c2 = new THREE.Color(FW_COLS[Math.floor(Math.random() * FW_COLS.length)]);
    const n = Math.floor(FW / 6), speed = rand(0.16, 0.24);
    for (let k = 0; k < n; k++) {
      const i = fwCursor; fwCursor = (fwCursor + 1) % FW;
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const sp = speed * (0.85 + Math.random() * 0.3);
      fwPos[i * 3] = cx; fwPos[i * 3 + 1] = cy; fwPos[i * 3 + 2] = cz;
      fwVel[i * 3] = s * Math.cos(th) * sp; fwVel[i * 3 + 1] = u * sp; fwVel[i * 3 + 2] = s * Math.sin(th) * sp;
      const c = k % 3 ? c1 : c2;
      fwBase[i * 3] = c.r; fwBase[i * 3 + 1] = c.g; fwBase[i * 3 + 2] = c.b;
      fwLife[i] = 1;
    }
  };

  /* ---------------- camera choreography ---------------- */
  const START = { p: V(0, 3.0, 17.2), t: V(0, 3.0, GZ) };
  const KEYS = [
    { p: V(0, 2.6, 13.0), t: V(0, 1.1, 0) },      // names: through the open gate
    { p: V(6.5, 3.2, 9.0), t: V(0, 2.2, -0.5) },   // celebrations: orbit to the side
    { p: V(7.6, 1.2, 1.4), t: V(0, 3.7, 0) },     // countdown: low angle up at the canopy and fireworks
    { p: V(-9, 11.5, 13), t: V(0, 0.4, 0) },      // venue: aerial view of rangoli & mandapam
    { p: V(0, 2.4, 5.6), t: V(0, 1.6, -3.2) },     // closing: the flower wall and couple's seat
  ];
  let pathP, pathT;
  const buildPath = () => {
    const aspect = innerWidth / innerHeight;
    const push = aspect < 0.8 ? 1.32 : 1;
    camera.fov = aspect < 0.8 ? 64 : 50;
    camera.updateProjectionMatrix();
    pathP = new THREE.CatmullRomCurve3(KEYS.map((k, i) => (k.t.clone().add(k.p.clone().sub(k.t).multiplyScalar(push)))));
    pathT = new THREE.CatmullRomCurve3(KEYS.map((k) => k.t.clone()));
  };
  buildPath();

  let mode = 'closed', openAt = 0, progress = 0, smooth = 0;
  const camPos = START.p.clone(), camLook = START.t.clone();
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  /* ---------------- colour management ---------------- */
  scene.fog.color.convertSRGBToLinear();
  const seen = new Set();
  scene.traverse((o) => {
    if (o.isLight) { o.color.convertSRGBToLinear(); if (o.groundColor) o.groundColor.convertSRGBToLinear(); }
    [].concat(o.material || []).forEach((m) => {
      if (seen.has(m) || m.isShaderMaterial) return;
      seen.add(m);
      if (m.color) m.color.convertSRGBToLinear();
      if (m.emissive) m.emissive.convertSRGBToLinear();
    });
  });

  /* ---------------- loop ---------------- */
  const clock = new THREE.Clock();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V(1, 1, 1);
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;

    // doors & camera
    if (mode === 'closed') {
      camPos.copy(START.p); camPos.y += Math.sin(time * 0.7) * 0.06;
      camLook.copy(START.t);
    } else {
      const k = (performance.now() - openAt) / 1000;
      const a = ease(Math.min(1, k / 2.6)) * 1.75;
      doorL.rotation.y = a; doorR.rotation.y = -a;
      smooth += (progress - smooth) * Math.min(1, dt * 3);
      const tp = pathP.getPoint(smooth), tt = pathT.getPoint(smooth);
      if (mode === 'opening') {
        const f = ease(Math.max(0, Math.min(1, (k - 0.7) / 3.4)));
        camPos.lerpVectors(START.p, tp, f);
        camLook.lerpVectors(START.t, tt, f);
        if (f >= 1) mode = 'scroll';
      } else {
        camPos.lerp(tp, Math.min(1, dt * 4));
        camLook.lerp(tt, Math.min(1, dt * 4));
      }
    }
    camera.position.copy(camPos);
    camera.position.x += Math.sin(time * 0.35) * 0.08;
    camera.lookAt(camLook);

    // flames flicker
    for (const fl of flames) {
      const s = 1 + Math.sin(time * 9 + fl.ph) * 0.12 + Math.sin(time * 23 + fl.ph) * 0.06;
      fl.f.scale.set(1, s, 1);
      fl.s.scale.setScalar(fl.base * (0.9 + 0.12 * s));
    }

    // petals
    for (let i = 0; i < PN; i++) {
      const p = petals[i];
      p.p.y -= p.v * dt;
      p.p.x += Math.sin(time * 0.8 + p.ph) * 0.25 * dt;
      p.r.x += p.w.x * dt; p.r.y += p.w.y * dt; p.r.z += p.w.z * dt;
      if (p.p.y < 0.05) { p.p.y = rand(8, 11); p.p.x = rand(-9, 9); p.p.z = rand(-6, 14); }
      e.set(p.r.x, p.r.y, p.r.z); q.setFromEuler(e);
      m4.compose(p.p, q, one);
      petalMesh.setMatrixAt(i, m4);
    }
    if (PN) petalMesh.instanceMatrix.needsUpdate = true;

    // gold dust drifts upward
    for (let i = 0; i < DN; i++) {
      dustPos[i * 3 + 1] += dt * 0.25;
      dustPos[i * 3] += Math.sin(time + i) * dt * 0.05;
      if (dustPos[i * 3 + 1] > 9) dustPos[i * 3 + 1] = 0;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // fireworks
    if (mode !== 'closed' && !reduceMotion && time > fwNext) { burst(); fwNext = time + rand(0.9, 2.2); }
    for (let i = 0; i < FW; i++) {
      if (fwLife[i] <= 0) { fwCol[i * 3] = fwCol[i * 3 + 1] = fwCol[i * 3 + 2] = 0; continue; }
      fwLife[i] -= dt * 0.42;
      fwVel[i * 3] *= 0.985; fwVel[i * 3 + 1] = fwVel[i * 3 + 1] * 0.985 - 0.0022; fwVel[i * 3 + 2] *= 0.985;
      const st = dt * 60;
      fwPos[i * 3] += fwVel[i * 3] * st; fwPos[i * 3 + 1] += fwVel[i * 3 + 1] * st; fwPos[i * 3 + 2] += fwVel[i * 3 + 2] * st;
      const l = Math.max(0, fwLife[i]) ** 1.4;
      fwCol[i * 3] = fwBase[i * 3] * l; fwCol[i * 3 + 1] = fwBase[i * 3 + 1] * l; fwCol[i * 3 + 2] = fwBase[i * 3 + 2] * l;
    }
    fwGeo.attributes.position.needsUpdate = true;
    fwGeo.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    renderer.setSize(innerWidth, innerHeight, false);
    buildPath();
  });

  window.World = {
    open() { if (mode === 'closed') { mode = 'opening'; openAt = performance.now(); fwNext = clock.elapsedTime + 2; } },
    setProgress(t) { progress = Math.max(0, Math.min(1, t)); },
  };
})();
