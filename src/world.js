import * as THREE from 'three'

const TAU = Math.PI * 2

const rnd = (min, max) => min + Math.random() * (max - min)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function canvasTexture(size, draw, repeat = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function groundTexture() {
  return canvasTexture(512, (ctx, size) => {
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const x = (i / 4) % size
      const y = Math.floor(i / 4 / size)
      const n = Math.sin(x * 0.07) * Math.cos(y * 0.06) * 8
      const grain = (Math.random() - 0.5) * 28
      const moss = Math.sin(x * 0.02 + 1.4) * Math.cos(y * 0.023) * 7
      img.data[i] = 58 + grain + n + moss * 0.5
      img.data[i + 1] = 64 + grain + n * 0.6 + moss
      img.data[i + 2] = 54 + grain * 0.7
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)

    ctx.globalAlpha = 0.25
    for (let i = 0; i < 100; i++) {
      ctx.strokeStyle = Math.random() > 0.45 ? '#0d100e' : '#394036'
      ctx.lineWidth = rnd(0.4, 1.6)
      ctx.beginPath()
      let x = rnd(0, size)
      let y = rnd(0, size)
      ctx.moveTo(x, y)
      for (let j = 0; j < 4; j++) {
        x += rnd(-22, 22)
        y += rnd(-18, 18)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    ctx.globalAlpha = 0.3
    for (let i = 0; i < 90; i++) {
      const x = rnd(0, size)
      const y = rnd(0, size)
      const r = rnd(1, 4)
      ctx.fillStyle = pick(['#4a4d42', '#242a22', '#111410', '#3b3d33'])
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * 0.7, rnd(0, TAU), 0, TAU)
      ctx.fill()
    }

    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.7)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.24)')
    ctx.globalAlpha = 1
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }, 18)
}

function stoneTexture() {
  return canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = '#4a4d44'
    ctx.fillRect(0, 0, size, size)
    const img = ctx.getImageData(0, 0, size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const g = (Math.random() - 0.5) * 24
      img.data[i] += g
      img.data[i + 1] += g
      img.data[i + 2] += g * 0.8
    }
    ctx.putImageData(img, 0, 0)
    ctx.globalAlpha = 0.36
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = '#171a16'
      ctx.lineWidth = rnd(0.5, 2)
      ctx.beginPath()
      ctx.moveTo(rnd(0, size), rnd(0, size))
      ctx.lineTo(rnd(0, size), rnd(0, size))
      ctx.stroke()
    }
    ctx.globalAlpha = 0.2
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = '#66705e'
      ctx.beginPath()
      ctx.arc(rnd(0, size), rnd(0, size), rnd(1, 4), 0, TAU)
      ctx.fill()
    }
  }, 2)
}

function barkTexture() {
  return canvasTexture(128, (ctx, size) => {
    ctx.fillStyle = '#25221c'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = pick(['#12100c', '#363128', '#1b1813', '#423b2e'])
      ctx.lineWidth = rnd(0.4, 2.3)
      ctx.globalAlpha = rnd(0.2, 0.6)
      ctx.beginPath()
      const x = rnd(0, size)
      ctx.moveTo(x, 0)
      for (let y = 0; y < size; y += 8) ctx.lineTo(x + Math.sin(y * 0.09 + i) * 3, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }, 1)
}

function glowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,255,255,0.8)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.24)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function fogTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 256, 256)
  for (let i = 0; i < 22; i++) {
    const x = rnd(40, 216)
    const y = rnd(60, 196)
    const r = rnd(28, 90)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.12)')
    g.addColorStop(0.55, 'rgba(255,255,255,0.055)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function moonTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 256, 256)
  const g = ctx.createRadialGradient(128, 128, 24, 128, 128, 128)
  g.addColorStop(0, 'rgba(205,225,235,0.38)')
  g.addColorStop(0.25, 'rgba(154,190,205,0.12)')
  g.addColorStop(0.6, 'rgba(120,160,180,0.035)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)

  const disc = ctx.createRadialGradient(118, 112, 6, 128, 128, 50)
  disc.addColorStop(0, '#e8eddf')
  disc.addColorStop(0.65, '#b8c2ba')
  disc.addColorStop(0.88, '#87938e')
  disc.addColorStop(1, 'rgba(70,80,78,0)')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(128, 128, 48, 0, TAU)
  ctx.fill()

  ctx.globalAlpha = 0.22
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = '#4a5350'
    ctx.beginPath()
    ctx.arc(128 + rnd(-34, 34), 128 + rnd(-34, 34), rnd(2, 10), 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function runeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 1024, 1024)
  ctx.translate(512, 512)
  ctx.strokeStyle = '#9fe9df'
  ctx.fillStyle = '#9fe9df'

  ctx.globalAlpha = 0.85
  ctx.lineWidth = 3
  for (const [radius, alpha] of [[430, 0.38], [340, 0.55], [200, 0.4], [95, 0.55]]) {
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, TAU)
    ctx.stroke()
  }

  ctx.globalAlpha = 0.32
  ctx.lineWidth = 1.5
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * 352, Math.sin(a) * 352)
    ctx.lineTo(Math.cos(a) * 420, Math.sin(a) * 420)
    ctx.stroke()
  }

  const glyphs = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ']
  ctx.globalAlpha = 0.9
  ctx.font = '34px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU
    ctx.save()
    ctx.rotate(a + Math.PI / 2)
    ctx.fillText(glyphs[i % glyphs.length], 0, -388)
    ctx.restore()
  }

  ctx.globalAlpha = 0.55
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU
    const b = a + TAU / 8
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * 200, Math.sin(a) * 200)
    ctx.lineTo(Math.cos(b) * 200, Math.sin(b) * 200)
    ctx.lineTo(Math.cos((a + b) / 2) * 340, Math.sin((a + b) / 2) * 340)
    ctx.closePath()
    ctx.stroke()
  }

  ctx.globalAlpha = 0.75
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU - Math.PI / 2
    const x = Math.cos(a) * 82
    const y = Math.sin(a) * 82
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 30, 0, TAU)
  ctx.stroke()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function radialParticleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function cylinderBetween(start, end, radiusStart, radiusEnd, material, segments = 6) {
  const dir = new THREE.Vector3().subVectors(end, start)
  const len = dir.length()
  const geo = new THREE.CylinderGeometry(radiusEnd, radiusStart, len, segments, 1)
  const mesh = new THREE.Mesh(geo, material)
  mesh.position.copy(start).addScaledVector(dir, 0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createTree(material, x, z, scale) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.scale.setScalar(scale)
  group.rotation.y = rnd(0, TAU)

  const trunkHeight = rnd(4.2, 7.2)
  const trunkTop = new THREE.Vector3(rnd(-0.4, 0.4), trunkHeight, rnd(-0.4, 0.4))
  group.add(cylinderBetween(new THREE.Vector3(0, 0, 0), trunkTop, 0.34, 0.11, material, 7))

  const branchCount = 4 + Math.floor(rnd(0, 4))
  for (let i = 0; i < branchCount; i++) {
    const t = rnd(0.45, 0.9)
    const start = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), trunkTop, t)
    const a = rnd(0, TAU)
    const len = rnd(1.1, 3.3) * (1 - t * 0.35)
    const end = start.clone().add(new THREE.Vector3(Math.cos(a) * len, rnd(0.4, 1.5), Math.sin(a) * len))
    group.add(cylinderBetween(start, end, 0.13 * (1 - t) + 0.04, 0.02, material, 5))

    if (i % 2 === 0) {
      const end2 = end.clone().add(new THREE.Vector3(Math.cos(a + rnd(-1, 1)) * len * 0.5, rnd(0.2, 1.1), Math.sin(a + rnd(-1, 1)) * len * 0.5))
      group.add(cylinderBetween(end, end2, 0.045, 0.012, material, 4))
    }
  }

  const roots = 3 + Math.floor(rnd(0, 3))
  for (let i = 0; i < roots; i++) {
    const a = rnd(0, TAU)
    const end = new THREE.Vector3(Math.cos(a) * rnd(0.5, 1.3), 0.06, Math.sin(a) * rnd(0.5, 1.3))
    group.add(cylinderBetween(new THREE.Vector3(0, 0.28, 0), end, 0.13, 0.025, material, 5))
  }

  return group
}

function createGravestone(material, stoneTex, x, z, scale) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rnd(-0.35, 0.35)
  group.rotation.z = rnd(-0.1, 0.1)
  group.scale.setScalar(scale)

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.22, 0.58), material)
  base.position.y = 0.11
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.72, rnd(1.2, 2), 0.18), material)
  slab.position.set(0, 0.75, 0)
  slab.castShadow = true
  slab.receiveShadow = true
  group.add(slab)

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.18, 12, 1, false, 0, Math.PI), material)
  top.rotation.x = Math.PI / 2
  top.rotation.z = Math.PI / 2
  top.position.set(0, 1.36, 0)
  top.scale.y = 0.5
  top.castShadow = true
  group.add(top)

  if (Math.random() > 0.55) {
    const crossMat = new THREE.MeshStandardMaterial({ color: 0x4a4d44, roughness: 0.9, map: stoneTex })
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.08), crossMat)
    v.position.set(0, 1.66, 0.02)
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.08), crossMat)
    h.position.set(0, 1.7, 0.02)
    group.add(v, h)
  }

  if (Math.random() > 0.72) {
    const glyph = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.28),
      new THREE.MeshBasicMaterial({ color: 0x4bbab0, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
    )
    glyph.position.set(0, 0.8, 0.101)
    group.add(glyph)
  }

  return group
}

function createBrazier(x, z, glowTex) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1d1c19, roughness: 0.55, metalness: 0.7 })
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.22, 0.34, 10, 1, true), ironMat)
  bowl.position.y = 1.05
  bowl.castShadow = true
  group.add(bowl)

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 6, 14), ironMat)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 1.22
  group.add(rim)

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU
    const leg = cylinderBetween(
      new THREE.Vector3(Math.cos(a) * 0.18, 0.04, Math.sin(a) * 0.18),
      new THREE.Vector3(Math.cos(a) * 0.36, 1.02, Math.sin(a) * 0.36),
      0.04, 0.055, ironMat, 5
    )
    group.add(leg)
  }

  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff7b2c })
  for (let i = 0; i < 7; i++) {
    const ember = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(0.04, 0.11), 0), emberMat)
    ember.position.set(rnd(-0.2, 0.2), rnd(1.2, 1.32), rnd(-0.2, 0.2))
    group.add(ember)
  }

  const flame = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xff9b45,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.85,
  }))
  flame.position.y = 1.58
  flame.scale.set(1.7, 2.2, 1)
  group.add(flame)

  const flame2 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xffd27a,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.8,
  }))
  flame2.position.y = 1.42
  flame2.scale.set(0.72, 1.2, 1)
  group.add(flame2)

  const light = new THREE.PointLight(0xff7b32, 2.4, 9, 2)
  light.position.set(0, 1.55, 0)
  light.castShadow = false
  group.add(light)

  return { group, flame, flame2, light, base: Math.random() * 10 }
}

function createShrine(glowTex) {
  const group = new THREE.Group()
  group.position.set(5.6, 0, 18.4)

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x343b36, roughness: 0.88, metalness: 0.05 })
  const runeMat = new THREE.MeshBasicMaterial({ color: 0x6fe1d5, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.32, 8), stoneMat)
  base.position.y = 0.16
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 2.4, 5), stoneMat)
  obelisk.position.y = 1.45
  obelisk.rotation.y = 0.4
  obelisk.castShadow = true
  group.add(obelisk)

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 5), stoneMat)
  cap.position.y = 2.88
  cap.rotation.y = 0.4
  group.add(cap)

  const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.78), runeMat)
  rune.position.set(0.15, 1.65, 0.37)
  rune.rotation.y = 0.18
  group.add(rune)

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0x61c4b9, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55,
  }))
  halo.position.y = 1.7
  halo.scale.set(2.3, 2.3, 1)
  group.add(halo)

  const light = new THREE.PointLight(0x61c4b9, 1.5, 7, 2)
  light.position.set(0, 1.7, 0)
  group.add(light)

  return { group, rune, halo, light }
}

function createChest(x, z, glowTex) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rnd(0, TAU)

  const wood = new THREE.MeshStandardMaterial({ color: 0x2c2117, roughness: 0.9, metalness: 0.02 })
  const iron = new THREE.MeshStandardMaterial({ color: 0x252727, roughness: 0.45, metalness: 0.75 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.62, 0.68), wood)
  body.position.y = 0.36
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, 0.68, -0.34)
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.14, 8, 1, false, 0, Math.PI), wood)
  lid.rotation.z = Math.PI / 2
  lid.rotation.y = Math.PI / 2
  lid.position.set(0, 0, 0.34)
  lid.castShadow = true
  lidPivot.add(lid)
  group.add(lidPivot)

  for (const xOff of [-0.38, 0.38]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.7, 0.72), iron)
    band.position.set(xOff, 0.38, 0)
    group.add(band)
  }
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.22, 0.09), iron)
  lock.position.set(0, 0.5, 0.37)
  group.add(lock)

  const rune = new THREE.Mesh(
    new THREE.PlaneGeometry(0.13, 0.17),
    new THREE.MeshBasicMaterial({ color: 0x63d4c8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  )
  rune.position.set(0, 0.5, 0.421)
  group.add(rune)

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0x4fbbb1, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4,
  }))
  glow.position.set(0, 0.62, 0)
  glow.scale.set(1.8, 1.8, 1)
  group.add(glow)

  return { group, lidPivot, rune, glow, opened: false, openT: 0 }
}

function createArch(stoneMat) {
  const group = new THREE.Group()
  group.position.set(0, 0, -22)
  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 6.6, 7), stoneMat)
  left.position.set(-4.3, 3.3, 0)
  left.rotation.z = 0.035
  left.castShadow = true
  left.receiveShadow = true
  const right = left.clone()
  right.position.x = 4.3
  right.rotation.z = -0.025
  right.scale.y = 0.92
  group.add(left, right)

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.9, 1.1), stoneMat)
  lintel.position.set(0, 6.3, 0)
  lintel.rotation.z = 0.012
  lintel.castShadow = true
  group.add(lintel)

  const broken = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.1, 1.0), stoneMat)
  broken.position.set(5.4, 5.7, 0)
  broken.rotation.z = 0.5
  broken.castShadow = true
  group.add(broken)

  for (let i = 0; i < 5; i++) {
    const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.18, 0.45), 0), stoneMat)
    rubble.position.set(rnd(-5, 5), rnd(0.08, 0.22), rnd(-1.5, 1.5))
    rubble.rotation.set(rnd(0, TAU), rnd(0, TAU), rnd(0, TAU))
    rubble.castShadow = true
    group.add(rubble)
  }

  return group
}

function createAltar(stoneMat, glowTex) {
  const group = new THREE.Group()
  group.position.set(0, 0, -18.4)
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.28, 4.6), stoneMat)
  step1.position.y = 0.14
  step1.receiveShadow = true
  step1.castShadow = true
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.34, 3.2), stoneMat)
  step2.position.y = 0.44
  step2.receiveShadow = true
  step2.castShadow = true
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 1.4), stoneMat)
  plinth.position.y = 1.0
  plinth.castShadow = true
  group.add(step1, step2, plinth)

  const throne = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.2, 0.55), stoneMat)
  throne.position.set(0, 1.9, -0.42)
  throne.rotation.x = -0.12
  throne.castShadow = true
  group.add(throne)

  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 5, 12), new THREE.MeshStandardMaterial({ color: 0x8b6d35, metalness: 0.9, roughness: 0.35 }))
  crown.position.set(0, 2.65, -0.15)
  crown.rotation.x = Math.PI / 2
  group.add(crown)

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0x9d3a36, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.22,
  }))
  glow.position.set(0, 2.2, 0.2)
  glow.scale.set(3.4, 3.4, 1)
  group.add(glow)

  return { group, glow }
}

function createGroundFog(fogTex, count = 16) {
  const sprites = []
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: fogTex,
      color: 0x9cb6ba,
      transparent: true,
      opacity: rnd(0.05, 0.14),
      depthWrite: false,
      blending: THREE.NormalBlending,
      rotation: rnd(0, TAU),
    })
    const sprite = new THREE.Sprite(mat)
    const a = rnd(0, TAU)
    const r = rnd(5, 31)
    sprite.position.set(Math.cos(a) * r, rnd(0.2, 1.3), Math.sin(a) * r)
    const s = rnd(9, 22)
    sprite.scale.set(s, s * rnd(0.35, 0.6), 1)
    sprite.userData = { baseX: sprite.position.x, baseZ: sprite.position.z, speed: rnd(0.015, 0.05), phase: rnd(0, TAU), rotSpeed: rnd(-0.01, 0.01) }
    sprites.push(sprite)
  }
  return sprites
}

function createAsh(count, color, size, glowTex, mode = 'fall') {
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  const phases = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const a = rnd(0, TAU)
    const r = rnd(2, 34)
    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 1] = rnd(0.2, mode === 'fall' ? 18 : 8)
    positions[i * 3 + 2] = Math.sin(a) * r
    speeds[i] = rnd(0.15, 0.7)
    phases[i] = rnd(0, TAU)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color,
    size,
    map: glowTex,
    transparent: true,
    opacity: mode === 'fall' ? 0.55 : 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return { points, positions, speeds, phases, count, mode }
}

export function buildWorld(scene) {
  const textures = {
    ground: groundTexture(),
    stone: stoneTexture(),
    bark: barkTexture(),
    glow: glowTexture(),
    fog: fogTexture(),
    moon: moonTexture(),
    rune: runeTexture(),
    particle: radialParticleTexture(),
  }

  const world = new THREE.Group()
  scene.add(world)

  const obstacles = []
  const addObstacle = (x, z, r) => obstacles.push({ x, z, r })

  scene.background = new THREE.Color(0x101a21)
  scene.fog = new THREE.FogExp2(0x19242c, 0.014)

  // Sky dome
  const skyGeo = new THREE.SphereGeometry(130, 32, 16)
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x1a2a36) },
      midColor: { value: new THREE.Color(0x233540) },
      bottomColor: { value: new THREE.Color(0x0c151b) },
      offset: { value: 16 },
      exponent: { value: 0.9 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        vec3 col = mix(bottomColor, midColor, smoothstep(-0.15, 0.22, h));
        col = mix(col, topColor, smoothstep(0.2, 0.8, h));
        float horizon = exp(-abs(h) * 18.0);
        col += vec3(0.035, 0.055, 0.06) * horizon;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const sky = new THREE.Mesh(skyGeo, skyMat)
  scene.add(sky)

  // Stars
  const starCount = 700
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const a = rnd(0, TAU)
    const y = rnd(0.12, 1)
    const r = 110
    const rr = Math.sqrt(1 - y * y) * r
    starPos[i * 3] = Math.cos(a) * rr
    starPos[i * 3 + 1] = y * r
    starPos[i * 3 + 2] = Math.sin(a) * rr
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xaec4cc, size: 0.34, map: textures.glow, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }))
  scene.add(stars)

  // Moon
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textures.moon,
    color: 0xdde9e8,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.95,
  }))
  moon.position.set(-38, 48, -72)
  moon.scale.set(30, 30, 1)
  scene.add(moon)

  // Lighting
  const hemi = new THREE.HemisphereLight(0xa3bfd0, 0x2a3224, 1.9)
  scene.add(hemi)

  const ambient = new THREE.AmbientLight(0x718d9c, 0.9)
  scene.add(ambient)

  const moonLight = new THREE.DirectionalLight(0xd2e8f5, 3.4)
  moonLight.position.set(-18, 30, -16)
  moonLight.castShadow = true
  moonLight.shadow.mapSize.set(2048, 2048)
  moonLight.shadow.camera.left = -34
  moonLight.shadow.camera.right = 34
  moonLight.shadow.camera.top = 34
  moonLight.shadow.camera.bottom = -34
  moonLight.shadow.camera.near = 1
  moonLight.shadow.camera.far = 85
  moonLight.shadow.bias = -0.0007
  moonLight.shadow.normalBias = 0.025
  scene.add(moonLight)

  const fill = new THREE.PointLight(0x6391a2, 3.0, 70, 2)
  fill.position.set(0, 14, 8)
  scene.add(fill)

  const rimFill = new THREE.DirectionalLight(0x7f9dac, 0.85)
  rimFill.position.set(15, 11, 24)
  scene.add(rimFill)

  // Ground
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.ground,
    color: 0xe2e7da,
    roughness: 0.98,
    metalness: 0.02,
  })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.025
  ground.receiveShadow = true
  world.add(ground)

  // Outer dark earth
  const outerMat = new THREE.MeshStandardMaterial({ color: 0x1a2118, roughness: 1 })
  const outer = new THREE.Mesh(new THREE.RingGeometry(31, 70, 64), outerMat)
  outer.rotation.x = -Math.PI / 2
  outer.position.y = -0.02
  world.add(outer)

  // Ritual circle
  const runeMat = new THREE.MeshBasicMaterial({
    map: textures.rune,
    color: 0x65d7ca,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const runeCircle = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), runeMat)
  runeCircle.rotation.x = -Math.PI / 2
  runeCircle.position.y = 0.015
  world.add(runeCircle)

  const innerGlow = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 32),
    new THREE.MeshBasicMaterial({ color: 0x1d6b65, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false })
  )
  innerGlow.rotation.x = -Math.PI / 2
  innerGlow.position.y = 0.02
  world.add(innerGlow)

  // Stone path
  const stoneMat = new THREE.MeshStandardMaterial({ map: textures.stone, color: 0xa4aa9c, roughness: 0.9, metalness: 0.03 })
  const pathGroup = new THREE.Group()
  for (let z = 20; z > -17; z -= 2.05) {
    if (z < 6 && z > -6) continue
    const slab = new THREE.Mesh(new THREE.BoxGeometry(rnd(1.7, 2.5), rnd(0.08, 0.15), rnd(1.4, 1.8)), stoneMat)
    slab.position.set(rnd(-0.28, 0.28), 0.025, z + rnd(-0.2, 0.2))
    slab.rotation.y = rnd(-0.13, 0.13)
    slab.receiveShadow = true
    slab.castShadow = true
    pathGroup.add(slab)
  }
  world.add(pathGroup)

  // Grass blades
  const bladeGeo = new THREE.PlaneGeometry(0.075, 0.5, 1, 2)
  bladeGeo.translate(0, 0.25, 0)
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x253128, roughness: 1, side: THREE.DoubleSide })
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, 900)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < 900; i++) {
    const a = rnd(0, TAU)
    const r = rnd(4.5, 30)
    dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
    dummy.rotation.set(rnd(-0.15, 0.15), rnd(0, TAU), rnd(-0.3, 0.3))
    dummy.scale.setScalar(rnd(0.5, 1.4))
    dummy.updateMatrix()
    blades.setMatrixAt(i, dummy.matrix)
  }
  blades.castShadow = false
  blades.receiveShadow = true
  world.add(blades)

  // Rocks
  const rockMat = new THREE.MeshStandardMaterial({ map: textures.stone, color: 0x767b70, roughness: 0.92, metalness: 0.02 })
  for (let i = 0; i < 34; i++) {
    const a = rnd(0, TAU)
    const r = rnd(7, 29)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const size = rnd(0.16, 0.65)
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMat)
    rock.position.set(x, size * 0.35, z)
    rock.rotation.set(rnd(0, TAU), rnd(0, TAU), rnd(0, TAU))
    rock.scale.y = rnd(0.5, 0.9)
    rock.castShadow = true
    rock.receiveShadow = true
    world.add(rock)
    if (size > 0.42) addObstacle(x, z, size * 0.8)
  }

  // Dead trees
  const barkMat = new THREE.MeshStandardMaterial({ map: textures.bark, color: 0x8d887b, roughness: 0.98, metalness: 0 })
  const treePositions = []
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + rnd(-0.12, 0.12)
    const r = rnd(25, 38)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const scale = rnd(0.8, 1.65)
    const tree = createTree(barkMat, x, z, scale)
    world.add(tree)
    treePositions.push({ x, z })
    addObstacle(x, z, 0.5 * scale)
  }
  for (let i = 0; i < 8; i++) {
    const a = rnd(0, TAU)
    const r = rnd(18, 24)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (Math.abs(x) < 4 && z > -20 && z < 20) continue
    const tree = createTree(barkMat, x, z, rnd(0.65, 1.1))
    world.add(tree)
    addObstacle(x, z, 0.4)
  }

  // Gravestones
  for (let i = 0; i < 24; i++) {
    const a = rnd(0, TAU)
    const r = rnd(9.5, 26)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (Math.abs(x) < 2.4 && z > -18 && z < 19) continue
    if (Math.hypot(x - 5.6, z - 18.4) < 3) continue
    const stone = createGravestone(stoneMat, textures.stone, x, z, rnd(0.65, 1.2))
    world.add(stone)
    addObstacle(x, z, 0.48)
  }

  // Boundary stones
  const boundaryMat = new THREE.MeshStandardMaterial({ color: 0x30352f, roughness: 0.9, map: textures.stone })
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * TAU
    const r = 30.4 + rnd(-0.5, 0.5)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const h = rnd(0.9, 2.1)
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.3, 0.6), h, rnd(0.3, 0.6)), boundaryMat)
    pillar.position.set(x, h / 2, z)
    pillar.rotation.y = a + rnd(-0.3, 0.3)
    pillar.rotation.z = rnd(-0.12, 0.12)
    pillar.castShadow = true
    pillar.receiveShadow = true
    world.add(pillar)
  }

  // Arch + altar
  world.add(createArch(stoneMat))
  addObstacle(-4.3, -22, 0.8)
  addObstacle(4.3, -22, 0.8)
  const altar = createAltar(stoneMat, textures.glow)
  world.add(altar.group)
  addObstacle(0, -18.4, 2.7)

  // Shrine
  const shrine = createShrine(textures.glow)
  world.add(shrine.group)
  addObstacle(5.6, 18.4, 1.15)

  // Braziers
  const braziers = []
  for (const [x, z] of [[-8.5, 8.5], [8.5, 8.5], [-8.5, -8.5], [8.5, -8.5]]) {
    const brazier = createBrazier(x, z, textures.glow)
    world.add(brazier.group)
    braziers.push(brazier)
    addObstacle(x, z, 0.55)
  }

  // Chests
  const chests = []
  for (const [x, z] of [[-13.4, 8.2], [13.8, -2.5], [-11.2, -14.5]]) {
    const chest = createChest(x, z, textures.glow)
    world.add(chest.group)
    chests.push(chest)
    addObstacle(x, z, 0.8)
  }

  // Ground fog
  const fogSprites = createGroundFog(textures.fog, 18)
  fogSprites.forEach((s) => world.add(s))

  // Ash and embers
  const ash = createAsh(700, 0x9ab0b5, 0.055, textures.particle, 'fall')
  scene.add(ash.points)
  const embers = createAsh(130, 0xff8a3a, 0.075, textures.particle, 'rise')
  scene.add(embers.points)
  const fireflies = createAsh(55, 0x6ce0d2, 0.09, textures.particle, 'rise')
  scene.add(fireflies.points)

  // A distant veil of mist around the arena
  const veil = []
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU + rnd(-0.1, 0.1)
    const r = rnd(30, 36)
    const mat = new THREE.SpriteMaterial({
      map: textures.fog,
      color: 0x6f8c91,
      transparent: true,
      opacity: rnd(0.08, 0.18),
      depthWrite: false,
      rotation: rnd(0, TAU),
    })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(Math.cos(a) * r, rnd(1, 4.5), Math.sin(a) * r)
    const s = rnd(8, 18)
    sprite.scale.set(s, s * 0.8, 1)
    world.add(sprite)
    veil.push(sprite)
  }

  let time = 0
  const update = (dt) => {
    time += dt
    runeMat.opacity = 0.4 + Math.sin(time * 1.1) * 0.12
    runeCircle.rotation.z = Math.sin(time * 0.035) * 0.05
    innerGlow.material.opacity = 0.1 + Math.sin(time * 1.4) * 0.04

    for (const b of braziers) {
      const flicker = 0.75 + Math.sin(time * 9 + b.base) * 0.1 + Math.sin(time * 17.7 + b.base * 2) * 0.06
      b.light.intensity = 2.3 * flicker
      b.flame.scale.set(1.7 * flicker, 2.2 * (0.9 + flicker * 0.1), 1)
      b.flame.material.opacity = 0.62 + flicker * 0.24
      b.flame2.scale.set(0.72 * flicker, 1.2 * flicker, 1)
    }

    shrine.rune.material.opacity = 0.6 + Math.sin(time * 1.6) * 0.22
    shrine.halo.material.opacity = 0.4 + Math.sin(time * 1.2) * 0.14
    shrine.light.intensity = 1.35 + Math.sin(time * 1.7) * 0.25

    for (const chest of chests) {
      chest.rune.material.opacity = 0.65 + Math.sin(time * 2 + chest.group.position.x) * 0.2
      chest.glow.material.opacity = 0.28 + Math.sin(time * 1.4 + chest.group.position.z) * 0.1
      if (chest.opened && chest.openT < 1) {
        chest.openT = Math.min(1, chest.openT + dt * 2.5)
        chest.lidPivot.rotation.x = -chest.openT * 1.75
        chest.glow.material.opacity = Math.max(0, chest.glow.material.opacity - dt * 0.4)
      }
    }

    altar.glow.material.opacity = 0.15 + Math.sin(time * 0.9) * 0.06

    for (const s of fogSprites) {
      const d = s.userData
      s.position.x = d.baseX + Math.sin(time * d.speed + d.phase) * 2.4
      s.position.z = d.baseZ + Math.cos(time * d.speed * 0.8 + d.phase) * 2.1
      s.material.rotation += d.rotSpeed * dt
    }

    for (const s of veil) {
      s.material.rotation += dt * 0.01
    }

    // ash fall
    const apos = ash.points.geometry.attributes.position.array
    for (let i = 0; i < ash.count; i++) {
      const i3 = i * 3
      apos[i3 + 1] -= ash.speeds[i] * dt
      apos[i3] += Math.sin(time * 0.35 + ash.phases[i]) * dt * 0.22
      apos[i3 + 2] += Math.cos(time * 0.28 + ash.phases[i]) * dt * 0.18
      if (apos[i3 + 1] < 0.02) {
        const a = rnd(0, TAU)
        const r = rnd(2, 34)
        apos[i3] = Math.cos(a) * r
        apos[i3 + 1] = rnd(12, 20)
        apos[i3 + 2] = Math.sin(a) * r
      }
    }
    ash.points.geometry.attributes.position.needsUpdate = true

    // embers rise
    const epos = embers.points.geometry.attributes.position.array
    for (let i = 0; i < embers.count; i++) {
      const i3 = i * 3
      epos[i3 + 1] += embers.speeds[i] * dt * 0.8
      epos[i3] += Math.sin(time * 0.8 + embers.phases[i]) * dt * 0.35
      if (epos[i3 + 1] > 11) {
        const a = rnd(0, TAU)
        const r = rnd(2, 28)
        epos[i3] = Math.cos(a) * r
        epos[i3 + 1] = rnd(0.1, 1.2)
        epos[i3 + 2] = Math.sin(a) * r
      }
    }
    embers.points.geometry.attributes.position.needsUpdate = true

    const fpos = fireflies.points.geometry.attributes.position.array
    for (let i = 0; i < fireflies.count; i++) {
      const i3 = i * 3
      fpos[i3 + 1] += Math.sin(time * 0.4 + fireflies.phases[i]) * dt * 0.08
      fpos[i3] += Math.cos(time * 0.3 + fireflies.phases[i]) * dt * 0.08
      fpos[i3 + 2] += Math.sin(time * 0.24 + fireflies.phases[i]) * dt * 0.08
    }
    fireflies.points.geometry.attributes.position.needsUpdate = true
  }

  return {
    world,
    textures,
    obstacles,
    braziers,
    chests,
    shrine,
    altar,
    runeCircle,
    moonLight,
    stars,
    fogSprites,
    update,
    treePositions,
  }
}
