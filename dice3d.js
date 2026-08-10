import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { RoundedBoxGeometry } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/geometries/RoundedBoxGeometry.js";

window.SiteLoader?.report(38, "Motor 3D carregado…");

const canvas = document.getElementById("diceCanvas");
const host = document.getElementById("dice");

if (!canvas || !host) {
  window.__resolveDice3D?.(null);
  window.dispatchEvent(new CustomEvent("dice3d-error", { detail: "Canvas do dado não encontrado." }));
  throw new Error("Canvas do dado não encontrado.");
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  premultipliedAlpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
window.SiteLoader?.report(48, "Preparando renderização 3D…");

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-1.45, 1.45, 1.45, -1.45, 0.1, 20);
// Câmera bem mais frontal: mantém um pouco do topo/lado visível,
// mas deixa a face principal praticamente reta na tela.
camera.position.set(-0.95, 0.85, 5.8);
camera.lookAt(0, 0, 0);

const ambient = new THREE.HemisphereLight(0xffffff, 0xb7bac2, 2.15);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(-3.5, 5.5, 5);
key.castShadow = true;
key.shadow.mapSize.set(512, 512);
key.shadow.camera.left = -4;
key.shadow.camera.right = 4;
key.shadow.camera.top = 4;
key.shadow.camera.bottom = -4;
scene.add(key);

const fill = new THREE.DirectionalLight(0xdde3ef, 1.15);
fill.position.set(4, 1, 2);
scene.add(fill);

const dieGroup = new THREE.Group();
scene.add(dieGroup);
window.SiteLoader?.report(57, "Montando cena 3D…");

/*
  Geometria única com bevel/quinas arredondadas reais.
  Como não existem seis DIVs separados, não existem frestas entre faces.
*/
const geometry = new RoundedBoxGeometry(1.72, 1.72, 1.72, 9, 0.18);
window.SiteLoader?.report(64, "Criando geometria do dado…");

const PIP_POSITIONS = {
  1: [[0, 0]],
  2: [[-0.28, 0.28], [0.28, -0.28]],
  3: [[-0.28, 0.28], [0, 0], [0.28, -0.28]],
  4: [[-0.28, 0.28], [0.28, 0.28], [-0.28, -0.28], [0.28, -0.28]],
  5: [[-0.28, 0.28], [0.28, 0.28], [0, 0], [-0.28, -0.28], [0.28, -0.28]],
  6: [[-0.28, 0.32], [0.28, 0.32], [-0.28, 0], [0.28, 0], [-0.28, -0.32], [0.28, -0.32]]
};

function createFaceTexture(value) {
  const size = 320;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  const bg = ctx.createLinearGradient(30, 15, 285, 305);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(.45, "#fafafa");
  bg.addColorStop(1, "#e5e5e7");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(75, 55, 8, 75, 55, 210);
  glow.addColorStop(0, "rgba(255,255,255,.9)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  for (const [px, py] of PIP_POSITIONS[value]) {
    const x = size * (0.5 + px);
    const y = size * (0.5 - py);
    const r = 27;

    ctx.save();

    ctx.shadowColor = "rgba(0,0,0,.28)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 3;

    const pip = ctx.createRadialGradient(
      x - r * .30,
      y - r * .32,
      r * .12,
      x,
      y,
      r
    );
    pip.addColorStop(0, "#4b4b4b");
    pip.addColorStop(.28, "#202020");
    pip.addColorStop(.72, "#080808");
    pip.addColorStop(1, "#000000");

    ctx.fillStyle = pip;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

const faceTextures = {};
for (let i = 1; i <= 6; i++) {
  faceTextures[i] = createFaceTexture(i);
  window.SiteLoader?.report(64 + i * 3, `Criando textura ${i}/6…`);
}

function makeMaterial(value) {
  return new THREE.MeshStandardMaterial({
    map: faceTextures[value],
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.0
  });
}

/*
  Box/RoundedBox material groups:
  +X, -X, +Y, -Y, +Z, -Z
*/
const materials = [
  makeMaterial(3),
  makeMaterial(4),
  makeMaterial(2),
  makeMaterial(5),
  makeMaterial(1),
  makeMaterial(6)
];

/*
  Contorno real do formato arredondado do dado.
  É uma casca levemente maior renderizada pelo lado interno, então a borda
  acompanha as quinas arredondadas sem criar uma moldura quadrada no canvas.
  Ela só aparece no tema claro, onde o dado branco se perde no fundo branco.
*/
const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0x111111,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.96,
  depthWrite: false
});

const dieOutline = new THREE.Mesh(geometry.clone(), outlineMaterial);
dieOutline.scale.setScalar(1.035);
dieOutline.visible = document.documentElement.dataset.theme !== "dark";
dieGroup.add(dieOutline);

const die = new THREE.Mesh(geometry, materials);
die.castShadow = true;
die.receiveShadow = true;
dieGroup.add(die);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(5.5, 5.5),
  new THREE.ShadowMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.20
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.04;
floor.receiveShadow = true;
scene.add(floor);
window.SiteLoader?.report(88, "Aplicando materiais e sombras…");

const baseRotation = new THREE.Euler(
  0,
  0,
  0,
  "XYZ"
);

const baseQuaternion = new THREE.Quaternion().setFromEuler(baseRotation);

/*
  As texturas agora ficam PRESAS às faces reais do dado.
  Antes, os números eram trocados nas texturas durante o giro e, no fim,
  o dado voltava para a rotação base. Isso criava o efeito de "teleporte".

  Pares opostos do dado físico:
  1 <-> 6, 2 <-> 5, 3 <-> 4.
  Estas rotações levam a face sorteada para a frente sem trocar texturas.
*/
const faceRotations = {
  1: new THREE.Euler(0, 0, 0, "XYZ"),
  2: new THREE.Euler(Math.PI / 2, 0, 0, "XYZ"),
  3: new THREE.Euler(0, -Math.PI / 2, 0, "XYZ"),
  4: new THREE.Euler(0, Math.PI / 2, 0, "XYZ"),
  5: new THREE.Euler(-Math.PI / 2, 0, 0, "XYZ"),
  6: new THREE.Euler(0, Math.PI, 0, "XYZ")
};

function targetQuaternionForFace(value) {
  const faceEuler = faceRotations[value] || faceRotations[1];
  const faceQuaternion = new THREE.Quaternion().setFromEuler(faceEuler);
  return baseQuaternion.clone().multiply(faceQuaternion);
}

function markFace(value) {
  host.dataset.face = String(value);
  host.setAttribute("aria-label", `Dado mostrando ${value}`);
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  renderer.setSize(w, h, false);
}

let animation = null;
let lastTime = performance.now();

function shortestAngleDelta(from, to) {
  const tau = Math.PI * 2;
  let delta = (to - from + Math.PI) % tau;
  if (delta < 0) delta += tau;
  return delta - Math.PI;
}

function spinningEndAngle(start, target, turns, direction) {
  const tau = Math.PI * 2;
  const shortest = shortestAngleDelta(start, target);
  return start + shortest + direction * turns * tau;
}

function renderLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  // Atualiza imediatamente o contorno quando o usuário troca de tema.
  dieOutline.visible = document.documentElement.dataset.theme !== "dark";

  if (animation) {
    animation.elapsed += dt;
    const t = Math.min(1, animation.elapsed / animation.duration);

    // O giro começa rápido e desacelera naturalmente até a face sorteada.
    const e = 1 - Math.pow(1 - t, 3);
    const settle = 1 - t;

    dieGroup.rotation.set(
      animation.startX + (animation.endX - animation.startX) * e +
        Math.sin(t * Math.PI * 5) * 0.035 * settle,
      animation.startY + (animation.endY - animation.startY) * e +
        Math.sin(t * Math.PI * 4) * 0.03 * settle,
      animation.startZ + (animation.endZ - animation.startZ) * e,
      "XYZ"
    );

    // Pequeno salto para dar sensação de dado sendo lançado.
    dieGroup.position.y = Math.sin(Math.PI * t) * 0.36;

    const squash = 1 + Math.sin(Math.PI * Math.min(1, t * 1.45)) * 0.032;
    dieGroup.scale.set(1 / squash, squash, 1 / squash);

    if (t >= 1) {
      const { resolve, result, targetQuaternion } = animation;
      animation = null;

      // A orientação final é a mesma que a animação acabou de alcançar.
      // Copiar o quaternion aqui só elimina erro de ponto flutuante; não há salto.
      dieGroup.quaternion.copy(targetQuaternion);
      dieGroup.position.set(0, 0, 0);
      dieGroup.scale.set(1, 1, 1);
      markFace(result);

      resolve();
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}

function setFace(value) {
  if (animation) {
    animation.resolve();
    animation = null;
  }

  dieGroup.quaternion.copy(targetQuaternionForFace(value));
  dieGroup.position.set(0, 0, 0);
  dieGroup.scale.set(1, 1, 1);
  markFace(value);
}

function rollTo(value) {
  return new Promise(resolve => {
    if (animation) {
      animation.resolve();
      animation = null;
    }

    const targetQuaternion = targetQuaternionForFace(value);
    const targetEuler = new THREE.Euler().setFromQuaternion(targetQuaternion, "XYZ");

    // Mantém a rotação atual como ponto de partida para não haver nenhum corte.
    const startX = dieGroup.rotation.x;
    const startY = dieGroup.rotation.y;
    const startZ = dieGroup.rotation.z;

    const directionX = Math.random() > 0.5 ? 1 : -1;
    const directionY = Math.random() > 0.5 ? 1 : -1;
    const directionZ = Math.random() > 0.5 ? 1 : -1;

    animation = {
      result: value,
      resolve,
      targetQuaternion,
      elapsed: 0,
      duration: 1.12,
      startX,
      startY,
      startZ,
      endX: spinningEndAngle(startX, targetEuler.x, 3 + Math.floor(Math.random() * 2), directionX),
      endY: spinningEndAngle(startY, targetEuler.y, 4 + Math.floor(Math.random() * 2), directionY),
      endZ: spinningEndAngle(startZ, targetEuler.z, 2 + Math.floor(Math.random() * 2), directionZ)
    };
  });
}

const ro = new ResizeObserver(resize);
ro.observe(canvas);

resize();
setFace(Number(window.__pendingDiceFace || 1));
window.SiteLoader?.report(94, "Compilando cena 3D…");
renderer.compile(scene, camera);
renderer.render(scene, camera);
window.SiteLoader?.report(98, "Finalizando dado 3D…");
requestAnimationFrame(renderLoop);

window.Dice3D = {
  setFace,
  rollTo
};

window.__resolveDice3D?.(window.Dice3D);
window.SiteLoader?.report(100, "3D pronto");
window.dispatchEvent(new CustomEvent("dice3d-ready"));
