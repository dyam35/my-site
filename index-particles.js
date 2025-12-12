/* global p5 */

const INDEX_PARTICLES = {
  particleMinRadius: 1.2,
  particleMaxRadius: 2.9,
  baseSpeed: 0.85,
  connectDistance: 135,
  maxConnectionsPerParticle: 12,
  trailFade: 0.12,
};

new p5((p) => {
  let particles = [];
  let connectDistanceSq = INDEX_PARTICLES.connectDistance * INDEX_PARTICLES.connectDistance;
  let canvasEl = null;

  class Particle {
    constructor(position, velocity, radius) {
      this.position = position.copy();
      this.velocity = velocity.copy();
      this.radius = radius;
      this.connectionCount = 0;
      this.hue = p.random(200, 225);
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
      p.noStroke();
      p.fill(p.color(`hsla(${this.hue}, 95%, 78%, 0.95)`));
      p.circle(this.position.x, this.position.y, this.radius * 2);
    }
  }

  function desiredParticleCount() {
    const area = p.width * p.height;
    const density = 1 / 18000;
    return p.constrain(Math.floor(area * density), 60, 220);
  }

  function spawnParticles(count) {
    for (let i = 0; i < count; i += 1) {
      const position = p.createVector(p.random(p.width), p.random(p.height));
      const angle = p.random(p.TWO_PI);
      const speed = p.random(INDEX_PARTICLES.baseSpeed * 0.55, INDEX_PARTICLES.baseSpeed * 1.35);
      const velocity = p5.Vector.fromAngle(angle).mult(speed);
      const radius = p.random(INDEX_PARTICLES.particleMinRadius, INDEX_PARTICLES.particleMaxRadius);
      particles.push(new Particle(position, velocity, radius));
    }
  }

  function resetParticles() {
    particles = [];
    spawnParticles(desiredParticleCount());
  }

  function pageHeight() {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollHeight, body.scrollHeight, doc.clientHeight, window.innerHeight);
  }

  function resizeToPage() {
    const h = pageHeight();
    p.resizeCanvas(p.windowWidth, h);
    connectDistanceSq = INDEX_PARTICLES.connectDistance * INDEX_PARTICLES.connectDistance;
    if (canvasEl) canvasEl.style("height", `${h}px`);
  }

  function drawConnections() {
    p.strokeWeight(1.15);

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      if (a.connectionCount >= INDEX_PARTICLES.maxConnectionsPerParticle) continue;

      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        if (a.connectionCount >= INDEX_PARTICLES.maxConnectionsPerParticle) break;
        if (b.connectionCount >= INDEX_PARTICLES.maxConnectionsPerParticle) continue;

        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > connectDistanceSq) continue;

        const d = Math.sqrt(d2);
        const alpha = p.map(d, 0, INDEX_PARTICLES.connectDistance, 0.6, 0.0, true);
        p.stroke(210, 95, 80, alpha);
        p.line(a.position.x, a.position.y, b.position.x, b.position.y);
        a.connectionCount += 1;
        b.connectionCount += 1;
      }
    }
  }

  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, pageHeight());
    canvasEl = canvas;
    canvas.id("particles-bg");
    canvas.style("position", "absolute");
    canvas.style("top", "0");
    canvas.style("left", "0");
    canvas.style("z-index", "0");
    canvas.style("pointer-events", "none");

    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    p.colorMode(p.HSL, 360, 100, 100, 1);

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) p.noLoop();

    p.clear();
    resetParticles();
  };

  p.draw = () => {
    // 透明キャンバス上での軌跡: destination-outで徐々に透明化して消す
    const ctx = p.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    p.noStroke();
    p.fill(0, 0, 0, INDEX_PARTICLES.trailFade);
    p.rect(0, 0, p.width, p.height);
    ctx.restore();

    const bounds = { w: p.width, h: p.height };
    for (const particle of particles) particle.step(bounds);

    drawConnections();

    for (const particle of particles) particle.draw();

    const target = desiredParticleCount();
    if (particles.length < target) spawnParticles(Math.min(4, target - particles.length));
    if (particles.length > target) particles.splice(0, particles.length - target);
  };

  p.windowResized = () => {
    resizeToPage();
  };
});
