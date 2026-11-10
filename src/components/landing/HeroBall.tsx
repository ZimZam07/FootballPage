"use client";

import { useEffect, useRef } from "react";

/**
 * A real 3D football, drawn on a 2D canvas with no 3D library: the classic truncated icosahedron
 * (12 pentagons, 20 hexagons), each panel curved onto the sphere, lit per panel and finished with a
 * sphere-wide highlight and a floodlight-volt rim light. It turns toward the pointer and spins with
 * scrolling; it pauses off-screen and when the tab is hidden; with reduced motion it is drawn once.
 */

type V = [number, number, number];
const PHI = (1 + Math.sqrt(5)) / 2;
const norm = (v: V): V => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** All sign combinations of the non-zero entries, in all three cyclic orders, without duplicates. */
function expand(base: V): V[] {
  const out = new Map<string, V>();
  const orders: V[] = [base, [base[1], base[2], base[0]], [base[2], base[0], base[1]]];
  for (const [a, b, c] of orders) {
    for (const sa of a ? [1, -1] : [1]) {
      for (const sb of b ? [1, -1] : [1]) {
        for (const sc of c ? [1, -1] : [1]) {
          const v: V = [a * sa, b * sb, c * sc];
          out.set(v.map((n) => n.toFixed(5)).join(","), v);
        }
      }
    }
  }
  return [...out.values()];
}

interface Panel {
  pentagon: boolean;
  centre: V;
  /** Outline on the unit sphere (edges subdivided so the panel curves with the ball). */
  outline: V[];
}

function buildBall(): Panel[] {
  const vertices = [...expand([0, 1, 3 * PHI]), ...expand([1, 2 + PHI, 2 * PHI]), ...expand([PHI, 2, 2 * PHI + 1])].map(norm);
  const pentagonCentres = expand([0, 1, PHI]).map(norm);
  const hexagonCentres = [...expand([1, 1, 1]), ...expand([0, 1 / PHI, PHI])].map(norm);
  const panel = (centre: V, n: number): Panel => {
    const corners = [...vertices].sort((a, b) => dot(b, centre) - dot(a, centre)).slice(0, n);
    // Order the corners around the centre.
    const u = norm(cross(centre, Math.abs(centre[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
    const w = cross(centre, u);
    corners.sort((a, b) => Math.atan2(dot(a, w), dot(a, u)) - Math.atan2(dot(b, w), dot(b, u)));
    const outline: V[] = [];
    const steps = 6;
    for (let i = 0; i < n; i++) {
      const a = corners[i], b = corners[(i + 1) % n];
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        outline.push(norm([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]));
      }
    }
    return { pentagon: n === 5, centre, outline };
  };
  return [...pentagonCentres.map((c) => panel(c, 5)), ...hexagonCentres.map((c) => panel(c, 6))];
}

const LIGHT = norm([-0.55, -0.7, 0.75]);

export default function HeroBall({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const panels = buildBall();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let size = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = el.clientWidth;
      el.width = Math.round(size * dpr);
      el.height = Math.round(size * dpr);
    };
    resize();

    // Orientation: a slow spin, eased toward the pointer, kicked by scrolling.
    const pitch = -0.35;
    const tilt = { x: 0, y: 0 };
    let yaw = 0.6, spin = 0.0042;
    let targetYaw = 0, targetPitch = 0;
    let lastScroll = window.scrollY;

    const draw = () => {
      const r = (size / 2) * 0.92 * dpr;
      const cx = (size / 2) * dpr, cy = (size / 2) * dpr;
      ctx.clearRect(0, 0, el.width, el.height);

      const cyw = Math.cos(yaw + tilt.x), syw = Math.sin(yaw + tilt.x);
      const cp = Math.cos(pitch + tilt.y), sp = Math.sin(pitch + tilt.y);
      const rot = (v: V): V => {
        const x = v[0] * cyw + v[2] * syw;
        const z = -v[0] * syw + v[2] * cyw;
        return [x, v[1] * cp - z * sp, v[1] * sp + z * cp];
      };

      const visible = panels
        .map((p) => ({ p, c: rot(p.centre) }))
        .filter((x) => x.c[2] > -0.15)
        .sort((a, b) => a.c[2] - b.c[2]);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#0c0d10";
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      for (const { p, c } of visible) {
        const lambert = Math.max(0, dot(c, LIGHT));
        const facing = Math.max(0, c[2]);
        const k = 0.5 + 0.5 * lambert;
        const base = p.pentagon ? [22, 24, 29] : [241, 238, 230];
        const shade = (ch: number) => Math.min(255, Math.round(ch * k * (0.88 + 0.12 * facing)));
        ctx.beginPath();
        p.outline.forEach((v, i) => {
          const q = rot(v);
          const x = cx + q[0] * r, y = cy + q[1] * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = `rgb(${shade(base[0])},${shade(base[1])},${shade(base[2])})`;
        ctx.fill();
        // Seams: darker and thinner towards the edge of the ball.
        ctx.lineWidth = Math.max(1, r * 0.012) * (0.4 + 0.6 * facing);
        ctx.strokeStyle = `rgba(8,9,11,${0.55 * (0.5 + 0.5 * facing)})`;
        ctx.stroke();
      }

      // Sphere lighting: a soft key highlight, a volt rim from the right, and shadowed edges.
      const key = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.45, r * 0.05, cx - r * 0.2, cy - r * 0.25, r * 1.05);
      key.addColorStop(0, "rgba(255,255,255,0.55)");
      key.addColorStop(0.22, "rgba(255,255,255,0.14)");
      key.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = key;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      const rim = ctx.createRadialGradient(cx + r * 0.95, cy + r * 0.35, 0, cx + r * 0.95, cy + r * 0.35, r * 0.95);
      rim.addColorStop(0, "rgba(212,245,60,0.30)");
      rim.addColorStop(1, "rgba(212,245,60,0)");
      ctx.fillStyle = rim;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      const edge = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.7, cx, cy, r * 1.02);
      edge.addColorStop(0, "rgba(0,0,0,0)");
      edge.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = edge;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    };

    if (reduced) {
      draw();
      const ro = new ResizeObserver(() => {
        resize();
        draw();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }

    let raf = 0;
    let running = false;
    const frame = () => {
      raf = 0;
      const dy = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      spin += Math.max(-0.04, Math.min(0.04, dy * 0.0006));
      spin += (0.0042 - spin) * 0.04;
      yaw += spin;
      tilt.x += (targetYaw - tilt.x) * 0.06;
      tilt.y += (targetPitch - tilt.y) * 0.06;
      draw();
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!running && !document.hidden) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointer = (e: PointerEvent) => {
      targetYaw = (e.clientX / window.innerWidth - 0.5) * 0.9;
      targetPitch = (e.clientY / window.innerHeight - 0.5) * -0.6;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    io.observe(el);
    ro.observe(el);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    draw();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvas} className={className} role="img" aria-label="A football turning in the floodlights" />;
}
