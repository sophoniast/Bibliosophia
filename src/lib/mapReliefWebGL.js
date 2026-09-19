/**
 * Lightweight WebGL2 top-down embossed relief.
 * Builds a heightmap from land polygons + mountain ridges, then shades with a
 * directional light. Falls back gracefully when WebGL is unavailable.
 */

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_height;
uniform vec2 u_texel;
uniform vec3 u_lightDir;
uniform vec3 u_landHi;
uniform vec3 u_landLo;
uniform float u_intensity;
uniform float u_time;

float sampleH(vec2 uv) {
  return texture(u_height, clamp(uv, 0.001, 0.999)).r;
}

void main() {
  float h = sampleH(v_uv);
  if (h < 0.02) {
    discard;
  }

  float hx = sampleH(v_uv + vec2(u_texel.x, 0.0)) - sampleH(v_uv - vec2(u_texel.x, 0.0));
  float hy = sampleH(v_uv + vec2(0.0, u_texel.y)) - sampleH(v_uv - vec2(0.0, u_texel.y));
  vec3 normal = normalize(vec3(-hx * 14.0 * u_intensity, -hy * 14.0 * u_intensity, 1.0));
  float ndl = clamp(dot(normal, normalize(u_lightDir)), 0.0, 1.0);
  float rim = pow(1.0 - abs(normal.z), 1.6) * 0.35 * u_intensity;
    float shade = mix(0.38, 1.18, ndl) + rim;
  float micro = sin((v_uv.x + v_uv.y) * 180.0 + u_time * 0.4) * 0.02 * u_intensity;
  vec3 base = mix(u_landLo, u_landHi, clamp(h * 1.15 + micro, 0.0, 1.0));
  vec3 lit = base * shade;
  float alpha = smoothstep(0.02, 0.1, h) * (0.72 + 0.28 * u_intensity);
  outColor = vec4(lit, alpha);
}`

function hexToRgb01(hex) {
  const n = hex.replace('#', '')
  return [
    Number.parseInt(n.slice(0, 2), 16) / 255,
    Number.parseInt(n.slice(2, 4), 16) / 255,
    Number.parseInt(n.slice(4, 6), 16) / 255,
  ]
}

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(info || 'shader compile failed')
  }
  return shader
}

function createProgram(gl) {
  const program = gl.createProgram()
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'program link failed')
  }
  return program
}

function buildHeightmap(width, height, landPaths, mountainPaths) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)

  const scaleX = width / 1000
  const scaleY = height / 620
  ctx.save()
  ctx.scale(scaleX, scaleY)

  for (const d of landPaths) {
    const path = new Path2D(d)
    ctx.fillStyle = 'rgb(110, 110, 110)'
    ctx.fill(path)
  }

  // Soft coastal shelf
  ctx.globalCompositeOperation = 'source-atop'
  ctx.filter = 'blur(6px)'
  ctx.fillStyle = 'rgb(150, 150, 150)'
  for (const d of landPaths) {
    ctx.fill(new Path2D(d))
  }
  ctx.filter = 'none'
  ctx.globalCompositeOperation = 'source-over'

  // Highland ridges
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const ridge of mountainPaths) {
    ctx.strokeStyle = 'rgb(255, 255, 255)'
    ctx.lineWidth = 9
    ctx.globalAlpha = 0.95
    ctx.stroke(new Path2D(ridge))
    ctx.strokeStyle = 'rgb(220, 220, 220)'
    ctx.lineWidth = 22
    ctx.globalAlpha = 0.45
    ctx.stroke(new Path2D(ridge))
  }
  ctx.globalAlpha = 1

  // Inland plateaus via blurred white fill inset
  ctx.globalCompositeOperation = 'lighter'
  ctx.filter = 'blur(12px)'
  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  for (const d of landPaths) {
    ctx.fill(new Path2D(d))
  }
  ctx.filter = 'none'
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  // Final blur pass for emboss continuity
  const blur = document.createElement('canvas')
  blur.width = width
  blur.height = height
  const bctx = blur.getContext('2d')
  bctx.filter = 'blur(1.6px)'
  bctx.drawImage(canvas, 0, 0)
  return bctx.getImageData(0, 0, width, height)
}

export function createReliefRenderer(canvas, { landPaths = [], mountainPaths = [] } = {}) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
  })
  if (!gl) return null

  let program
  try {
    program = createProgram(gl)
  } catch {
    return null
  }

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW)

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const aPos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  const heightW = 1024
  const heightH = 640
  const image = buildHeightmap(heightW, heightH, landPaths, mountainPaths)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, heightW, heightH, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.data)

  const uniforms = {
    height: gl.getUniformLocation(program, 'u_height'),
    texel: gl.getUniformLocation(program, 'u_texel'),
    lightDir: gl.getUniformLocation(program, 'u_lightDir'),
    landHi: gl.getUniformLocation(program, 'u_landHi'),
    landLo: gl.getUniformLocation(program, 'u_landLo'),
    intensity: gl.getUniformLocation(program, 'u_intensity'),
    time: gl.getUniformLocation(program, 'u_time'),
  }

  let raf = 0
  let intensity = 0
  let targetIntensity = 0
  let night = true
  let running = false
  const start = performance.now()

  const palette = () => (night
    ? { hi: hexToRgb01('#a89058'), lo: hexToRgb01('#3a3020') }
    : { hi: hexToRgb01('#e8d5a4'), lo: hexToRgb01('#9a8050') })

  const draw = (now) => {
    if (!running) return
    const parent = canvas.parentElement
    const cssW = parent?.clientWidth || canvas.clientWidth || 1
    const cssH = parent?.clientHeight || canvas.clientHeight || 1
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.min(2048, Math.floor(cssW * dpr)))
    const h = Math.max(1, Math.min(2048, Math.floor(cssH * dpr)))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    intensity += (targetIntensity - intensity) * 0.08
    if (intensity < 0.01 && targetIntensity === 0) {
      gl.viewport(0, 0, w, h)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      raf = window.requestAnimationFrame(draw)
      return
    }

    const { hi, lo } = palette()
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(program)
    gl.bindVertexArray(vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(uniforms.height, 0)
    gl.uniform2f(uniforms.texel, 1 / heightW, 1 / heightH)
    gl.uniform3f(uniforms.lightDir, -0.45, -0.65, 0.75)
    gl.uniform3f(uniforms.landHi, hi[0], hi[1], hi[2])
    gl.uniform3f(uniforms.landLo, lo[0], lo[1], lo[2])
    gl.uniform1f(uniforms.intensity, intensity)
    gl.uniform1f(uniforms.time, (now - start) / 1000)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    raf = window.requestAnimationFrame(draw)
  }

  return {
    setActive(active) {
      targetIntensity = active ? 1 : 0
    },
    setNight(nextNight) {
      night = Boolean(nextNight)
    },
    start() {
      if (running) return
      running = true
      raf = window.requestAnimationFrame(draw)
    },
    stop() {
      running = false
      window.cancelAnimationFrame(raf)
    },
    destroy() {
      this.stop()
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    },
  }
}
