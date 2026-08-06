gsap.registerPlugin(ScrollTrigger);

/* ---------- 1. Buttery lerp-based smooth scroll ---------- */
const wrapper = document.getElementById('smooth-wrapper');
const content = document.getElementById('smooth-content');
let current = 0, target = 0, ease = 0.085;
let bodyHeight = 0;

function setBodyHeight() {
  bodyHeight = content.getBoundingClientRect().height;
  document.body.style.height = bodyHeight + 'px';
}
setBodyHeight();
window.addEventListener('resize', setBodyHeight);

wrapper.style.position = 'fixed';
wrapper.style.top = 0; wrapper.style.left = 0; wrapper.style.width = '100%';
wrapper.style.overflow = 'hidden';

function smoothLoop() {
  target = window.scrollY;
  current += (target - current) * ease;
  content.style.transform = `translate3d(0, ${-current}px, 0)`;
  ScrollTrigger.update();
  requestAnimationFrame(smoothLoop);
}
requestAnimationFrame(smoothLoop);

ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) {
    if (arguments.length) { window.scrollTo(0, value); }
    return current;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  },
  pinType: content.style.transform ? 'transform' : 'fixed'
});
ScrollTrigger.defaults({ scroller: document.body });
ScrollTrigger.addEventListener('refresh', setBodyHeight);
ScrollTrigger.refresh();

/* ---------- 2. Bold, full-page Three.js background (behind every section) ---------- */
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1136, 0.028);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 11;

function resizeBG() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeBG();
window.addEventListener('resize', resizeBG);

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(4, 6, 8);
const pointLight = new THREE.PointLight(0x6B8AFF, 3, 45);
pointLight.position.set(0, 0, 6);
scene.add(ambient, dirLight, pointLight);

/* Brand palette used for bold, glowing shape colors */
const palette = [0x6B8AFF, 0x10B981, 0xF59E0B, 0xADC8FF, 0xFFFFFF];

/* Per-section accent colors — the point light lerps toward these as each section scrolls into view */
const sectionColors = {
  hero: 0x6B8AFF, how: 0x6B8AFF, services: 0x10B981,
  why: 0xF59E0B, provider: 0xADC8FF, download: 0x10B981
};
const targetColor = new THREE.Color(sectionColors.hero);

const shapeGeos = [
  new THREE.IcosahedronGeometry(0.7, 0),
  new THREE.OctahedronGeometry(0.65, 0),
  new THREE.TorusGeometry(0.5, 0.18, 16, 40),
  new THREE.TorusKnotGeometry(0.4, 0.13, 90, 12),
  new THREE.BoxGeometry(0.85, 0.85, 0.85),
  new THREE.ConeGeometry(0.55, 1.05, 7),
  new THREE.DodecahedronGeometry(0.6, 0)
];

const group = new THREE.Group();
scene.add(group);

const shapes = [];
const shapeCount = 32;
for (let i = 0; i < shapeCount; i++) {
  const geo = shapeGeos[i % shapeGeos.length];
  const color = palette[i % palette.length];
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.4,
    roughness: 0.3, metalness: 0.25, transparent: true, opacity: 0.9
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 16,
    (Math.random() - 0.5) * 34,   // tall vertical spread so shapes are visible all the way down the page
    (Math.random() - 0.5) * 10 - 2
  );
  mesh.scale.setScalar(0.6 + Math.random() * 1.1);
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  mesh.userData.speed = 0.2 + Math.random() * 0.4;
  mesh.userData.offset = Math.random() * Math.PI * 2;
  mesh.userData.drift = 0.6 + Math.random() * 1.4;
  group.add(mesh);
  shapes.push(mesh);
}

let mouseX = 0, mouseY = 0;
window.addEventListener('pointermove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5);
  mouseY = (e.clientY / window.innerHeight - 0.5);
});

/* Merge scroll-progress tracking, per-section color targeting, and nav highlighting into one listener */
let scrollProgress = 0;
const secs = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');
ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate(self) {
    scrollProgress = self.progress;
    let cur = '';
    secs.forEach(s => {
      const rect = s.getBoundingClientRect();
      if (rect.top < 140) cur = s.id;
    });
    if (sectionColors[cur] !== undefined) targetColor.set(sectionColors[cur]);
    navAs.forEach(a => {
      const active = a.getAttribute('href') === '#' + cur;
      a.style.color = active ? '#091A7A' : '';
      a.style.fontWeight = active ? '700' : '';
    });
  }
});

const clock = new THREE.Clock();
function animateBG() {
  const t = clock.getElapsedTime();
  shapes.forEach((m) => {
    m.rotation.x += 0.004 * m.userData.speed * 10 * 0.1;
    m.rotation.y += 0.007 * m.userData.speed * 10 * 0.1;
    m.position.y += Math.sin(t * m.userData.speed + m.userData.offset) * 0.004 * m.userData.drift;
  });
  group.rotation.y = scrollProgress * Math.PI * 0.6 + t * 0.015;
  group.position.y = -scrollProgress * 6;

  pointLight.position.x = Math.sin(t * 0.3) * 5;
  pointLight.position.y = Math.cos(t * 0.25) * 3;
  pointLight.color.lerp(targetColor, 0.02);

  camera.position.x += (mouseX * 1.6 - camera.position.x) * 0.04;
  camera.position.y += (-mouseY * 1.6 - camera.position.y) * 0.04;
  camera.position.z = 11 + Math.sin(t * 0.15) * 0.6;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animateBG);
}
animateBG();

/* Phone mockup tilt (hero) */
const phone = document.getElementById('phone3d');
window.addEventListener('pointermove', (e) => {
  const rx = ((e.clientY / window.innerHeight) - 0.5) * -14;
  const ry = ((e.clientX / window.innerWidth) - 0.5) * 24 - 18;
  phone.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
});

/* ---------- 3. Scroll-triggered 3D reveals ---------- */
gsap.utils.toArray('.tilt-item').forEach((el, i) => {
  gsap.fromTo(el,
    { opacity: 0, y: 60, rotateX: -35, transformPerspective: 900 },
    {
      opacity: 1, y: 0, rotateX: 0,
      duration: 0.9, ease: 'power3.out',
      delay: (i % 4) * 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    }
  );
});

gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.fromTo(el,
    { opacity: 0, y: 40, rotateX: -20, transformPerspective: 900 },
    {
      opacity: 1, y: 0, rotateX: 0,
      duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
    }
  );
});

gsap.to('.prov-inner', {
  rotateX: 0, y: 0, opacity: 1,
  scrollTrigger: {
    trigger: '#provider', start: 'top 70%', end: 'top 20%', scrub: 1
  }
});

gsap.fromTo('.dl-ph.p1', { rotateY: -40, y: 40, opacity: 0 }, {
  rotateY: -14, y: 0, opacity: 1,
  scrollTrigger: { trigger: '#download', start: 'top 75%', end: 'top 30%', scrub: 1 }
});
gsap.fromTo('.dl-ph.p2', { rotateY: 40, y: -40, opacity: 0 }, {
  rotateY: 14, y: 0, opacity: 1,
  scrollTrigger: { trigger: '#download', start: 'top 75%', end: 'top 30%', scrub: 1 }
});

/* Smooth in-page anchor scrolling that respects the lerp scroller */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});
