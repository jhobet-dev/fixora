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

/* ---------- 2. Three.js floating 3D toolkit behind the hero ---------- */
const canvas = document.getElementById('hero-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
camera.position.z = 9;

function resizeHero() {
  const hero = document.getElementById('hero');
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeHero();
window.addEventListener('resize', resizeHero);

const navyColor = new THREE.Color('#1E3A8A');
const liteColor = new THREE.Color('#6B8AFF');
const ambient = new THREE.AmbientLight(0xffffff, 0.9);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(4, 6, 8);
scene.add(ambient, dirLight);

const shapeGeos = [
  new THREE.IcosahedronGeometry(0.55, 0),
  new THREE.OctahedronGeometry(0.5, 0),
  new THREE.TorusGeometry(0.4, 0.14, 12, 30),
  new THREE.BoxGeometry(0.7, 0.7, 0.7),
  new THREE.ConeGeometry(0.45, 0.9, 6)
];

const shapes = [];
const shapeCount = 9;
for (let i = 0; i < shapeCount; i++) {
  const geo = shapeGeos[i % shapeGeos.length];
  const color = i % 2 === 0 ? navyColor : liteColor;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 4 - 1
  );
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  mesh.userData.speed = 0.15 + Math.random() * 0.25;
  mesh.userData.float = 0.4 + Math.random() * 0.5;
  mesh.userData.offset = Math.random() * Math.PI * 2;
  scene.add(mesh);
  shapes.push(mesh);
}

let mouseX = 0, mouseY = 0;
window.addEventListener('pointermove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5);
  mouseY = (e.clientY / window.innerHeight - 0.5);
});

const clock = new THREE.Clock();
function animateHero() {
  const t = clock.getElapsedTime();
  shapes.forEach((m) => {
    m.rotation.x += 0.0025 * m.userData.speed * 10 * 0.1;
    m.rotation.y += 0.004 * m.userData.speed * 10 * 0.1;
    m.position.y += Math.sin(t * m.userData.speed + m.userData.offset) * 0.0025;
  });
  camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.04;
  camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(animateHero);
}
animateHero();

/* Parallax hero scene + phone tilt tied to scroll */
ScrollTrigger.create({
  trigger: '#hero',
  start: 'top top',
  end: 'bottom top',
  scrub: true,
  onUpdate(self) {
    scene.rotation.y = self.progress * 0.6;
    scene.position.y = self.progress * 1.2;
  }
});

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

/* Active nav highlight (adapted for lerp-scroll positions) */
const secs = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');
ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate() {
    let cur = '';
    secs.forEach(s => {
      const rect = s.getBoundingClientRect();
      if (rect.top < 140) cur = s.id;
    });
    navAs.forEach(a => {
      const active = a.getAttribute('href') === '#' + cur;
      a.style.color = active ? '#091A7A' : '';
      a.style.fontWeight = active ? '700' : '';
    });
  }
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