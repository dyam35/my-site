/* global p5 */

const CONFIG = {
  backgroundAlpha: 22,
  particleMinRadius: 1.4,
  particleMaxRadius: 2.8,
  baseSpeed: 0.9,
  connectDistance: 140,
  maxConnectionsPerParticle: 14,
  mouseAttractionRadius: 220,
  mouseAttractionStrength: 0.06,
  clickSpawnCount: 10,
};

let particles = [];
let connectDistanceSq = CONFIG.connectDistance * CONFIG.connectDistance;

class Particle {
  constructor(position, velocity, radius) {
    this.position = position.copy();
    this.velocity = velocity.copy();
    this.radius = radius;
    this.connectionCount = 0;
    this.hue = random(190, 220);
  }

  step(bounds) {
    this.position.add(this.velocity);

    if (this.position.x < -this.radius) this.position.x = bounds.w + this.radius;
    if (this.position.x > bounds.w + this.radius) this.position.x = -this.radius;
    if (this.position.y < -this.radius) this.position.y = bounds.h + this.radius;
    if (this.position.y > bounds.h + this.radius) this.position.y = -this.radius;

    this.connectionCount = 0;
  }

  draw() {
    noStroke();
    const c = color(`hsla(${this.hue}, 90%, 70%, 0.95)`);
    fill(c);
    circle(this.position.x, this.position.y, this.radius * 2);
  }
}

function desiredParticleCount() {
  const area = width * height;
  const density = 1 / 14000;
  return constrain(Math.floor(area * density), 60, 170);
}

function spawnParticles(count) {
  for (let i = 0; i < count; i += 1) {
    const position = createVector(random(width), random(height));
    const angle = random(TWO_PI);
    const speed = random(CONFIG.baseSpeed * 0.55, CONFIG.baseSpeed * 1.35);
    const velocity = p5.Vector.fromAngle(angle).mult(speed);
    const radius = random(CONFIG.particleMinRadius, CONFIG.particleMaxRadius);
    particles.push(new Particle(position, velocity, radius));
  }
}

function resetParticles() {
  particles = [];
  spawnParticles(desiredParticleCount());
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  colorMode(HSL, 360, 100, 100, 1);
  resetParticles();
}

function applyMouseAttraction() {
  if (!mouseIsPressed) return;

  const mouse = createVector(mouseX, mouseY);
  for (const particle of particles) {
    const toMouse = p5.Vector.sub(mouse, particle.position);
    const d2 = toMouse.magSq();
    if (d2 < 1 || d2 > CONFIG.mouseAttractionRadius * CONFIG.mouseAttractionRadius) continue;

    const t = 1 - d2 / (CONFIG.mouseAttractionRadius * CONFIG.mouseAttractionRadius);
    toMouse.setMag(CONFIG.mouseAttractionStrength * t);
    particle.velocity.add(toMouse);
  }
}

function drawConnections() {
  strokeWeight(1);

  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    if (a.connectionCount >= CONFIG.maxConnectionsPerParticle) continue;

    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      if (a.connectionCount >= CONFIG.maxConnectionsPerParticle) break;
      if (b.connectionCount >= CONFIG.maxConnectionsPerParticle) continue;

      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > connectDistanceSq) continue;

      const d = Math.sqrt(d2);
      const alpha = map(d, 0, CONFIG.connectDistance, 0.55, 0.0, true);
      stroke(210, 90, 72, alpha);
      line(a.position.x, a.position.y, b.position.x, b.position.y);
      a.connectionCount += 1;
      b.connectionCount += 1;
    }
  }
}

function draw() {
  background(225, 65, 6, CONFIG.backgroundAlpha / 255);

  applyMouseAttraction();

  const bounds = { w: width, h: height };
  for (const particle of particles) particle.step(bounds);

  drawConnections();

  for (const particle of particles) particle.draw();

  // 自然に粒子数を追従（リサイズ等）
  const target = desiredParticleCount();
  if (particles.length < target) spawnParticles(Math.min(6, target - particles.length));
  if (particles.length > target) particles.splice(0, particles.length - target);
}

function mousePressed() {
  // UIカードのクリック等で誤爆しにくいように、画面内クリックだけ追加する
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  const base = createVector(mouseX, mouseY);
  for (let i = 0; i < CONFIG.clickSpawnCount; i += 1) {
    const jitter = p5.Vector.random2D().mult(random(6, 26));
    const position = p5.Vector.add(base, jitter);
    const velocity = p5.Vector.random2D().mult(random(0.6, 1.8));
    const radius = random(CONFIG.particleMinRadius, CONFIG.particleMaxRadius);
    particles.push(new Particle(position, velocity, radius));
  }
}

function keyPressed() {
  if (key === "r" || key === "R") resetParticles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  connectDistanceSq = CONFIG.connectDistance * CONFIG.connectDistance;
}

