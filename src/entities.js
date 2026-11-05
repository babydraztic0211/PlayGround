import * as THREE from 'three'

const TAU = Math.PI * 2
const rnd = (a, b) => a + Math.random() * (b - a)

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.82,
    metalness: opts.metalness ?? 0.04,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    side: opts.side ?? THREE.FrontSide,
  })
}

function mesh(geo, material, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = cast
  m.receiveShadow = true
  return m
}

function limb(length, r1, r2, material, segments = 7) {
  const geo = new THREE.CylinderGeometry(r1, r2, length, segments)
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function glowSprite(texture, color, scale, opacity = 0.8) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity,
  }))
  sprite.scale.set(scale, scale, 1)
  return sprite
}

function tatteredCloak(material, width = 1.0, height = 1.35, jag = 0.08) {
  const geo = new THREE.PlaneGeometry(width, height, 6, 9)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const v = (y + height / 2) / height
    const spread = 0.56 + (1 - v) * 0.62
    pos.setX(i, x * spread)
    let ny = y
    if (v < 0.08) ny -= Math.abs(Math.sin(x * 14.3)) * jag + jag * 0.5
    pos.setY(i, ny)
    pos.setZ(i, -0.04 - (1 - v) * 0.18 + Math.sin(x * 5.5) * 0.035 + Math.cos(v * 7) * 0.018)
  }
  geo.computeVertexNormals()
  const cloak = new THREE.Mesh(geo, material)
  cloak.castShadow = true
  cloak.receiveShadow = true
  return cloak
}

export function createPlayer(scene, textures) {
  const group = new THREE.Group()
  group.position.set(0, 0, 16)
  const rig = new THREE.Group()
  group.add(rig)

  const leather = mat(0x3c2e24, { roughness: 0.9 })
  const darkCloth = mat(0x2b353c, { roughness: 0.94, side: THREE.DoubleSide, emissive: 0x0b1114, emissiveIntensity: 0.5 })
  const innerCloth = mat(0x35433f, { roughness: 0.92, emissive: 0x0a1110, emissiveIntensity: 0.35 })
  const steel = mat(0xb3bcbc, { roughness: 0.33, metalness: 0.88, emissive: 0x1a2222, emissiveIntensity: 0.3 })
  const darkSteel = mat(0x4c5656, { roughness: 0.46, metalness: 0.78 })
  const brass = mat(0xb08a45, { roughness: 0.36, metalness: 0.82, emissive: 0x2b1b06, emissiveIntensity: 0.25 })
  const skin = mat(0xb59a83, { roughness: 0.8 })
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7ce3d7 })
  const flashMats = [leather, darkCloth, innerCloth, steel, darkSteel, brass, skin]

  const hips = new THREE.Group()
  hips.position.y = 0.94
  rig.add(hips)

  const belt = mesh(new THREE.CylinderGeometry(0.31, 0.33, 0.14, 10), leather, 0, 0.08, 0)
  hips.add(belt)
  const buckle = mesh(new THREE.BoxGeometry(0.13, 0.12, 0.035), brass, 0, 0.08, 0.33)
  hips.add(buckle)

  // Legs
  const leftLeg = new THREE.Group()
  leftLeg.position.set(-0.16, 0, 0)
  const rightLeg = new THREE.Group()
  rightLeg.position.set(0.16, 0, 0)
  hips.add(leftLeg, rightLeg)

  for (const [leg, side] of [[leftLeg, -1], [rightLeg, 1]]) {
    const thigh = limb(0.46, 0.105, 0.09, innerCloth)
    thigh.position.y = -0.24
    leg.add(thigh)
    const shin = limb(0.44, 0.085, 0.07, leather)
    shin.position.y = -0.65
    leg.add(shin)
    const boot = mesh(new THREE.BoxGeometry(0.18, 0.17, 0.31), leather, 0, -0.9, 0.06)
    leg.add(boot)
    const knee = mesh(new THREE.SphereGeometry(0.095, 8, 6), darkSteel, 0, -0.47, 0.035)
    knee.scale.set(1, 0.75, 0.75)
    leg.add(knee)
    const legPlate = mesh(new THREE.BoxGeometry(0.14, 0.27, 0.035), darkSteel, side * 0.01, -0.64, 0.085)
    legPlate.rotation.x = -0.06
    leg.add(legPlate)
  }

  // Torso
  const torso = new THREE.Group()
  torso.position.y = 0.2
  hips.add(torso)

  const body = mesh(new THREE.CylinderGeometry(0.28, 0.23, 0.66, 9), innerCloth, 0, 0.32, 0)
  torso.add(body)

  const chest = mesh(new THREE.CylinderGeometry(0.29, 0.26, 0.32, 9), darkSteel, 0, 0.47, 0.015)
  chest.scale.z = 0.78
  torso.add(chest)

  const strap = mesh(new THREE.BoxGeometry(0.1, 0.67, 0.02), leather, -0.12, 0.32, 0.26)
  strap.rotation.z = 0.34
  torso.add(strap)
  const strap2 = mesh(new THREE.BoxGeometry(0.06, 0.6, 0.02), leather, 0.13, 0.3, 0.255)
  strap2.rotation.z = -0.22
  torso.add(strap2)

  const collar = mesh(new THREE.TorusGeometry(0.18, 0.035, 5, 12), darkCloth, 0, 0.66, 0)
  collar.rotation.x = Math.PI / 2
  torso.add(collar)

  // Shoulder pauldrons
  for (const side of [-1, 1]) {
    const pauldron = mesh(new THREE.SphereGeometry(0.17, 9, 7), darkSteel, side * 0.31, 0.56, 0)
    pauldron.scale.set(1.2, 0.62, 1.0)
    torso.add(pauldron)
    const ridge = mesh(new THREE.TorusGeometry(0.16, 0.018, 5, 10), brass, side * 0.31, 0.58, 0)
    ridge.rotation.x = Math.PI / 2
    ridge.scale.y = 0.9
    torso.add(ridge)
  }

  // Head
  const head = new THREE.Group()
  head.position.y = 0.83
  torso.add(head)

  const neck = mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.15, 7), skin, 0, -0.08, 0)
  head.add(neck)
  const face = mesh(new THREE.SphereGeometry(0.17, 12, 10), skin, 0, 0.08, 0.015)
  face.scale.set(0.88, 1.05, 0.88)
  head.add(face)

  const hood = mesh(new THREE.SphereGeometry(0.245, 13, 10), darkCloth, 0, 0.11, -0.015)
  hood.scale.set(1.0, 1.12, 1.05)
  head.add(hood)

  const hoodCone = mesh(new THREE.ConeGeometry(0.24, 0.36, 9, 1, true), darkCloth, 0, 0.27, -0.09)
  hoodCone.rotation.x = -0.2
  head.add(hoodCone)

  const faceShadow = mesh(new THREE.SphereGeometry(0.148, 10, 8), new THREE.MeshBasicMaterial({ color: 0x020303 }), 0, 0.08, 0.14)
  faceShadow.scale.set(1, 1.05, 0.4)
  head.add(faceShadow)

  const eyeL = mesh(new THREE.SphereGeometry(0.021, 6, 5), eyeMat, -0.062, 0.1, 0.215, false)
  const eyeR = mesh(new THREE.SphereGeometry(0.021, 6, 5), eyeMat, 0.062, 0.1, 0.215, false)
  head.add(eyeL, eyeR)
  const eyeGlow = glowSprite(textures.glow, 0x68d9ce, 0.3, 0.32)
  eyeGlow.position.set(0, 0.1, 0.22)
  head.add(eyeGlow)

  // Arms
  const leftArm = new THREE.Group()
  leftArm.position.set(-0.37, 0.57, 0)
  const rightArm = new THREE.Group()
  rightArm.position.set(0.37, 0.57, 0)
  torso.add(leftArm, rightArm)

  for (const [arm, side] of [[leftArm, -1], [rightArm, 1]]) {
    const upper = limb(0.38, 0.085, 0.07, innerCloth)
    upper.position.y = -0.19
    arm.add(upper)
    const elbow = mesh(new THREE.SphereGeometry(0.078, 8, 6), leather, 0, -0.39, 0)
    arm.add(elbow)
    const fore = new THREE.Group()
    fore.position.y = -0.4
    arm.add(fore)
    const foreMesh = limb(0.34, 0.068, 0.055, leather)
    foreMesh.position.y = -0.17
    fore.add(foreMesh)
    const hand = mesh(new THREE.BoxGeometry(0.1, 0.14, 0.09), leather, 0, -0.37, 0.01)
    fore.add(hand)
    const bracer = mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.18, 7), darkSteel, 0, -0.22, 0)
    fore.add(bracer)
    arm.userData.fore = fore
  }

  // Sword
  const sword = new THREE.Group()
  sword.position.set(0, -0.36, 0.02)
  sword.rotation.z = -0.18
  rightArm.userData.fore.add(sword)

  const grip = mesh(new THREE.CylinderGeometry(0.027, 0.03, 0.24, 6), leather, 0, 0.04, 0)
  sword.add(grip)
  const pommel = mesh(new THREE.SphereGeometry(0.055, 7, 6), brass, 0, -0.09, 0)
  sword.add(pommel)
  const guard = mesh(new THREE.BoxGeometry(0.3, 0.045, 0.06), darkSteel, 0, 0.17, 0)
  sword.add(guard)
  const blade = mesh(new THREE.BoxGeometry(0.075, 1.02, 0.018), steel, 0, 0.7, 0)
  sword.add(blade)
  const bladeTip = mesh(new THREE.ConeGeometry(0.043, 0.16, 4), steel, 0, 1.27, 0)
  bladeTip.rotation.y = Math.PI / 4
  sword.add(bladeTip)
  const edge = mesh(new THREE.BoxGeometry(0.018, 1.0, 0.004), new THREE.MeshBasicMaterial({ color: 0x6f8f8d }), 0, 0.7, 0.011, false)
  sword.add(edge)
  const swordGlow = glowSprite(textures.glow, 0x62c7bc, 0.55, 0.0)
  swordGlow.position.y = 0.7
  sword.add(swordGlow)

  // Cloak removed — keep the silhouette readable from the chase camera

  // Lantern
  const lantern = new THREE.Group()
  lantern.position.set(-0.33, 0.05, 0.04)
  hips.add(lantern)
  const lanternBody = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 6), darkSteel, 0, 0, 0)
  lantern.add(lanternBody)
  const lanternGlow = glowSprite(textures.glow, 0xffa95a, 0.55, 0.7)
  lanternGlow.position.y = 0
  lantern.add(lanternGlow)
  const lanternLight = new THREE.PointLight(0xff9f55, 0.85, 5.5, 2)
  lanternLight.position.y = 0
  lantern.add(lanternLight)

  // Cool rim light so the silhouette stays readable against the gloom
  const rimLight = new THREE.PointLight(0x9fd6e4, 2.1, 7, 2)
  rimLight.position.set(0.8, 2.6, -1.9)
  group.add(rimLight)

  // Grounding shadow-ish disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.01
  group.add(shadow)

  group.userData.rig = rig
  scene.add(group)

  return {
    group,
    rig,
    hips,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftFore: leftArm.userData.fore,
    rightFore: rightArm.userData.fore,
    sword,
    edge,
    swordGlow,
    lantern,
    lanternLight,
    eyeGlow,
    eyeMat,
    flashMats,
    materials: { steel, brass, darkCloth, leather, innerCloth, darkSteel },
  }
}

function makeHealthBar() {
  const group = new THREE.Group()
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x050606, transparent: true, opacity: 0.82, depthWrite: false })
  )
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 0.065),
    new THREE.MeshBasicMaterial({ color: 0xa32930, depthWrite: false })
  )
  fill.position.z = 0.002
  const glint = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 0.018),
    new THREE.MeshBasicMaterial({ color: 0xff8c83, transparent: true, opacity: 0.45, depthWrite: false })
  )
  glint.position.set(0, 0.02, 0.003)
  group.add(back, fill, glint)
  group.visible = false
  return { group, fill, glint, back }
}

export function createEnemy(scene, type, x, z, textures) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  const rig = new THREE.Group()
  group.add(rig)

  const isBrute = type === 'brute'
  const isWisp = type === 'wisp'
  const scale = isBrute ? 1.38 : isWisp ? 1 : 1

  const clothColor = isBrute ? 0x2a1a17 : isWisp ? 0x172527 : 0x20261f
  const cloth = mat(clothColor, { roughness: 0.98, side: THREE.DoubleSide })
  const leather = mat(isBrute ? 0x2e1c16 : 0x1b1c18, { roughness: 0.94 })
  const bone = mat(0x9b9787, { roughness: 0.78 })
  const iron = mat(0x3d4140, { roughness: 0.55, metalness: 0.66 })
  const eyeColor = isBrute ? 0xff4b3e : isWisp ? 0x78d8ff : 0x73e2cf
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor })
  const flashMats = [cloth, leather, bone, iron]

  const body = new THREE.Group()
  body.position.y = 0.92
  rig.add(body)

  const torso = mesh(new THREE.CylinderGeometry(isBrute ? 0.4 : 0.24, isBrute ? 0.3 : 0.2, isBrute ? 0.8 : 0.7, 8), cloth, 0, isBrute ? 0.35 : 0.33, 0)
  torso.rotation.x = isBrute ? 0.04 : 0.13
  body.add(torso)

  if (!isWisp) {
    const rib = mesh(new THREE.TorusGeometry(isBrute ? 0.28 : 0.18, 0.025, 4, 10), bone, 0, 0.42, 0.03)
    rib.rotation.x = Math.PI / 2
    rib.scale.y = 1.4
    body.add(rib)
  }

  const shoulders = mesh(new THREE.BoxGeometry(isBrute ? 0.86 : 0.52, 0.11, 0.24), leather, 0, isBrute ? 0.68 : 0.61, 0)
  body.add(shoulders)

  // Head
  const head = new THREE.Group()
  head.position.set(0, isBrute ? 0.83 : 0.72, isWisp ? 0 : 0.05)
  body.add(head)

  const skull = mesh(new THREE.SphereGeometry(isBrute ? 0.2 : 0.15, 9, 7), isWisp ? cloth : bone, 0, 0.03, 0)
  skull.scale.set(0.9, 1.05, 0.82)
  head.add(skull)

  const hood = mesh(new THREE.SphereGeometry(isBrute ? 0.26 : 0.2, 10, 8), cloth, 0, 0.02, -0.02)
  hood.scale.set(1, 1.08, 1)
  head.add(hood)

  const jaw = mesh(new THREE.BoxGeometry(isBrute ? 0.16 : 0.11, 0.06, 0.1), bone, 0, -0.08, 0.1)
  head.add(jaw)

  const eyeL = mesh(new THREE.SphereGeometry(0.022, 5, 4), eyeMat, -0.055, 0.04, 0.14, false)
  const eyeR = mesh(new THREE.SphereGeometry(0.022, 5, 4), eyeMat, 0.055, 0.04, 0.14, false)
  head.add(eyeL, eyeR)
  const glow = glowSprite(textures.glow, eyeColor, isBrute ? 0.5 : 0.32, 0.4)
  glow.position.set(0, 0.04, 0.17)
  head.add(glow)

  if (isBrute) {
    for (const side of [-1, 1]) {
      const horn = mesh(new THREE.ConeGeometry(0.055, 0.35, 5), bone, side * 0.18, 0.2, -0.02)
      horn.rotation.z = side * 0.72
      horn.rotation.x = -0.15
      head.add(horn)
    }
  }

  // Legs
  let leftLeg = null
  let rightLeg = null
  if (!isWisp) {
    leftLeg = new THREE.Group()
    leftLeg.position.set(-0.14, 0.88, 0)
    rightLeg = new THREE.Group()
    rightLeg.position.set(0.14, 0.88, 0)
    rig.add(leftLeg, rightLeg)
    for (const leg of [leftLeg, rightLeg]) {
      const thigh = limb(isBrute ? 0.42 : 0.46, isBrute ? 0.12 : 0.075, 0.06, leather)
      thigh.position.y = -0.23
      leg.add(thigh)
      const shin = limb(isBrute ? 0.4 : 0.44, 0.06, 0.045, cloth)
      shin.position.y = -0.65
      leg.add(shin)
      const foot = mesh(new THREE.BoxGeometry(0.16, 0.11, 0.3), leather, 0, -0.9, 0.07)
      leg.add(foot)
    }
  } else {
    const tail = mesh(new THREE.ConeGeometry(0.34, 1.15, 8, 1, true), cloth, 0, 0.35, 0)
    tail.position.y = 0.35
    tail.rotation.x = Math.PI
    rig.add(tail)
    const wispGlow = glowSprite(textures.glow, eyeColor, 1.8, 0.22)
    wispGlow.position.y = 1.0
    rig.add(wispGlow)
  }

  // Arms
  const leftArm = new THREE.Group()
  leftArm.position.set(isBrute ? -0.46 : -0.3, isBrute ? 0.62 : 0.55, 0)
  const rightArm = new THREE.Group()
  rightArm.position.set(isBrute ? 0.46 : 0.3, isBrute ? 0.62 : 0.55, 0)
  body.add(leftArm, rightArm)

  for (const arm of [leftArm, rightArm]) {
    const upper = limb(isBrute ? 0.42 : 0.35, isBrute ? 0.105 : 0.06, 0.05, isWisp ? cloth : leather)
    upper.position.y = -0.18
    arm.add(upper)
    const fore = new THREE.Group()
    fore.position.y = -0.37
    arm.add(fore)
    const foreMesh = limb(isBrute ? 0.36 : 0.3, 0.052, 0.038, cloth)
    foreMesh.position.y = -0.15
    fore.add(foreMesh)
    const claw = mesh(new THREE.ConeGeometry(0.06, 0.16, 5), bone, 0, -0.34, 0.02)
    claw.rotation.x = Math.PI
    fore.add(claw)
    arm.userData.fore = fore
  }

  // Weapon
  const weapon = new THREE.Group()
  weapon.position.set(0, -0.31, 0.03)
  rightArm.userData.fore.add(weapon)
  if (isBrute) {
    const handle = mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.15, 6), leather, 0, 0.42, 0)
    weapon.add(handle)
    const headBlock = mesh(new THREE.BoxGeometry(0.42, 0.32, 0.3), iron, 0, 0.98, 0)
    weapon.add(headBlock)
    const spike = mesh(new THREE.ConeGeometry(0.09, 0.26, 5), iron, 0, 1.22, 0)
    weapon.add(spike)
  } else if (!isWisp) {
    const handle = mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.3, 6), leather, 0, 0.06, 0)
    weapon.add(handle)
    const cleaver = mesh(new THREE.BoxGeometry(0.07, 0.65, 0.02), iron, 0, 0.48, 0)
    cleaver.rotation.z = 0.12
    weapon.add(cleaver)
    const hook = mesh(new THREE.BoxGeometry(0.16, 0.08, 0.022), iron, 0.07, 0.73, 0)
    weapon.add(hook)
  } else {
    const orb = mesh(new THREE.SphereGeometry(0.11, 9, 7), new THREE.MeshBasicMaterial({ color: eyeColor }), 0, 0.05, 0, false)
    weapon.add(orb)
    const orbGlow = glowSprite(textures.glow, eyeColor, 0.9, 0.6)
    orbGlow.position.y = 0.05
    weapon.add(orbGlow)
  }

  const cloak = tatteredCloak(cloth, isBrute ? 1.1 : 0.86, isBrute ? 1.15 : 1.0, 0.08)
  cloak.position.set(0, 0.4, -0.18)
  cloak.rotation.x = 0.1
  body.add(cloak)

  // Telegraph ring
  const telegraph = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.7, 24),
    new THREE.MeshBasicMaterial({ color: 0xff3d35, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  )
  telegraph.rotation.x = -Math.PI / 2
  telegraph.position.y = 0.03
  group.add(telegraph)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(isBrute ? 0.5 : 0.36, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.005
  group.add(shadow)

  group.scale.setScalar(scale)
  scene.add(group)

  const bar = makeHealthBar()
  scene.add(bar.group)

  return {
    type,
    group,
    rig,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftFore: leftArm.userData.fore,
    rightFore: rightArm.userData.fore,
    weapon,
    cloak,
    telegraph,
    eyeMat,
    glow,
    flashMats,
    bar,
    baseY: 0,
  }
}

export function createBoss(scene, x, z, textures) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  const rig = new THREE.Group()
  group.add(rig)

  const bone = mat(0xa29d8c, { roughness: 0.72 })
  const oldBone = mat(0x746f60, { roughness: 0.85 })
  const iron = mat(0x3c3f3d, { roughness: 0.42, metalness: 0.82 })
  const brass = mat(0x7a5c2e, { roughness: 0.4, metalness: 0.8 })
  const cloth = mat(0x1c1211, { roughness: 0.96, side: THREE.DoubleSide })
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4137 })
  const flashMats = [bone, oldBone, iron, brass, cloth]

  const pelvis = new THREE.Group()
  pelvis.position.y = 1.2
  rig.add(pelvis)

  const pelvisMesh = mesh(new THREE.BoxGeometry(0.55, 0.24, 0.34), oldBone, 0, 0, 0)
  pelvis.add(pelvisMesh)

  // Legs
  const leftLeg = new THREE.Group()
  leftLeg.position.set(-0.2, 1.18, 0)
  const rightLeg = new THREE.Group()
  rightLeg.position.set(0.2, 1.18, 0)
  rig.add(leftLeg, rightLeg)
  for (const leg of [leftLeg, rightLeg]) {
    const thigh = limb(0.52, 0.12, 0.1, oldBone)
    thigh.position.y = -0.26
    leg.add(thigh)
    const knee = mesh(new THREE.SphereGeometry(0.13, 7, 6), iron, 0, -0.53, 0.02)
    leg.add(knee)
    const shin = limb(0.52, 0.1, 0.08, oldBone)
    shin.position.y = -0.77
    leg.add(shin)
    const sabaton = mesh(new THREE.BoxGeometry(0.27, 0.19, 0.47), iron, 0, -1.07, 0.09)
    leg.add(sabaton)
    const spike = mesh(new THREE.ConeGeometry(0.06, 0.2, 5), iron, 0, -1.04, 0.36)
    spike.rotation.x = 1.1
    leg.add(spike)
  }

  // Torso
  const torso = new THREE.Group()
  torso.position.y = 1.55
  rig.add(torso)

  const spine = mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.1, 6), oldBone, 0, 0.25, -0.02)
  torso.add(spine)

  for (let i = 0; i < 4; i++) {
    const rib = mesh(new THREE.TorusGeometry(0.32 - i * 0.025, 0.035, 5, 12), bone, 0, 0.12 + i * 0.2, 0.02)
    rib.rotation.x = Math.PI / 2
    rib.scale.y = 0.72
    torso.add(rib)
  }

  const chest = mesh(new THREE.BoxGeometry(0.62, 0.36, 0.34), iron, 0, 0.62, 0.04)
  chest.rotation.x = -0.12
  torso.add(chest)

  const chestRune = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.24),
    new THREE.MeshBasicMaterial({ color: 0xff5b47, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
  )
  chestRune.position.set(0, 0.62, 0.23)
  torso.add(chestRune)

  for (const side of [-1, 1]) {
    const pauldron = mesh(new THREE.SphereGeometry(0.26, 9, 7), iron, side * 0.45, 0.7, 0)
    pauldron.scale.set(1.2, 0.66, 1.05)
    torso.add(pauldron)
    const pauldronSpike = mesh(new THREE.ConeGeometry(0.075, 0.4, 5), iron, side * 0.62, 0.82, 0)
    pauldronSpike.rotation.z = side * 0.8
    torso.add(pauldronSpike)
    const rim = mesh(new THREE.TorusGeometry(0.23, 0.018, 4, 10), brass, side * 0.45, 0.72, 0)
    rim.rotation.x = Math.PI / 2
    torso.add(rim)
  }

  // Skull head
  const head = new THREE.Group()
  head.position.y = 1.03
  torso.add(head)

  const skull = mesh(new THREE.SphereGeometry(0.22, 10, 8), bone, 0, 0.04, 0.02)
  skull.scale.set(0.9, 1.05, 0.9)
  head.add(skull)
  const jaw = mesh(new THREE.BoxGeometry(0.23, 0.12, 0.18), oldBone, 0, -0.13, 0.08)
  head.add(jaw)
  const teeth = mesh(new THREE.BoxGeometry(0.2, 0.035, 0.04), bone, 0, -0.07, 0.16)
  head.add(teeth)

  const eyeL = mesh(new THREE.SphereGeometry(0.032, 5, 4), eyeMat, -0.085, 0.06, 0.18, false)
  const eyeR = mesh(new THREE.SphereGeometry(0.032, 5, 4), eyeMat, 0.085, 0.06, 0.18, false)
  head.add(eyeL, eyeR)
  const eyeGlow = glowSprite(textures.glow, 0xff3f34, 0.9, 0.6)
  eyeGlow.position.set(0, 0.06, 0.2)
  head.add(eyeGlow)

  // Crown/helm
  const helm = mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.22, 8), iron, 0, 0.18, -0.02)
  head.add(helm)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU
    const spike = mesh(new THREE.ConeGeometry(0.035, 0.24 + (i % 2) * 0.12, 5), brass, Math.cos(a) * 0.2, 0.36, Math.sin(a) * 0.2 - 0.02)
    spike.rotation.z = Math.cos(a) * 0.2
    spike.rotation.x = -Math.sin(a) * 0.2
    head.add(spike)
  }

  // Arms
  const leftArm = new THREE.Group()
  leftArm.position.set(-0.52, 0.66, 0)
  const rightArm = new THREE.Group()
  rightArm.position.set(0.52, 0.66, 0)
  torso.add(leftArm, rightArm)

  for (const arm of [leftArm, rightArm]) {
    const upper = limb(0.52, 0.1, 0.08, oldBone)
    upper.position.y = -0.26
    arm.add(upper)
    const elbow = mesh(new THREE.SphereGeometry(0.11, 7, 6), iron, 0, -0.54, 0)
    arm.add(elbow)
    const fore = new THREE.Group()
    fore.position.y = -0.55
    arm.add(fore)
    const foreMesh = limb(0.5, 0.075, 0.055, oldBone)
    foreMesh.position.y = -0.24
    fore.add(foreMesh)
    const bracer = mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.26, 6), iron, 0, -0.28, 0)
    fore.add(bracer)
    const hand = mesh(new THREE.BoxGeometry(0.14, 0.18, 0.13), oldBone, 0, -0.51, 0.02)
    fore.add(hand)
    arm.userData.fore = fore
  }

  // Great axe
  const axe = new THREE.Group()
  axe.position.set(0, -0.46, 0.02)
  axe.rotation.z = -0.1
  rightArm.userData.fore.add(axe)
  const haft = mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.5, 6), cloth, 0, 0.65, 0)
  axe.add(haft)
  const haftWrap = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 6), cloth, 0, 0.05, 0)
  axe.add(haftWrap)
  const axeHead = mesh(new THREE.BoxGeometry(0.8, 0.5, 0.1), iron, 0, 1.74, 0)
  axe.add(axeHead)
  const axeBlade = mesh(new THREE.CylinderGeometry(0.48, 0.3, 0.1, 3), iron, 0, 1.74, 0)
  axeBlade.rotation.y = Math.PI / 2
  axeBlade.rotation.z = Math.PI / 2
  axeBlade.scale.set(1, 0.3, 0.6)
  axe.add(axeBlade)
  const axeGlow = glowSprite(textures.glow, 0xff3f34, 1.5, 0.2)
  axeGlow.position.y = 1.7
  axe.add(axeGlow)

  // Tattered cloak
  const cloak = tatteredCloak(cloth, 1.6, 2.1, 0.16)
  cloak.position.set(0, 0.35, -0.32)
  cloak.rotation.x = 0.12
  torso.add(cloak)

  // Aura ring
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 1.2, 40),
    new THREE.MeshBasicMaterial({ color: 0xa32930, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  )
  aura.rotation.x = -Math.PI / 2
  aura.position.y = 0.02
  group.add(aura)

  const telegraph = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 0.92, 32),
    new THREE.MeshBasicMaterial({ color: 0xff3d35, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  )
  telegraph.rotation.x = -Math.PI / 2
  telegraph.position.y = 0.035
  group.add(telegraph)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.005
  group.add(shadow)

  const light = new THREE.PointLight(0xff3b2f, 1.5, 10, 2)
  light.position.set(0, 2.6, 0.5)
  group.add(light)

  group.scale.setScalar(1.9)
  scene.add(group)

  const bar = makeHealthBar()
  scene.add(bar.group)

  return {
    type: 'boss',
    group,
    rig,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftFore: leftArm.userData.fore,
    rightFore: rightArm.userData.fore,
    axe,
    axeGlow,
    cloak,
    aura,
    telegraph,
    eyeMat,
    eyeGlow,
    flashMats,
    bar,
    light,
    baseY: 0,
  }
}
