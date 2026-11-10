"use client";

import { useEffect, useRef } from "react";

/**
 * An original 3D model of the European champions' trophy ("big ears"), rendered with raw WebGL —
 * no 3D library. The body is a surface of revolution traced from the trophy's profile (stepped
 * foot, slender stem, urn-shaped body, flared rim, open cup); the two handles are broad flat bands
 * swept along an ear-shaped curve. It is shaded as polished silver reflecting a night stadium: a
 * midnight sky, a long soft-box highlight, a key light and a volt rim light, with stronger
 * reflection at glancing angles. It turns slowly, leans toward the pointer, pauses off-screen,
 * and with reduced motion is drawn once. This is an original model, not an official UEFA asset.
 */

// Profile: [radius, height], from the centre of the foot up the outside and back down the inside.
const PROFILE: [number, number][] = [
  [0, 0], [0.17, 0], [0.172, 0.02], [0.165, 0.035], [0.15, 0.045], [0.148, 0.06], [0.125, 0.075], [0.118, 0.09],
  [0.085, 0.12], [0.06, 0.16], [0.048, 0.22], [0.05, 0.255], [0.064, 0.272], [0.05, 0.29], [0.06, 0.32], [0.095, 0.38],
  [0.13, 0.45], [0.158, 0.53], [0.172, 0.61], [0.176, 0.69], [0.17, 0.77], [0.158, 0.84], [0.15, 0.9], [0.155, 0.94],
  [0.163, 0.962], [0.158, 0.972], [0.148, 0.962], [0.138, 0.9], [0.12, 0.86], [0, 0.85],
];
// Handle centre-line (right side), from the upper attachment over the "ear" to the lower body.
const HANDLE: [number, number][] = [
  [0.14, 0.9], [0.2, 0.975], [0.29, 0.99], [0.365, 0.935], [0.395, 0.83], [0.385, 0.71], [0.345, 0.61], [0.27, 0.525], [0.19, 0.475], [0.13, 0.455],
];

type Vec = [number, number, number];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const crs = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (v: Vec): Vec => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

function buildMesh() {
  const data: number[] = [];
  const index: number[] = [];
  const push = (p: Vec, n: Vec) => data.push(p[0], p[1], p[2], n[0], n[1], n[2]);

  // Body: lathe the profile.
  const S = 72;
  const base = 0;
  PROFILE.forEach(([r, y], i) => {
    const prev = PROFILE[Math.max(0, i - 1)], next = PROFILE[Math.min(PROFILE.length - 1, i + 1)];
    const dr = next[0] - prev[0], dy = next[1] - prev[1];
    const l = Math.hypot(dr, dy) || 1;
    const nr = dy / l, ny = -dr / l;
    for (let j = 0; j <= S; j++) {
      const a = (j / S) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      push([r * c, y, r * s], [nr * c, ny, nr * s]);
    }
  });
  for (let i = 0; i < PROFILE.length - 1; i++) {
    for (let j = 0; j < S; j++) {
      const a = base + i * (S + 1) + j, b = a + S + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  // Handles: a flattened tube (wide in the loop's plane, thin front-to-back) along a smooth curve.
  const catmull = (p0: number[], p1: number[], p2: number[], p3: number[], t: number) =>
    [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t));
  const curve: number[][] = [];
  for (let i = 0; i < HANDLE.length - 1; i++) {
    const p0 = HANDLE[Math.max(0, i - 1)], p1 = HANDLE[i], p2 = HANDLE[i + 1], p3 = HANDLE[Math.min(HANDLE.length - 1, i + 2)];
    for (let t = 0; t < 10; t++) curve.push(catmull(p0, p1, p2, p3, t / 10));
  }
  curve.push(HANDLE[HANDLE.length - 1]);
  const M = 18, wide = 0.024, thin = 0.011;
  for (const side of [1, -1]) {
    const start = data.length / 6;
    curve.forEach((c, i) => {
      const a = curve[Math.max(0, i - 1)], b = curve[Math.min(curve.length - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const inX = -ty / tl, inY = tx / tl; // in-plane normal to the curve
      for (let k = 0; k <= M; k++) {
        const th = (k / M) * Math.PI * 2;
        const cs = Math.cos(th), sn = Math.sin(th);
        const p: Vec = [(c[0] + inX * cs * wide) * side, c[1] + inY * cs * wide, sn * thin];
        const n = nrm([(inX * cs) / wide * side, (inY * cs) / wide, sn / thin]);
        push(p, n);
      }
    });
    for (let i = 0; i < curve.length - 1; i++) {
      for (let k = 0; k < M; k++) {
        const a = start + i * (M + 1) + k, b = a + M + 1;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  return { vertices: new Float32Array(data), indices: new Uint16Array(index) };
}

// --- Minimal matrix helpers (column-major, as WebGL expects) -------------------------------------
type M4 = Float32Array;
const mul = (a: M4, b: M4): M4 => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
};
const perspective = (fov: number, aspect: number, near: number, far: number): M4 => {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
};
const lookAt = (eye: Vec, target: Vec): M4 => {
  const z = nrm(sub(eye, target));
  const x = nrm(crs([0, 1, 0], z));
  const y = crs(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]), -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]), -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1]);
};
const rotation = (yaw: number, pitch: number): M4 => {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // pitch (X) applied after yaw (Y), centred on the trophy's middle height.
  const ry = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]);
  const rx = new Float32Array([1, 0, 0, 0, 0, cp, sp, 0, 0, -sp, cp, 0, 0, 0, 0, 1]);
  const up = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0.5, 0, 1]);
  const down = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -0.5, 0, 1]);
  return mul(up, mul(rx, mul(ry, down)));
};

const VERT = `
attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uModel; uniform mat4 uViewProj;
varying vec3 vN; varying vec3 vP;
void main() {
  vec4 p = uModel * vec4(aPos, 1.0);
  vP = p.xyz;
  vN = (uModel * vec4(aNormal, 0.0)).xyz; // rotation + translation only, so this is the normal matrix
  gl_Position = uViewProj * p;
}`;

const FRAG = `
precision mediump float;
varying vec3 vN; varying vec3 vP;
uniform vec3 uCam;
// A night-stadium environment for the silver to reflect.
vec3 env(vec3 r) {
  float up = r.y;
  float az = atan(r.x, r.z);
  vec3 sky = mix(vec3(0.16, 0.20, 0.32), vec3(0.55, 0.62, 0.80), smoothstep(-0.05, 0.9, up));
  vec3 floorC = mix(vec3(0.06, 0.07, 0.10), vec3(0.20, 0.22, 0.30), smoothstep(-1.0, 0.0, up));
  vec3 c = up > 0.0 ? sky : floorC;
  // Floodlight towers: tall vertical light strips at a few bearings. As the trophy turns they
  // slide across the body as bright vertical streaks, which is what reads as polished metal.
  float towers = smoothstep(0.24, 0.05, abs(az - 0.9))
               + smoothstep(0.18, 0.04, abs(az + 1.1)) * 0.8
               + smoothstep(0.12, 0.03, abs(az - 2.6)) * 0.6;
  c += vec3(1.1, 1.12, 1.18) * towers * smoothstep(-0.3, 0.2, up);
  c += vec3(0.5, 0.55, 0.7) * exp(-abs(up) * 8.0) * 0.6;                                         // horizon glow
  c += vec3(1.6, 1.5, 1.35) * pow(max(dot(r, normalize(vec3(-0.55, 0.75, 0.55))), 0.0), 48.0) * 2.5; // key light
  c += vec3(0.75, 0.9, 0.25) * pow(max(dot(r, normalize(vec3(0.95, 0.05, -0.2))), 0.0), 12.0) * 0.45; // volt rim
  return c;
}
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(uCam - vP);
  if (dot(n, v) < 0.0) n = -n; // inside of the cup and the back faces of the handles
  vec3 r = reflect(-v, n);
  float fres = 0.78 + 0.22 * pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 silver = vec3(0.95, 0.96, 0.99);
  vec3 c = env(r) * silver * fres;
  c += silver * 0.06 * max(dot(n, normalize(vec3(-0.4, 0.8, 0.5))), 0.0);
  c = c / (1.0 + c) * 1.5;           // gentle tone-map: bright highlights without clipping
  gl_FragColor = vec4(pow(c, vec3(0.92)), 1.0);
}`;

export default function TrophyGL({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const gl = el?.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!el || !gl) {
      if (el) el.style.display = "none";
      return;
    }
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      el.style.display = "none";
      return;
    }
    gl.useProgram(prog);

    const { vertices, indices } = buildMesh();
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos"), aNormal = gl.getAttribLocation(prog, "aNormal");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 24, 12);
    const uModel = gl.getUniformLocation(prog, "uModel"), uViewProj = gl.getUniformLocation(prog, "uViewProj"), uCam = gl.getUniformLocation(prog, "uCam");
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    const eye: Vec = [0, 0.62, 2.55];
    gl.uniform3fv(uCam, eye);
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.max(1, Math.round(el.clientWidth * dpr));
      el.height = Math.max(1, Math.round(el.clientHeight * dpr));
      gl.viewport(0, 0, el.width, el.height);
      const view = lookAt(eye, [0, 0.5, 0]);
      gl.uniformMatrix4fv(uViewProj, false, mul(perspective((28 * Math.PI) / 180, el.width / el.height, 0.1, 10), view));
    };
    resize();

    let yaw = -0.5, tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
    const draw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uModel, false, rotation(yaw + tiltX, -0.05 + tiltY));
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(el);
    if (reduced) {
      draw();
      return () => {
        ro.disconnect();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    let raf = 0, last = 0, running = false;
    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      yaw += dt * 0.32; // one turn every ~20 seconds
      const ease = 1 - Math.exp(-dt * 4);
      tiltX += (targetX - tiltX) * ease;
      tiltY += (targetY - tiltY) * ease;
      draw();
      raf = running ? requestAnimationFrame(frame) : 0;
    };
    const start = () => {
      if (!running && !document.hidden) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const panel = el.closest("article") ?? el;
    const onPointer = (e: Event) => {
      const p = e as PointerEvent;
      const r = (panel as HTMLElement).getBoundingClientRect();
      targetX = ((p.clientX - r.left) / r.width - 0.5) * 0.7;
      targetY = ((p.clientY - r.top) / r.height - 0.5) * 0.18;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(el);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    panel.addEventListener("pointermove", onPointer, { passive: true });
    panel.addEventListener("pointerleave", onLeave);
    draw();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      panel.removeEventListener("pointermove", onPointer);
      panel.removeEventListener("pointerleave", onLeave);
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ibo);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvas} className={className} role="img" aria-label="A silver European champions' trophy turning slowly in the stadium lights" />;
}
