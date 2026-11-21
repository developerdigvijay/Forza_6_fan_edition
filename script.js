/* ============================================
   FORZA HORIZON 6 — SCRIPT.JS
   GSAP + Three.js + Interaction Engine
   ============================================ */

"use strict";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

/* ============================================
   UTILITY: mobile detection
============================================ */
const isMobile = () => window.innerWidth <= 768;

/* ============================================
   MODULE 1: CUSTOM CURSOR
============================================ */
(function initCursor() {
  const outer = document.getElementById('cursor-outer');
  const inner = document.getElementById('cursor-inner');
  const glow  = document.getElementById('cursor-glow');
  if (!outer) return;

  let mx = 0, my = 0;
  let ox = 0, oy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(inner, { x: mx, y: my, duration: 0.05 });
    gsap.to(glow,  { x: mx, y: my, duration: 0.2 });
  });

  // Outer follows with lag
  (function animOuter() {
    ox += (mx - ox) * 0.12;
    oy += (my - oy) * 0.12;
    gsap.set(outer, { x: ox, y: oy });
    requestAnimationFrame(animOuter);
  })();

  // Hover states
  document.querySelectorAll('a, button, .car-card, .gal-item, .feat-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(outer, { scale: 2, duration: 0.3, ease: 'power2.out' });
      gsap.to(inner, { scale: 0, duration: 0.2 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(outer, { scale: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(inner, { scale: 1, duration: 0.2 });
    });
  });
})();

/* ============================================
   MODULE 2: THREE.JS HERO CANVAS
============================================ */
(function initHeroThree() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || isMobile()) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);

  // Particle field
  const count = 4000;
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);

  const c1 = new THREE.Color('#8b2fc9');
  const c2 = new THREE.Color('#00e5ff');
  const c3 = new THREE.Color('#ff3366');

  for (let i = 0; i < count; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 40;
    positions[i*3+1] = (Math.random() - 0.5) * 30;
    positions[i*3+2] = (Math.random() - 0.5) * 30;

    const palette = [c1, c2, c3];
    const col = palette[Math.floor(Math.random() * 3)];
    colors[i*3]   = col.r;
    colors[i*3+1] = col.g;
    colors[i*3+2] = col.b;

    sizes[i] = Math.random() * 2 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // Neon grid floor
  const gridGeo = new THREE.PlaneGeometry(60, 60, 40, 40);
  const gridMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff, wireframe: true,
    transparent: true, opacity: 0.04
  });
  const grid = new THREE.Mesh(gridGeo, gridMat);
  grid.rotation.x = -Math.PI / 2.5;
  grid.position.y = -6;
  grid.position.z = -5;
  scene.add(grid);

  // Speed streak lines
  const streakCount = 80;
  const streakGeo = new THREE.BufferGeometry();
  const streakPos = new Float32Array(streakCount * 6);
  for (let i = 0; i < streakCount; i++) {
    const x = (Math.random() - 0.5) * 30;
    const y = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10 - 5;
    const len = Math.random() * 2 + 0.5;
    streakPos[i*6]   = x - len; streakPos[i*6+1] = y; streakPos[i*6+2] = z;
    streakPos[i*6+3] = x;       streakPos[i*6+4] = y; streakPos[i*6+5] = z;
  }
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  const streakMat = new THREE.LineBasicMaterial({
    color: 0x8b2fc9, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending
  });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  scene.add(streaks);

  // Mouse parallax
  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 0.5;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    particles.rotation.y += 0.0003;
    particles.rotation.x  = targetY * 0.3;
    grid.position.x       = targetX * 2;

    // Streaks drift
    const sp = streakGeo.attributes.position.array;
    for (let i = 0; i < streakCount; i++) {
      sp[i*6]   += 0.08;
      sp[i*6+3] += 0.08;
      if (sp[i*6+3] > 15) {
        const nx = -15;
        const len = Math.random() * 2 + 0.5;
        sp[i*6]   = nx - len; sp[i*6+3] = nx;
      }
    }
    streakGeo.attributes.position.needsUpdate = true;

    camera.position.x += (targetX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-targetY * 0.3 - camera.position.y) * 0.05;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
})();

/* ============================================
   MODULE 3: WORLD CANVAS (Light Trails + Scene)
============================================ */
(function initWorldCanvas() {
  const canvas = document.getElementById('worldCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // City skyline
  function drawSkyline(t) {
    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    sky.addColorStop(0,   '#02020a');
    sky.addColorStop(0.4, '#0a0020');
    sky.addColorStop(0.7, '#140030');
    sky.addColorStop(1,   '#04040a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 150; i++) {
      const sx = ((i * 137.5) % W);
      const sy = ((i * 97.3) % (H * 0.5));
      const br = (Math.sin(t * 0.5 + i) * 0.5 + 0.5) * 0.8;
      ctx.fillStyle = `rgba(255,255,255,${br * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mountain silhouettes (background)
    ctx.fillStyle = '#0a0018';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.55);
    const mPts = [0.0,0.55, 0.1,0.38, 0.2,0.45, 0.3,0.3, 0.45,0.42, 0.55,0.28, 0.7,0.4, 0.8,0.32, 0.9,0.44, 1.0,0.5, 1.0,1.0, 0,1.0];
    for (let i = 0; i < mPts.length; i += 2) {
      ctx.lineTo(mPts[i]*W, mPts[i+1]*H);
    }
    ctx.closePath(); ctx.fill();

    // City buildings
    const buildings = [
      {x:0.05,w:0.04,h:0.22,c:'#100020'},
      {x:0.09,w:0.025,h:0.3,c:'#0a0025'},
      {x:0.12,w:0.035,h:0.25,c:'#120028'},
      {x:0.15,w:0.02,h:0.38,c:'#0f0020'},
      {x:0.18,w:0.04,h:0.28,c:'#14002a'},
      {x:0.22,w:0.03,h:0.18,c:'#100018'},
      {x:0.55,w:0.04,h:0.25,c:'#100020'},
      {x:0.6,w:0.025,h:0.35,c:'#120025'},
      {x:0.63,w:0.03,h:0.22,c:'#0f001e'},
      {x:0.67,w:0.04,h:0.3,c:'#14002a'},
      {x:0.72,w:0.025,h:0.42,c:'#10001e'},
      {x:0.75,w:0.035,h:0.28,c:'#120022'},
      {x:0.79,w:0.03,h:0.35,c:'#0f001c'},
    ];

    buildings.forEach(b => {
      const bx = b.x * W;
      const bw = b.w * W;
      const by = H * 0.6 - b.h * H;
      const bh = b.h * H;

      // Building body
      ctx.fillStyle = b.c;
      ctx.fillRect(bx, by, bw, bh + H * 0.5);

      // Neon windows
      for (let wx = bx + 3; wx < bx + bw - 3; wx += 8) {
        for (let wy = by + 8; wy < H * 0.6 - 4; wy += 12) {
          if (Math.random() > 0.4) {
            const winAlpha = Math.sin(t * 0.3 + wx + wy) * 0.3 + 0.5;
            const hue = Math.random() > 0.5 ? `rgba(180,100,255,${winAlpha*0.7})` : `rgba(0,200,255,${winAlpha*0.5})`;
            ctx.fillStyle = hue;
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }

      // Roof neon lines
      const neonAlpha = Math.sin(t * 2 + b.x * 10) * 0.4 + 0.6;
      ctx.strokeStyle = `rgba(180,79,255,${neonAlpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.stroke();
    });

    // Road surface
    const road = ctx.createLinearGradient(0, H * 0.6, 0, H);
    road.addColorStop(0, 'rgba(10,5,25,0.95)');
    road.addColorStop(1, '#04040a');
    ctx.fillStyle = road;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Road center lines (moving)
    const lineOffset = (t * 80) % 80;
    ctx.strokeStyle = 'rgba(0,229,255,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -lineOffset;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.65);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.7, H * 0.65);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Light trail cars
  const trails = Array.from({length: 6}, (_, i) => ({
    x: Math.random() * W,
    y: H * 0.6 + Math.random() * H * 0.08,
    speed: 2 + Math.random() * 4,
    color: ['#00e5ff','#ff3366','#8b2fc9','#fff','#ff8800'][Math.floor(Math.random()*5)],
    len: 60 + Math.random() * 80
  }));

  let time = 0;
  function animateWorld() {
    requestAnimationFrame(animateWorld);
    time += 0.016;

    drawSkyline(time);

    // Draw light trails
    trails.forEach(tr => {
      tr.x -= tr.speed;
      if (tr.x < -tr.len) {
        tr.x = W + tr.len;
        tr.y = H * 0.6 + Math.random() * H * 0.08;
        tr.speed = 2 + Math.random() * 4;
      }
      const grad = ctx.createLinearGradient(tr.x - tr.len, 0, tr.x, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, tr.color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(tr.x - tr.len, tr.y);
      ctx.lineTo(tr.x, tr.y);
      ctx.stroke();

      // Glow dot
      ctx.globalAlpha = 1;
      ctx.fillStyle = tr.color;
      ctx.shadowColor = tr.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }
  animateWorld();
})();

/* ============================================
   MODULE 4: CINEMATIC LOADER
============================================ */
(function initLoader() {
  const bar     = document.getElementById('loaderBar');
  const pct     = document.getElementById('loaderPct');
  const tagline = document.getElementById('loaderTagline');
  const loader  = document.getElementById('loader');

  const phases = [
    'INITIALIZING ENGINE SYSTEMS...',
    'LOADING WORLD GEOMETRY...',
    'CALIBRATING PHYSICS ENGINE...',
    'STREAMING HORIZON DATA...',
    'REVVING TO 100%...'
  ];

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 3 + 0.5;
    if (progress > 100) progress = 100;

    bar.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
    tagline.textContent = phases[Math.floor(progress / 20)];

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(dismissLoader, 400);
    }
  }, 40);

  function dismissLoader() {
    const tl = gsap.timeline();
    tl.to(loader, {
      clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)',
      duration: 1, ease: 'power4.inOut'
    })
    .to(loader, { display: 'none', duration: 0 })
    .add(() => {
      document.getElementById('nav').style.transform = 'none';
      gsap.to('#nav', { y: 0, duration: 0.8, ease: 'power3.out' });
      initHeroAnimations();
    });
  }
})();

/* ============================================
   MODULE 5: HERO ANIMATIONS
============================================ */
function initHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.6 })
    .to('#titleForza',   { opacity: 1, x: 0, duration: 0.7 }, '-=0.2')
    .to('#titleHorizon', { opacity: 1, x: 0, duration: 0.7 }, '-=0.5')
    .to('#title6',       { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.5)' }, '-=0.4')
    .to('#heroSub',      { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
    .to('#heroDesc',     { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
    .to('.hero-ctas',    { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
    .to('.hero-stats',   { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
    .to('.hero-visual',  { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
    .to('.hero-hud-br',  { opacity: 1, duration: 0.6 }, '-=0.2')
    .to('.scroll-hint',  { opacity: 1, duration: 0.6 }, '-=0.1');

  // Animate stat counters
  document.querySelectorAll('.hstat-val').forEach(el => {
    const target = parseInt(el.dataset.target);
    gsap.to({ val: 0 }, {
      val: target, duration: 2, delay: 1.5, ease: 'power2.out',
      onUpdate: function() { el.textContent = Math.floor(this.targets()[0].val); }
    });
  });

  // Speed counter on HUD
  const speedEl = document.getElementById('speedVal');
  if (speedEl) {
    gsap.timeline({ repeat: -1, repeatDelay: 2, delay: 2 })
      .to({ v: 0 }, {
        v: 312, duration: 3, ease: 'power3.in',
        onUpdate: function() { speedEl.textContent = Math.floor(this.targets()[0].v); }
      })
      .to({ v: 312 }, {
        v: 0, duration: 1.5, ease: 'power2.out', delay: 0.5,
        onUpdate: function() { speedEl.textContent = Math.floor(this.targets()[0].v); }
      });
  }
}

/* ============================================
   MODULE 6: NAV SCROLL BEHAVIOR
============================================ */
(function initNav() {
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: self => nav.classList.toggle('nav-scrolled', self.progress > 0)
  });
})();

/* ============================================
   MODULE 7: FEATURES SCROLL ANIMATIONS
============================================ */
(function initFeaturesScroll() {
  gsap.utils.toArray('.feat-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 88%',
      onEnter: () => {
        gsap.to(card, {
          opacity: 1, y: 0, duration: 0.7,
          delay: (i % 4) * 0.1, ease: 'power3.out'
        });
        card.classList.add('animated');
      }
    });
  });
})();

/* ============================================
   MODULE 8: CAR CARDS ANIMATIONS + 3D TILT
============================================ */
(function initCarCards() {
  // Scroll reveal
  gsap.utils.toArray('.car-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 90%',
      onEnter: () => {
        gsap.to(card, {
          opacity: 1, y: 0, duration: 0.8,
          delay: i * 0.12, ease: 'power3.out'
        });
        card.classList.add('animated');
      }
    });
  });

  // 3D tilt on hover
  document.querySelectorAll('.car-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const rotX  = -(e.clientY - cy) / rect.height * 18;
      const rotY  =  (e.clientX - cx) / rect.width  * 18;
      gsap.to(card.querySelector('.car-card-inner'), {
        rotateX: rotX, rotateY: rotY,
        duration: 0.3, ease: 'power2.out',
        transformPerspective: 800
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card.querySelector('.car-card-inner'), {
        rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out'
      });
    });
  });

  // Car select → open modal
  document.querySelectorAll('.car-select-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => openCarModal(i));
  });

  document.getElementById('modalClose').addEventListener('click', closeCarModal);
  document.querySelector('.car-modal-overlay').addEventListener('click', closeCarModal);
})();

const carData = [
  { make:'BUGATTI', model:'CHIRON SS 300+', class:'S1-900', power:'1577 HP', weight:'1978 KG', drive:'AWD', color:'var(--blue)' },
  { make:'PORSCHE',  model:'911 GT3 RS',    class:'R-800',  power:'525 HP',  weight:'1435 KG', drive:'RWD', color:'var(--green)' },
  { make:'FERRARI',  model:'SF90 STRADALE', class:'S2-998', power:'986 HP',  weight:'1570 KG', drive:'AWD', color:'var(--pink)' },
  { make:'LAMBORGHINI', model:'REVUELTO',   class:'S1-900', power:'1001 HP', weight:'1772 KG', drive:'AWD', color:'var(--blue)' },
];

function openCarModal(idx) {
  const d = carData[idx];
  const modal   = document.getElementById('carModal');
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center">
      <div>
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:${d.color};letter-spacing:0.3em;margin-bottom:8px">${d.class}</div>
        <div style="font-family:var(--font-hud);font-size:0.8rem;color:var(--white-dim);letter-spacing:0.2em">${d.make}</div>
        <div style="font-family:var(--font-hud);font-size:2rem;font-weight:900;color:var(--white);margin-bottom:24px">${d.model}</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[['ENGINE OUTPUT',d.power],['CURB WEIGHT',d.weight],['DRIVETRAIN',d.drive]].map(([l,v]) => `
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--white-dim);letter-spacing:0.1em">${l}</span>
              <span style="font-family:var(--font-hud);font-size:0.75rem;color:${d.color}">${v}</span>
            </div>`).join('')}
        </div>
      </div>
      <div style="text-align:center;padding:40px;border:1px solid rgba(255,255,255,0.06);position:relative;height:200px;overflow:hidden;background:rgba(0,0,0,0.3)">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 60%,${d.color}22 0%,transparent 70%)"></div>
        <div style="position:absolute;bottom:20%;left:50%;transform:translateX(-50%);width:80%;height:40%;
             background:linear-gradient(90deg,transparent,${d.color}44,transparent);
             clip-path:polygon(5% 100%,2% 50%,15% 20%,30% 5%,50% 0%,70% 5%,85% 20%,98% 50%,95% 100%);
             filter:blur(1px) drop-shadow(0 0 20px ${d.color});
             animation:carFloat 3s ease-in-out infinite"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:${d.color};opacity:0.3;box-shadow:0 0 20px ${d.color}"></div>
      </div>
    </div>
  `;
  modal.classList.add('open');
}

function closeCarModal() {
  document.getElementById('carModal').classList.remove('open');
}

/* ============================================
   MODULE 9: WORLD SECTION SCROLL
============================================ */
(function initWorldScroll() {
  gsap.utils.toArray('.world-scene-text').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.8, delay: i * 0.15, ease: 'power3.out' });
      }
    });
  });
})();

/* ============================================
   MODULE 10: GALLERY + LIGHTBOX
============================================ */
(function initGallery() {
  const items   = document.querySelectorAll('.gal-item');
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lightboxImg');
  const lbTitle = document.getElementById('lightboxTitle');
  let   current = 0;

  const galData = [
    { bg: 'linear-gradient(135deg,#100030,#300060,#100030)', title: 'TOKYO DRIFT — 3:47AM' },
    { bg: 'linear-gradient(135deg,#001040,#002060,#001040)', title: 'SUMMIT CHALLENGE — HAKONE PASS' },
    { bg: 'linear-gradient(135deg,#300010,#600020,#300010)', title: 'NEON OVERTAKE — SHIBUYA' },
    { bg: 'linear-gradient(135deg,#001840,#003060,#001840)', title: 'COASTAL RUN — PACIFIC HIGHWAY' },
    { bg: 'linear-gradient(135deg,#201000,#402000,#201000)', title: 'STORM RACING — MT. FUJI' },
  ];

  items.forEach((item, i) => {
    // Scroll reveal
    ScrollTrigger.create({
      trigger: item,
      start: 'top 90%',
      onEnter: () => gsap.fromTo(item,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.7, delay: (i % 3) * 0.08, ease: 'power3.out' }
      )
    });

    // Mouse parallax on bg
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const py = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      item.querySelector('.gal-bg').style.setProperty('--mx', px + '%');
      item.querySelector('.gal-bg').style.setProperty('--my', py + '%');
    });

    item.addEventListener('click', () => {
      current = i;
      openLightbox(i);
    });
  });

  function openLightbox(i) {
    const d = galData[i];
    lbImg.style.background = d.bg + `, radial-gradient(ellipse at 50% 50%, rgba(139,47,201,0.2) 0%, transparent 60%)`;
    lbTitle.textContent = d.title;
    lb.classList.add('open');
    gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  }

  document.getElementById('lightboxClose').addEventListener('click', () => lb.classList.remove('open'));
  document.querySelector('.lightbox-overlay').addEventListener('click', () => lb.classList.remove('open'));
  document.getElementById('lbPrev').addEventListener('click', () => {
    current = (current - 1 + galData.length) % galData.length;
    gsap.fromTo(lbImg, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 });
    openLightbox(current);
  });
  document.getElementById('lbNext').addEventListener('click', () => {
    current = (current + 1) % galData.length;
    gsap.fromTo(lbImg, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 });
    openLightbox(current);
  });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    if (e.key === 'ArrowLeft') document.getElementById('lbPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('lbNext').click();
  });
})();

/* ============================================
   MODULE 11: TRAILER SECTION
============================================ */
(function initTrailer() {
  // Cinematic mask reveal via ScrollTrigger
  const mask = document.getElementById('trailerMask');
  if (mask) {
    ScrollTrigger.create({
      trigger: '#trailer',
      start: 'top 70%',
      onEnter: () => {
        gsap.to(mask, {
          scaleY: 0,
          transformOrigin: 'top',
          duration: 1.2,
          ease: 'power4.inOut'
        });
      }
    });
  }

  // Play button
  const playBtn  = document.getElementById('trailerPlayBtn');
  const iframeWrap = document.getElementById('trailerIframeWrap');
  const iframe   = document.getElementById('trailerIframe');
  if (!playBtn) return;

  playBtn.addEventListener('click', () => {
    // Forza Horizon 5 reveal trailer as placeholder (official Xbox)
    iframe.src = 'https://www.youtube.com/embed/FYH9n37B7Yw?autoplay=1&rel=0';
    iframeWrap.style.display = 'block';
    gsap.fromTo(iframeWrap, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
    gsap.to(playBtn, { opacity: 0, scale: 0, duration: 0.3, onComplete: () => playBtn.style.display = 'none' });
  });
})();

/* ============================================
   MODULE 12: PLATFORMS SCROLL
============================================ */
(function initPlatforms() {
  gsap.utils.toArray('.plat-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 90%',
      onEnter: () => {
        gsap.to(card, { opacity: 1, y: 0, duration: 0.7, delay: i * 0.12, ease: 'power3.out' });
      }
    });
  });
})();

/* ============================================
   MODULE 13: NEWSLETTER
============================================ */
(function initNewsletter() {
  const form    = document.getElementById('nlForm');
  const input   = document.getElementById('nlInput');
  const submit  = document.getElementById('nlSubmit');
  const success = document.getElementById('nlSuccess');
  if (!submit) return;

  submit.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val || !val.includes('@')) {
      gsap.to(form, { x: -8, duration: 0.05, yoyo: true, repeat: 5, ease: 'power1.inOut' });
      return;
    }
    gsap.to(form, {
      opacity: 0, y: -20, duration: 0.4,
      onComplete: () => {
        form.style.display = 'none';
        success.classList.add('show');
      }
    });
  });

  // Typing animation placeholder
  if (input) {
    const texts = ['YOUR.EMAIL@DOMAIN.COM', 'DRIVER.NAME@GRID.COM', 'HORIZON.FAN@RACING.IO'];
    let ti = 0;
    function cyclePlaceholder() {
      input.placeholder = texts[ti % texts.length];
      ti++;
      setTimeout(cyclePlaceholder, 4000);
    }
    cyclePlaceholder();
  }
})();

/* ============================================
   MODULE 14: START ENGINE INTERACTION
============================================ */
(function initStartEngine() {
  const btn     = document.getElementById('startEngine');
  const overlay = document.getElementById('engineOverlay');
  if (!btn || !overlay) return;

  btn.addEventListener('click', () => {
    overlay.classList.add('active');

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          gsap.to(overlay, { opacity: 0, duration: 0.8, onComplete: () => overlay.classList.remove('active') });
          const cars = document.getElementById('cars');
          if (cars) {
            const navHeight = document.getElementById('nav')?.offsetHeight || 80;
            const top = cars.getBoundingClientRect().top + window.scrollY - navHeight - 16;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          }
        }, 1200);
      }
    });

    // Rings animate out
    tl.fromTo('.engine-ring.r1', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .fromTo('.engine-ring.r2', { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.7, duration: 0.4, ease: 'power2.out' }, '-=0.2')
      .fromTo('.engine-ring.r3', { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.4, duration: 0.4, ease: 'power2.out' }, '-=0.2')
      .fromTo('.engine-text',    { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.1')
      .to('.engine-ring.r1',     { scale: 2, opacity: 0, duration: 0.8, ease: 'power2.in' }, '+=0.3')
      .to('.engine-ring.r2',     { scale: 2, opacity: 0, duration: 0.8, ease: 'power2.in' }, '-=0.7')
      .to('.engine-ring.r3',     { scale: 2, opacity: 0, duration: 0.8, ease: 'power2.in' }, '-=0.7');

    // Flash effect
    gsap.to('body', { backgroundColor: '#0a0030', duration: 0.1, yoyo: true, repeat: 3 });
  });
})();

/* ============================================
   MODULE 15: HERO MOUSE PARALLAX
============================================ */
(function initHeroParallax() {
  const hero = document.getElementById('hero');
  if (!hero || isMobile()) return;

  hero.addEventListener('mousemove', e => {
    const rx = (e.clientX / window.innerWidth  - 0.5) * 30;
    const ry = (e.clientY / window.innerHeight - 0.5) * 20;

    gsap.to('#pLayer1', { x: rx * 0.4, y: ry * 0.3, duration: 0.8, ease: 'power2.out' });
    gsap.to('#pLayer2', { x: rx * 0.8, y: ry * 0.6, duration: 0.6, ease: 'power2.out' });
    gsap.to('.hero-content', { x: rx * 0.15, y: ry * 0.1, duration: 1, ease: 'power2.out' });
    gsap.to('.hero-visual', { x: rx * -0.12, y: ry * -0.08, duration: 1, ease: 'power2.out' });
  });
})();

/* ============================================
   MODULE 16: GENERAL SCROLLTRIGGER ANIMATIONS
============================================ */
(function initScrollAnimations() {
  // Section headers
  gsap.utils.toArray('.section-header').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        );
      }
    });
  });

  // Section sub
  gsap.utils.toArray('.section-sub').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6 })
    });
  });

  // Newsletter content
  gsap.utils.toArray('.nl-content > *').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => gsap.fromTo(el,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power3.out' }
      )
    });
  });

  // Footer
  ScrollTrigger.create({
    trigger: '#footer',
    start: 'top 95%',
    onEnter: () => {
      gsap.fromTo('.footer-top', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
    }
  });

  // GSAP ScrollTrigger for world scene
  gsap.to('.wl-city', {
    scrollTrigger: { trigger: '#world', start: 'top bottom', end: 'bottom top', scrub: 2 },
    x: -60
  });
  gsap.to('.wl-mountains', {
    scrollTrigger: { trigger: '#world', start: 'top bottom', end: 'bottom top', scrub: 3 },
    x: -30
  });
})();

/* ============================================
   MODULE 17: NEON FLICKER ON HERO TITLE
============================================ */
(function initFlicker() {
  function flicker(el) {
    const tl = gsap.timeline({ delay: 6 + Math.random() * 4, repeat: -1, repeatDelay: 8 + Math.random() * 6 });
    tl.to(el, { opacity: 0.3, duration: 0.05 })
      .to(el, { opacity: 1,   duration: 0.05 })
      .to(el, { opacity: 0.2, duration: 0.05 })
      .to(el, { opacity: 1,   duration: 0.1 });
  }

  ['#title6', '#titleForza', '#titleHorizon'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) flicker(el);
  });
})();

/* ============================================
   MODULE 18: SMOOTH SCROLL (GSAP ScrollTo polyfill)
============================================ */
(function initSmoothNav() {
  function scrollToSection(target) {
    if (!target) return;
    const navHeight = document.getElementById('nav')?.offsetHeight || 80;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      if (link.getAttribute('href') === '#') return;
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      scrollToSection(target);
    });
  });

  // Hero primary CTA
  const heroCta1 = document.getElementById('heroCta1');
  if (heroCta1) {
    heroCta1.addEventListener('click', () => {
      const carsSection = document.getElementById('cars');
      scrollToSection(carsSection);
    });
  }

  // Scroll-to and play trailer button
  const heroCta2 = document.getElementById('heroCta2');
  if (heroCta2) {
    heroCta2.addEventListener('click', () => {
      const trailerSection = document.getElementById('trailer');
      if (trailerSection) {
        scrollToSection(trailerSection);
        setTimeout(() => document.getElementById('trailerPlayBtn')?.click(), 1400);
      }
    });
  }
})();

/* ============================================
   MODULE 19: DYNAMIC BACKGROUND GRADIENT SHIFT
============================================ */
(function initBgShift() {
  document.addEventListener('mousemove', e => {
    if (isMobile()) return;
    const x = (e.clientX / window.innerWidth  * 100).toFixed(1);
    const y = (e.clientY / window.innerHeight * 100).toFixed(1);
    document.body.style.backgroundImage =
      `radial-gradient(ellipse at ${x}% ${y}%, rgba(139,47,201,0.03) 0%, transparent 60%)`;
  });
})();

/* ============================================
   MODULE 20: PERFORMANCE — Pause off-screen
============================================ */
(function initPerf() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ScrollTrigger.getAll().forEach(st => st.disable());
    } else {
      ScrollTrigger.getAll().forEach(st => st.enable());
    }
  });
})();

console.log('%cFORZA HORIZON 6 ⚡ ENGINE LOADED', 'color:#00e5ff;font-family:monospace;font-size:14px;background:#04040a;padding:8px 16px;');
