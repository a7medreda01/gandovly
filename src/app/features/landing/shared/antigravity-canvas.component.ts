import {
  AfterViewInit,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  input
} from '@angular/core';

interface Particle {
  // Base orbital parameters around 3D center
  angle: number;
  ringRadius: number;
  ySpread: number;
  zBase: number;
  angularSpeed: number;
  bobPhase: number;
  bobSpeed: number;
  // Current 3D world offset from home position
  ox: number;
  oy: number;
  oz: number;
  vx: number;
  vy: number;
  vz: number;
  // Screen projection & stroke visuals
  screenX: number;
  screenY: number;
  prevScreenX: number;
  prevScreenY: number;
  scale: number;
  baseLen: number;
  baseWidth: number;
  baseAlpha: number;
  color: string;
}

const SPECTRUM_COLORS = [
  '#10B981', // MeCart Emerald
  '#10B981',
  '#06B6D4', // Cyan
  '#3B82F6', // Royal Blue
  '#3B82F6',
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#F59E0B', // Sparse Warm Spark
  '#EC4899'  // Sparse Accent
];

@Component({
  selector: 'app-antigravity-canvas',
  standalone: true,
  template: `<canvas #canvas class="ag-canvas" aria-hidden="true"></canvas>`,
  host: {
    '[class.is-ambient]': 'mode() === "ambient"'
  },
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }
    :host.is-ambient {
      position: fixed;
    }
    .ag-canvas {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
  `]
})
export class AntigravityCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  mode = input<'hero' | 'ambient'>('hero');

  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private rafId: number | null = null;
  private resizeObserver?: ResizeObserver;

  private pointerActive = false;
  private pointerX = 0;
  private pointerY = 0;
  private scrollPitch = 0;
  private targetScrollPitch = 0;
  private pulseTime = -10;
  private pulseX = 0;
  private pulseY = 0;
  private reducedMotion = false;
  private startTime = 0;
  private needsPrevSync = true;

  private readonly onPointerMove = (e: PointerEvent) => {
    if (!this.canvasRef?.nativeElement) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= -100 && x <= rect.width + 100 && y >= -100 && y <= rect.height + 100) {
      this.pointerActive = true;
      this.pointerX = x;
      this.pointerY = y;
    } else {
      this.pointerActive = false;
    }
  };

  private readonly onPointerLeave = () => {
    this.pointerActive = false;
  };

  private readonly onPointerDown = (e: PointerEvent) => {
    if (!this.canvasRef?.nativeElement || this.reducedMotion) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pulseX = e.clientX - rect.left;
    this.pulseY = e.clientY - rect.top;
    this.pulseTime = performance.now();
  };

  private readonly onScroll = () => {
    if (typeof window === 'undefined') return;
    this.targetScrollPitch = Math.min(0.35, window.scrollY * 0.00045);
  };

  private readonly onVisibilityChange = () => {
    if (typeof document === 'undefined' || this.reducedMotion) return;
    if (document.hidden) {
      this.stopLoop();
    } else {
      this.startLoop();
    }
  };

  private readonly onWindowResize = () => {
    this.measureAndBuild();
  };

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;

    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.startTime = performance.now();
    this.measureAndBuild();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measureAndBuild());
      this.resizeObserver.observe(canvas);
    }

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onWindowResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    if (this.reducedMotion) {
      this.stepAndDraw(this.startTime, true);
    } else {
      this.startLoop();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && !changes['mode'].firstChange && typeof window !== 'undefined') {
      this.measureAndBuild();
    }
  }

  ngOnDestroy(): void {
    this.stopLoop();
    this.resizeObserver?.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerleave', this.onPointerLeave);
      window.removeEventListener('pointerdown', this.onPointerDown);
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onWindowResize);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  private measureAndBuild(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || typeof window === 'undefined') return;

    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(1, Math.floor(rect.width || window.innerWidth));
    const nextH = Math.max(1, Math.floor(rect.height || window.innerHeight));
    const nextDpr = Math.min(2, window.devicePixelRatio || 1);

    if (nextW === this.width && nextH === this.height && nextDpr === this.dpr && this.particles.length > 0) {
      return;
    }

    this.width = nextW;
    this.height = nextH;
    this.dpr = nextDpr;
    canvas.width = Math.floor(nextW * nextDpr);
    canvas.height = Math.floor(nextH * nextDpr);

    this.buildParticles();
    if (this.reducedMotion) {
      this.stepAndDraw(performance.now(), true);
    }
  }

  private buildParticles(): void {
    const isHero = this.mode() === 'hero';
    const isMobile = this.width < 768;
    const count = isHero ? (isMobile ? 115 : 230) : (isMobile ? 45 : 80);
    const maxDim = Math.max(this.width, this.height);
    const minDim = Math.min(this.width, this.height);

    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const goldenRatio = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;

      // Distribute along an open toroidal / orbital halo keeping the hero text center airy
      const ringMin = isHero ? minDim * 0.23 : minDim * 0.30;
      const ringMax = isHero ? maxDim * 0.56 : maxDim * 0.62;
      const ringRadius = ringMin + Math.pow(Math.random(), 0.78) * (ringMax - ringMin);

      const ySpread = (Math.random() - 0.5) * (isHero ? this.height * 0.68 : this.height * 0.85);
      const zBase = (Math.random() - 0.5) * 520;

      const color = SPECTRUM_COLORS[
        Math.random() < 0.88
          ? Math.floor(Math.random() * 7)
          : 7 + Math.floor(Math.random() * 2)
      ];

      list.push({
        angle: goldenRatio,
        ringRadius,
        ySpread,
        zBase,
        angularSpeed: (0.00012 + Math.random() * 0.00018) * (Math.random() < 0.15 ? -1 : 1),
        bobPhase: Math.random() * Math.PI * 2,
        bobSpeed: 0.0008 + Math.random() * 0.001,
        ox: 0,
        oy: 0,
        oz: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        screenX: this.width * 0.5,
        screenY: this.height * 0.5,
        prevScreenX: this.width * 0.5,
        prevScreenY: this.height * 0.5,
        scale: 1,
        baseLen: isHero ? (7 + Math.random() * 11) : (6 + Math.random() * 8),
        baseWidth: isHero ? (2.1 + Math.random() * 1.9) : (1.8 + Math.random() * 1.4),
        baseAlpha: isHero ? (0.34 + Math.random() * 0.48) : (0.18 + Math.random() * 0.28),
        color
      });
    }
    this.particles = list;
    this.needsPrevSync = true;
  }

  private startLoop(): void {
    if (this.rafId !== null) return;
    const tick = (now: number) => {
      this.stepAndDraw(now, false);
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private stepAndDraw(now: number, staticFrame: boolean): void {
    const ctx = this.ctx;
    if (!ctx || this.width === 0 || this.height === 0) return;

    const elapsed = now - this.startTime;
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const focal = 620;

    // Gentle camera pitch tilt from scroll
    this.scrollPitch += (this.targetScrollPitch - this.scrollPitch) * 0.06;
    const cosPitch = Math.cos(this.scrollPitch);
    const sinPitch = Math.sin(this.scrollPitch);

    // Expanding 3D pulse wave on click/tap
    const pulseAge = now - this.pulseTime;
    const hasPulse = !staticFrame && pulseAge >= 0 && pulseAge < 850;
    const pulseRadius = hasPulse ? (pulseAge / 850) * 420 : 0;

    const isHero = this.mode() === 'hero';
    const pointerInfluenceRadius = isHero ? 195 : 150;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    // Update 3D physics and project
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!staticFrame) {
        p.angle += p.angularSpeed * 16;
      }

      const bob = Math.sin(elapsed * p.bobSpeed + p.bobPhase) * 16;
      const hx = Math.cos(p.angle) * p.ringRadius * (isHero ? 1.05 : 1.15);
      const hy = Math.sin(p.angle) * (p.ringRadius * 0.42) + p.ySpread * 0.45 + bob;
      const hz = Math.sin(p.angle * 1.4 + p.bobPhase) * 140 + p.zBase;

      // Apply scroll tilt around X axis
      const ty = hy * cosPitch - hz * sinPitch;
      const tz = hy * sinPitch + hz * cosPitch;

      const curX = hx + p.ox;
      const curY = ty + p.oy;
      const curZ = tz + p.oz;

      const depth = Math.max(140, focal + curZ);
      const scale = focal / depth;

      p.prevScreenX = this.needsPrevSync ? cx + curX * scale : p.screenX;
      p.prevScreenY = this.needsPrevSync ? cy + curY * scale : p.screenY;
      p.screenX = cx + curX * scale;
      p.screenY = cy + curY * scale;
      p.scale = scale;

      if (!staticFrame) {
        // Spring force back toward home orbit
        p.vx += -p.ox * 0.042;
        p.vy += -p.oy * 0.042;
        p.vz += -p.oz * 0.042;

        // Magnetic swirl & soft repulsion near pointer
        if (this.pointerActive) {
          const dx = p.screenX - this.pointerX;
          const dy = p.screenY - this.pointerY;
          const distSq = dx * dx + dy * dy;
          if (distSq < pointerInfluenceRadius * pointerInfluenceRadius && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / pointerInfluenceRadius);
            const nx = dx / dist;
            const ny = dy / dist;
            // Repel outward + subtle tangential swirl
            p.vx += (nx * 1.85 - ny * 1.15) * force * (1.2 / Math.max(0.5, scale));
            p.vy += (ny * 1.85 + nx * 1.15) * force * (1.2 / Math.max(0.5, scale));
            p.vz -= force * 2.2;
          }
        }

        // Click impulse ripple
        if (hasPulse) {
          const dx = p.screenX - this.pulseX;
          const dy = p.screenY - this.pulseY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.abs(dist - pulseRadius);
          if (band < 75) {
            const impulse = (1 - band / 75) * (1 - pulseAge / 850) * 3.8;
            p.vx += (dx / dist) * impulse;
            p.vy += (dy / dist) * impulse;
            p.vz -= impulse * 2.5;
          }
        }

        // Harmonic damping
        p.vx *= 0.87;
        p.vy *= 0.87;
        p.vz *= 0.87;

        p.ox += p.vx;
        p.oy += p.vy;
        p.oz += p.vz;
      }
    }

    // Painter's depth order (back-to-front)
    this.particles.sort((a, b) => a.scale - b.scale);

    ctx.lineCap = 'round';
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (
        p.screenX < -40 ||
        p.screenX > this.width + 40 ||
        p.screenY < -40 ||
        p.screenY > this.height + 40
      ) {
        continue;
      }

      // Soften alpha right inside center typography safe-zone so hero copy stays crisp
      let centerFade = 1;
      if (isHero) {
        const ndx = (p.screenX - cx) / Math.max(180, this.width * 0.24);
        const ndy = (p.screenY - cy) / Math.max(130, this.height * 0.22);
        const centerDist = Math.sqrt(ndx * ndx + ndy * ndy);
        if (centerDist < 1) {
          centerFade = 0.22 + 0.78 * centerDist;
        }
      }

      const depthAlpha = Math.min(1, Math.max(0.18, p.scale * 0.85));
      const speed = staticFrame ? 0 : Math.min(16, Math.hypot(p.vx, p.vy));

      // Align capsule to motion vector or orbital tangent
      let dirX = staticFrame ? -Math.sin(p.angle) : (p.screenX - p.prevScreenX);
      let dirY = staticFrame ? Math.cos(p.angle) * 0.45 : (p.screenY - p.prevScreenY);
      const dirMag = Math.hypot(dirX, dirY);
      if (dirMag > 0.02) {
        dirX /= dirMag;
        dirY /= dirMag;
      } else {
        dirX = -Math.sin(p.angle);
        dirY = Math.cos(p.angle) * 0.45;
        const mag2 = Math.hypot(dirX, dirY) || 1;
        dirX /= mag2;
        dirY /= mag2;
      }

      const strokeLen = (p.baseLen + speed * 2.1) * p.scale;
      const strokeW = Math.max(1.2, p.baseWidth * p.scale);
      const halfLen = strokeLen * 0.5;

      ctx.globalAlpha = p.baseAlpha * depthAlpha * centerFade;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = strokeW;
      ctx.beginPath();
      ctx.moveTo(p.screenX - dirX * halfLen, p.screenY - dirY * halfLen);
      ctx.lineTo(p.screenX + dirX * halfLen, p.screenY + dirY * halfLen);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    this.needsPrevSync = false;
  }
}
