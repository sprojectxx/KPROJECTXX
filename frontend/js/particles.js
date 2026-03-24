/* ============================================================
   particles.js — Floating Levitation + Cursor Repulsion
   Inspired by the Google Antigravity ambient particle field.
   Tiny pill/dash particles float upward across the full viewport;
   the cursor pushes them away like a magnetic field.
   ============================================================ */

(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = (canvas.width  = window.innerWidth);
  let H = (canvas.height = window.innerHeight);

  /* ── Mouse ────────────────────────────────────────────────── */
  const mouse = { x: -9999, y: -9999, active: false };
  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  document.addEventListener('mouseleave', () => { mouse.active = false; });

  /* ── Touch support ────────────────────────────────────────── */
  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    mouse.x = t.clientX;
    mouse.y = t.clientY;
    mouse.active = true;
  }, { passive: true });
  document.addEventListener('touchend', () => { mouse.active = false; });

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  /* ── Color palette — gold / amber tones ───────────────────── */
  const COLORS = [
    'rgba(201, 147, 10,  ALPHA)',   // deep gold
    'rgba(240, 180, 41,  ALPHA)',   // bright amber
    'rgba(232, 201, 106, ALPHA)',   // pale gold
    'rgba(180, 120,   8, ALPHA)',   // dark amber
    'rgba(255, 200,  60, ALPHA)',   // warm yellow-gold
    'rgba(160,  95,   5, ALPHA)',   // bronze
  ];

  function pickColor(alpha) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return c.replace('ALPHA', alpha.toFixed(2));
  }

  /* ── Particle Class ───────────────────────────────────────── */
  class Particle {
    constructor(randomY = false) {
      this.reset(randomY);
    }

    reset(atBottom = false) {
      // Spread evenly across the full viewport width
      this.x  = Math.random() * W;
      // Start at random height if initializing; otherwise respawn from bottom
      this.y  = atBottom ? H + Math.random() * 60 : Math.random() * H;

      // Base upward drift (antigravity)
      this.baseVY = -(Math.random() * 0.45 + 0.12);  // -0.12 to -0.57 px/frame (slow float)
      this.baseVX = (Math.random() - 0.5) * 0.18;    // slight sideways wander

      // Actual velocity (modified by cursor repulsion)
      this.vx = this.baseVX;
      this.vy = this.baseVY;

      // Particle size — tiny pill shape, like the Antigravity site
      this.w = Math.random() * 2.5 + 1.2;   // width  1.2–3.7 px
      this.h = Math.random() * 5   + 3;     // height 3–8 px

      // Rotation angle — slight tilt, rotates slowly
      this.angle    = (Math.random() - 0.5) * Math.PI * 0.6;
      this.rotSpeed = (Math.random() - 0.5) * 0.008;

      // Opacity — soft, minimal
      this.alpha = Math.random() * 0.5 + 0.15;   // 0.15 – 0.65

      // Final fill color
      this.color = pickColor(this.alpha);

      // Repulsion recovery — how fast it returns to base velocity
      this.recovery = 0.04 + Math.random() * 0.02;
    }

    update() {
      /* ── Cursor repulsion ──────────────────────────────────── */
      if (mouse.active) {
        const dx   = this.x - mouse.x;
        const dy   = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const RADIUS = 120;

        if (dist < RADIUS && dist > 0) {
          const force    = (1 - dist / RADIUS) * 2.2;  // max push force
          const nx = dx / dist;
          const ny = dy / dist;
          this.vx += nx * force;
          this.vy += ny * force;
        }
      }

      /* ── Return to base velocity ───────────────────────────── */
      this.vx += (this.baseVX - this.vx) * this.recovery;
      this.vy += (this.baseVY - this.vy) * this.recovery;

      /* ── Move & rotate ─────────────────────────────────────── */
      this.x     += this.vx;
      this.y     += this.vy;
      this.angle += this.rotSpeed;

      /* ── Wrap horizontally ─────────────────────────────────── */
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;

      /* ── Respawn at bottom when exiting top ────────────────── */
      if (this.y < -20) this.reset(true);
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      // Draw pill (rounded rect) — simple rounded rectangle
      const hw = this.w / 2;
      const hh = this.h / 2;
      const r  = hw;             // corner radius = half-width → capsule shape
      ctx.beginPath();
      ctx.moveTo(-hw + r, -hh);
      ctx.lineTo( hw - r, -hh);
      ctx.arcTo(  hw,     -hh,  hw,  -hh + r, r);
      ctx.lineTo( hw,      hh - r);
      ctx.arcTo(  hw,      hh,  hw - r, hh, r);
      ctx.lineTo(-hw + r,  hh);
      ctx.arcTo( -hw,      hh, -hw,  hh - r, r);
      ctx.lineTo(-hw,     -hh + r);
      ctx.arcTo( -hw,     -hh, -hw + r, -hh, r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── Create particle pool ─────────────────────────────────── */
  const COUNT = Math.min(280, Math.floor((W * H) / 6000));
  const particles = Array.from({ length: COUNT }, () => new Particle(false));

  /* ── Animation loop ───────────────────────────────────────── */
  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
  }

  loop();
})();
