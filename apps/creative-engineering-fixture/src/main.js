import * as THREE from 'three';
import gsap from 'gsap';
import { Rive } from '@rive-app/canvas';
import './styles.css';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0, 4.2);

const geometry = new THREE.TorusKnotGeometry(0.8, 0.16, 96, 12);
const material = new THREE.MeshNormalMaterial();
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let animation;

function resize() {
  const width = innerWidth;
  const height = innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function configureMotion() {
  animation?.kill();
  gsap.set(mesh.rotation, { x: 0.35, y: 0.3 });
  if (!reducedMotion.matches) {
    animation = gsap.to(mesh.rotation, { y: Math.PI * 2 + 0.3, x: 0.65, duration: 8, repeat: -1, ease: 'none' });
  }
}

function frame() {
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

resize();
configureMotion();
frame();
addEventListener('resize', resize, { passive: true });
reducedMotion.addEventListener?.('change', configureMotion);

document.querySelector('#runtime-status').textContent = `Three r${THREE.REVISION} / GSAP ${gsap.version} / Rive ${typeof Rive === 'function' ? 'ready' : 'unavailable'}`;
window.__AI_STUDIO_CREATIVE_ENGINEERING__ = { threeRevision: THREE.REVISION, gsapVersion: gsap.version, riveAvailable: typeof Rive === 'function' };
