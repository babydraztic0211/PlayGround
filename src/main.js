import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { buildWorld } from './world.js'
import { createPlayer, createEnemy, createBoss } from './entities.js'
import { GameAudio } from './audio.js'
import './style.css'

const $ = (sel) => document.querySelector(sel)
const TAU = Math.PI * 2
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const lerp = (a, b, t) => a + (b - a) * t
const rnd = (a, b) => a + Math.random() * (b - a)
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt))
const smooth = (t) => t * t * (3 - 2 * t)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))
const angleDamp = (a, b, lambda, dt) => a + angleDelta(a, b) * (1 - Math.exp(-lambda * dt))
const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n)

const canvas = $('#world')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.55
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 260)
camera.position.set(12, 7, 20)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.6, 0.74)
composer.addPass(bloomPass)
composer.addPass(new OutputPass())

const world = buildWorld(scene)
const avatar = createPlayer(scene, world.textures)
const audio = new GameAudio()

const ui = {
  hud: $('#hud'),
  hpFill: $('#hp-fill'),
  hpText: $('#hp-text'),
  staminaFill: $('#stamina-fill'),
  xpFill: $('#xp-fill'),
  xpText: $('#xp-text'),
  levelPill: $('#level-pill'),
  objectiveKicker: $('#objective-kicker'),
  objectiveTitle: $('#objective-title'),
  objectiveSub: $('#objective-sub'),
  shardCount: $('#shard-count'),
  killCount: $('#kill-count'),
  flaskCount: $('#flask-count'),
  touchFlasks: $('#touch-flasks'),
  weaponTag: $('#weapon-tag'),
  charmTag: $('#charm-tag'),
  waveBanner: $('#wave-banner'),
  waveKicker: $('#wave-kicker'),
  waveTitle: $('#wave-title'),
  waveSub: $('#wave-sub'),
  bossBar: $('#boss-bar'),
  bossFill: $('#boss-fill'),
  interact: $('#interact-prompt'),
  interactLabel: $('#interact-label'),
  toastLayer: $('#toast-layer'),
  damageLayer: $('#damage-layer'),
  crosshair: $('#crosshair'),
  minimap: $('#minimap'),
  title: $('#title-screen'),
  satchel: $('#satchel-screen'),
  pause: $('#pause-screen'),
  death: $('#death-screen'),
  victory: $('#victory-screen'),
  loading: $('#loading-screen'),
  touch: $('#touch-ui'),
  blood: $('#blood-flash'),
  vignette: $('#vignette'),
  materials: $('#materials-grid'),
  recipes: $('#recipes-grid'),
  boons: $('#boon-row'),
  modalShards: $('#modal-shards'),
  equipWeapon: $('#equip-weapon'),
  equipWeaponStat: $('#equip-weapon-stat'),
  equipArmor: $('#equip-armor'),
  equipArmorStat: $('#equip-armor-stat'),
  equipCharm: $('#equip-charm'),
  equipCharmStat: $('#equip-charm-stat'),
  statDamage: $('#stat-damage'),
  statVitality: $('#stat-vitality'),
  statFlasks: $('#stat-flasks'),
  heroLevel: $('#hero-level'),
  deathStats: $('#death-stats'),
  victoryStats: $('#victory-stats'),
  startBtn: $('#start-btn'),
  titleSoundBtn: $('#title-sound-btn'),
  pauseSoundBtn: $('#pause-sound-btn'),
  retryBtn: $('#retry-btn'),
  againBtn: $('#again-btn'),
  resumeBtn: $('#resume-btn'),
  satchelClose: $('#satchel-close'),
  pauseSatchelBtn: $('#pause-satchel-btn'),
  abandonBtn: $('#abandon-btn'),
  deathTitleBtn: $('#death-title-btn'),
  victoryTitleBtn: $('#victory-title-btn'),
  joystick: $('#joystick'),
  joystickStick: $('#joystick-stick'),
}

const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window

const GAME = {
  state: 'loading',
  phase: 'idle',
  waveIndex: -1,
  waveKilled: 0,
  waveTotal: 0,
  spawnQueue: [],
  spawnTimer: 0,
  clearTimer: 0,
  enemies: [],
  boss: null,
  projectiles: [],
  loot: [],
  effects: [],
  kills: 0,
  totalShards: 0,
  runTime: 0,
  slowmo: 0,
  shake: 0,
  hitStop: 0,
  objectiveBase: '',
  satchelReturn: 'playing',
  lastInteract: null,
  minimapTimer: 0,
  titleTime: 0,
  deathTimer: 0,
}

const player = {
  avatar,
  group: avatar.group,
  hp: 120,
  maxHp: 120,
  stamina: 100,
  maxStamina: 100,
  damage: 18,
  flasks: 3,
  maxFlasks: 3,
  invuln: 0,
  hurtT: 0,
  regenDelay: 0,
  attack: null,
  roll: null,
  moving: false,
  animTime: 0,
  facing: Math.PI,
  targetFacing: Math.PI,
  lastAttack: -10,
  combo: 0,
  healT: 0,
  flashT: 0,
  level: 1,
  essence: 0,
  essenceNext: 80,
  damageReduction: 0,
  inventory: { iron: 1, bone: 1, ember: 1, shard: 0 },
  upgrades: { blade: false, cuirass: false, charm: false, flasks: 0, whetstones: 0 },
  equipment: { weapon: 'Rusted Edge', armor: 'Tattered Leathers', charm: 'Empty Reliquary' },
  gatherCooldown: 0,
}

let cameraYaw = 0
let cameraPitch = 0.23
let cameraDistance = 6.9
let pointerWasLocked = false
let titleCameraAngle = 0.9
let lastFrame = performance.now()
let toastBuffer = {}
let toastTimer = null
let chestId = 0
let damageId = 0

const MATERIALS = {
  iron: { name: 'Iron Scrap', icon: 'i-iron', desc: 'Bent, blackened, still sharp enough.' },
  bone: { name: 'Bone Dust', icon: 'i-bone', desc: 'Ground from the faithful and the false.' },
  ember: { name: 'Soul Ember', icon: 'i-ember', desc: 'A coal that remembers a heartbeat.' },
  shard: { name: 'Soul Shard', icon: 'i-shard', desc: 'Currency of the Gloomwood.' },
}

const RECIPES = [
  {
    id: 'blade',
    name: 'Emberforged Blade',
    icon: 'i-sword',
    desc: 'Temper the rust away in soul-fire. +12 strike damage.',
    cost: { iron: 3, ember: 1 },
    unique: true,
    flag: 'blade',
    apply: () => {
      player.upgrades.blade = true
      player.equipment.weapon = 'Emberforged Blade'
    },
  },
  {
    id: 'cuirass',
    name: 'Boneweave Cuirass',
    icon: 'i-shield',
    desc: 'Layered bone and grave-iron. +40 vitality, 5% ward.',
    cost: { bone: 3, iron: 2 },
    unique: true,
    flag: 'cuirass',
    apply: () => {
      player.upgrades.cuirass = true
      player.equipment.armor = 'Boneweave Cuirass'
    },
  },
  {
    id: 'charm',
    name: 'Graveward Charm',
    icon: 'i-amulet',
    desc: 'A reliquary of ash. Wards away 20% of all harm.',
    cost: { bone: 3, ember: 2, iron: 1 },
    unique: true,
    flag: 'charm',
    apply: () => {
      player.upgrades.charm = true
      player.equipment.charm = 'Graveward Charm'
    },
  },
  {
    id: 'flask',
    name: 'Blood Flask',
    icon: 'i-flask',
    desc: 'Widen the vessel. +1 flask, and fill every flask.',
    cost: { bone: 1, ember: 1 },
    counter: 'flasks',
    limit: 2,
    apply: () => {
      player.upgrades.flasks += 1
    },
  },
  {
    id: 'whetstone',
    name: 'Grave Whetstone',
    icon: 'i-spark',
    desc: 'Hone the edge on a dead man’s stone. +6 strike damage.',
    cost: { iron: 2, bone: 1 },
    counter: 'whetstones',
    limit: 4,
    apply: () => {
      player.upgrades.whetstones += 1
    },
  },
]

const WAVES = [
  {
    kicker: 'RITE I',
    title: 'The Restless Dead',
    sub: 'The Gloomwood remembers your name.',
    objective: 'Purge the hollow ones',
    groups: [['thrall', 4]],
  },
  {
    kicker: 'RITE II',
    title: 'Bones Remember',
    sub: 'What the earth rejects, the dark accepts.',
    objective: 'Break the risen ranks',
    groups: [['thrall', 5], ['brute', 1]],
  },
  {
    kicker: 'RITE III',
    title: 'The Hollow Choir',
    sub: 'They sing without tongues. Answer with steel.',
    objective: 'Silence the choir',
    groups: [['thrall', 4], ['wisp', 2], ['brute', 1]],
  },
  {
    kicker: 'FINAL RITE',
    title: 'The Bone Warden',
    sub: 'The Hollow Crown has a keeper.',
    objective: 'Break the Hollow Crown',
    boss: true,
  },
]

const ENEMY_STATS = {
  thrall: { hp: 62, speed: 2.2, damage: 12, range: 1.7, windup: 0.52, cooldown: 1.35, essence: 15, radius: 0.36, barY: 2.05 },
  brute: { hp: 190, speed: 1.5, damage: 26, range: 2.35, windup: 1.0, cooldown: 2.1, essence: 42, radius: 0.58, barY: 2.7 },
  wisp: { hp: 48, speed: 1.75, damage: 11, range: 12, windup: 0.72, cooldown: 2.7, essence: 22, radius: 0.34, barY: 2.3 },
}

const LOOT_COLORS = {
  iron: 0x9fb0b0,
  bone: 0xe0d6b8,
  ember: 0xff7a36,
  shard: 0x74e0d4,
}

const lootGeo = new THREE.IcosahedronGeometry(0.11, 0)
const lootRingGeo = new THREE.TorusGeometry(0.18, 0.012, 4, 12)

function worldToScreen(pos) {
  const p = pos.clone().project(camera)
  return {
    x: (p.x * 0.5 + 0.5) * window.innerWidth,
    y: (-p.y * 0.5 + 0.5) * window.innerHeight,
    visible: p.z < 1 && p.z > -1,
  }
}

function setHidden(el, hidden) {
  if (!el) return
  el.classList.toggle('is-hidden', hidden)
}

function setObjective(kicker, title, sub) {
  ui.objectiveKicker.textContent = kicker
  ui.objectiveTitle.textContent = title
  ui.objectiveSub.textContent = sub
  GAME.objectiveBase = sub
}

function updateObjectiveCount() {
  if (GAME.phase === 'combat') {
    ui.objectiveSub.textContent = `${GAME.objectiveBase} — ${GAME.waveKilled} / ${GAME.waveTotal}`
  }
}

function showWaveBanner(kicker, title, sub) {
  ui.waveKicker.textContent = kicker
  ui.waveTitle.textContent = title
  ui.waveSub.textContent = sub
  ui.waveBanner.classList.remove('show')
  void ui.waveBanner.offsetWidth
  ui.waveBanner.classList.add('show')
}

function showToast(icon, text, rare = false) {
  const toast = document.createElement('div')
  toast.className = `toast${rare ? ' rare' : ''}`
  toast.innerHTML = `<svg><use href="#${icon}"></use></svg><span>${text}</span>`
  ui.toastLayer.prepend(toast)
  while (ui.toastLayer.children.length > 5) ui.toastLayer.lastElementChild.remove()
  window.setTimeout(() => toast.remove(), 3700)
}

function bufferLootToast(type, amount) {
  toastBuffer[type] = (toastBuffer[type] || 0) + amount
  if (toastTimer) return
  toastTimer = window.setTimeout(() => {
    for (const [key, value] of Object.entries(toastBuffer)) {
      if (!value) continue
      const mat = MATERIALS[key]
      showToast(mat.icon, `<b>+${value}</b> ${mat.name}`, key === 'ember' || key === 'shard')
    }
    toastBuffer = {}
    toastTimer = null
  }, 380)
}

function screenShake(amount) {
  GAME.shake = Math.min(0.65, Math.max(GAME.shake, amount))
}

function flashDamage() {
  ui.blood.classList.add('flash')
  ui.vignette.classList.add('hurt')
  window.setTimeout(() => ui.blood.classList.remove('flash'), 90)
  window.setTimeout(() => ui.vignette.classList.remove('hurt'), 320)
}

function damageNumber(pos, amount, kind = '') {
  const screen = worldToScreen(pos)
  if (!screen.visible) return
  const el = document.createElement('div')
  el.className = `dmg-number ${kind}`.trim()
  el.textContent = kind === 'heal' ? `+${Math.round(amount)}` : `${Math.round(amount)}`
  el.style.left = `${screen.x + rnd(-8, 8)}px`
  el.style.top = `${screen.y}px`
  el.dataset.id = String(++damageId)
  ui.damageLayer.appendChild(el)
  window.setTimeout(() => el.remove(), 950)
}

function pulseCrosshair() {
  ui.crosshair.classList.add('hit')
  window.clearTimeout(pulseCrosshair.timeout)
  pulseCrosshair.timeout = window.setTimeout(() => ui.crosshair.classList.remove('hit'), 110)
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function showScreen(el) {
  el.classList.remove('is-hidden')
}

function hideScreen(el) {
  el.classList.add('is-hidden')
}

function hideAllScreens() {
  hideScreen(ui.title)
  hideScreen(ui.satchel)
  hideScreen(ui.pause)
  hideScreen(ui.death)
  hideScreen(ui.victory)
}

function recalcStats(healDelta = true) {
  const oldMax = player.maxHp
  player.maxHp = 120 + (player.upgrades.cuirass ? 40 : 0) + (player.level - 1) * 10
  player.damage = 18 + (player.upgrades.blade ? 12 : 0) + player.upgrades.whetstones * 6 + (player.level - 1) * 2
  player.maxFlasks = 3 + player.upgrades.flasks
  player.damageReduction = (player.upgrades.charm ? 0.2 : 0) + (player.upgrades.cuirass ? 0.05 : 0)
  if (healDelta && player.maxHp > oldMax) player.hp += player.maxHp - oldMax
  player.hp = clamp(player.hp, 1, player.maxHp)
  player.flasks = clamp(player.flasks, 0, player.maxFlasks)
  updateSwordVisuals()
}

function updateSwordVisuals() {
  const blade = player.upgrades.blade
  avatar.edge.material.color.setHex(blade ? 0xffc875 : 0x6f8f8d)
  avatar.swordGlow.material.color.setHex(blade ? 0xffa548 : 0x62c7bc)
  avatar.swordGlow.material.opacity = blade ? 0.35 : 0
  avatar.materials.steel.emissive.setHex(blade ? 0x3a1c06 : 0x0c1010)
  avatar.materials.steel.emissiveIntensity = blade ? 0.55 : 0.2
}

function updateHUD() {
  const hpPct = clamp(player.hp / player.maxHp, 0, 1)
  ui.hpFill.style.width = `${hpPct * 100}%`
  ui.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`
  ui.staminaFill.style.width = `${clamp(player.stamina / player.maxStamina, 0, 1) * 100}%`
  ui.xpFill.style.width = `${clamp(player.essence / player.essenceNext, 0, 1) * 100}%`
  ui.xpText.textContent = `SOUL ESSENCE ${Math.floor(player.essence)}`
  ui.levelPill.textContent = `SOUL ${roman(player.level)}`
  ui.shardCount.textContent = String(player.inventory.shard)
  ui.killCount.textContent = String(GAME.kills)
  ui.flaskCount.textContent = String(player.flasks)
  ui.touchFlasks.textContent = String(player.flasks)
  ui.weaponTag.textContent = player.upgrades.blade ? 'EMBERFORGED' : 'RUSTED EDGE'
  ui.charmTag.textContent = player.upgrades.charm ? 'GRAVEWARD' : 'NO CHARM'
  if (GAME.boss && !GAME.boss.dead) {
    ui.bossFill.style.width = `${clamp(GAME.boss.hp / GAME.boss.maxHp, 0, 1) * 100}%`
  }
}

function addResource(type, amount) {
  if (!amount) return
  if (type === 'shard') {
    player.inventory.shard += amount
    GAME.totalShards += amount
  } else {
    player.inventory[type] = (player.inventory[type] || 0) + amount
  }
  updateHUD()
}

function gainEssence(amount) {
  player.essence += amount
  let leveled = false
  while (player.essence >= player.essenceNext) {
    player.essence -= player.essenceNext
    player.level += 1
    player.essenceNext = Math.round(player.essenceNext * 1.34)
    leveled = true
  }
  if (leveled) {
    recalcStats(true)
    player.hp = Math.min(player.maxHp, player.hp + 25)
    player.stamina = player.maxStamina
    showToast('i-spark', `<b>SOUL ASCENDED</b> — Level ${roman(player.level)}`, true)
    spawnSoulBurst(player.group.position.clone().setY(1.1), 0xffd782, 28)
    spawnRing(player.group.position.clone().setY(0.08), 0xffd782, 0.4, 3.2, 1.1, 0.55)
    audio.levelUp()
  }
  updateHUD()
}

function spawnLoot(type, amount, pos, burst = true) {
  if (amount <= 0) return
  const color = LOOT_COLORS[type] || 0xffffff
  const group = new THREE.Group()
  group.position.copy(pos)
  group.position.y = Math.max(0.45, pos.y)
  if (burst) {
    group.position.x += rnd(-0.7, 0.7)
    group.position.z += rnd(-0.7, 0.7)
  }
  const coreMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
  const core = new THREE.Mesh(lootGeo, coreMat)
  group.add(core)
  const ring = new THREE.Mesh(lootRingGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
  ring.rotation.x = Math.PI / 2.5
  group.add(ring)
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: world.textures.glow,
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.7,
  }))
  glow.scale.set(0.85, 0.85, 1)
  group.add(glow)
  scene.add(group)
  const orb = {
    type,
    amount,
    group,
    core,
    ring,
    glow,
    age: 0,
    settled: false,
    vel: new THREE.Vector3(rnd(-1.8, 1.8), rnd(2.6, 4.2), rnd(-1.8, 1.8)),
    baseY: 0.45,
    phase: rnd(0, TAU),
  }
  GAME.loot.push(orb)
}

function collectOrb(orb) {
  addResource(orb.type, orb.amount)
  bufferLootToast(orb.type, orb.amount)
  spawnSparks(orb.group.position.clone(), LOOT_COLORS[orb.type], 7, 2.2, 0.05)
  audio.pickup(orb.type === 'ember' || orb.type === 'shard')
  scene.remove(orb.group)
  orb.dead = true
}

function gatherNearby() {
  if (GAME.state !== 'playing') return
  let count = 0
  for (const orb of GAME.loot) {
    if (orb.dead) continue
    if (orb.group.position.distanceTo(player.group.position) < 5.4) {
      collectOrb(orb)
      count++
    }
  }
  if (count > 0) {
    showToast('i-key', `Gathered <b>${count}</b> offering${count > 1 ? 's' : ''}`)
    spawnRing(player.group.position.clone().setY(0.05), 0x74e0d4, 0.4, 3.4, 0.5, 0.3)
  }
}

function setSoundLabels() {
  const label = audio.muted ? 'SOUND: OFF' : 'SOUND: ON'
  ui.titleSoundBtn.textContent = label
  ui.pauseSoundBtn.textContent = label
}

function toggleSound() {
  audio.init()
  audio.toggle()
  setSoundLabels()
}

function resetProgression() {
  player.hp = 120
  player.maxHp = 120
  player.stamina = 100
  player.flasks = 3
  player.maxFlasks = 3
  player.level = 1
  player.essence = 0
  player.essenceNext = 80
  player.inventory = { iron: 1, bone: 1, ember: 1, shard: 0 }
  player.upgrades = { blade: false, cuirass: false, charm: false, flasks: 0, whetstones: 0 }
  player.equipment = { weapon: 'Rusted Edge', armor: 'Tattered Leathers', charm: 'Empty Reliquary' }
  player.damage = 18
  player.damageReduction = 0
  player.invuln = 0
  player.attack = null
  player.roll = null
  player.combo = 0
  player.lastAttack = -10
  player.facing = Math.PI
  player.targetFacing = Math.PI
  player.healT = 0
  recalcStats(false)
  player.hp = player.maxHp
  player.flasks = player.maxFlasks
  updateSwordVisuals()
  updateHUD()
}

function removeEntity(entity) {
  if (!entity) return
  scene.remove(entity.group)
  if (entity.bar) scene.remove(entity.bar.group)
}

function clearEntities() {
  for (const e of GAME.enemies) removeEntity(e.rig)
  for (const p of GAME.projectiles) scene.remove(p.group)
  for (const l of GAME.loot) scene.remove(l.group)
  for (const fx of GAME.effects) if (fx.object) scene.remove(fx.object)
  if (GAME.boss) removeEntity(GAME.boss.rig)
  GAME.enemies = []
  GAME.projectiles = []
  GAME.loot = []
  GAME.effects = []
  GAME.boss = null
  GAME.spawnQueue = []
}

function resetWorldObjects() {
  for (const chest of world.chests) {
    chest.opened = false
    chest.openT = 0
    chest.lidPivot.rotation.x = 0
    chest.glow.material.opacity = 0.4
  }
}

function startRun() {
  audio.init()
  hideAllScreens()
  resetProgression()
  clearEntities()
  resetWorldObjects()
  player.group.position.set(0, 0, 16)
  player.group.rotation.set(0, Math.PI, 0)
  avatar.rig.position.set(0, 0, 0)
  avatar.rig.rotation.set(0, 0, 0)
  player.facing = Math.PI
  player.targetFacing = Math.PI
  player.hurtT = 0
  player.invuln = 0
  cameraYaw = 0
  cameraPitch = 0.23
  cameraDistance = 6.9
  camera.position.set(0, 3.3, 22)
  GAME.state = 'playing'
  GAME.phase = 'idle'
  GAME.waveIndex = -1
  GAME.waveKilled = 0
  GAME.waveTotal = 0
  GAME.kills = 0
  GAME.totalShards = 0
  GAME.runTime = 0
  GAME.slowmo = 0
  GAME.shake = 0
  GAME.hitStop = 0
  GAME.clearTimer = 0
  ui.hud.classList.remove('is-hidden')
  ui.touch.classList.toggle('is-hidden', !isTouch)
  ui.bossBar.classList.add('is-hidden')
  ui.interact.classList.add('is-hidden')
  updateHUD()
  setObjective('THE GLOOMWOOD', 'Awaken', 'The dead are waiting.')
  startWave(0)
  if (!isTouch) requestPointerLock()
}

function requestPointerLock() {
  if (isTouch) return
  if (document.pointerLockElement === canvas) return
  try {
    const result = canvas.requestPointerLock()
    if (result && typeof result.catch === 'function') result.catch(() => {})
  } catch {
    // Pointer lock can be unavailable in embeds and automated browsers.
  }
}

function startWave(index) {
  if (index >= WAVES.length) return
  GAME.waveIndex = index
  const wave = WAVES[index]
  if (wave.boss) {
    startBoss()
    return
  }
  GAME.phase = 'combat'
  GAME.waveKilled = 0
  GAME.waveTotal = wave.groups.reduce((sum, [, count]) => sum + count, 0)
  GAME.spawnQueue = []
  for (const [type, count] of wave.groups) {
    for (let i = 0; i < count; i++) GAME.spawnQueue.push(type)
  }
  GAME.spawnTimer = 1.0
  showWaveBanner(wave.kicker, wave.title, wave.sub)
  setObjective(wave.kicker, wave.title, `${wave.objective} — 0 / ${GAME.waveTotal}`)
  updateHUD()
  audio.wave()
}

function startBoss() {
  GAME.phase = 'boss'
  GAME.waveIndex = 3
  GAME.waveKilled = 0
  GAME.waveTotal = 1
  showWaveBanner('FINAL RITE', 'The Bone Warden', 'The Hollow Crown has a keeper.')
  setObjective('FINAL RITE', 'The Bone Warden', 'Break the Hollow Crown')
  audio.bossRoar()
  screenShake(0.4)

  const rig = createBoss(scene, 0, -14.4, world.textures)
  rig.group.position.y = -3.4
  const boss = {
    rig,
    group: rig.group,
    aura: rig.aura,
    light: rig.light,
    axeGlow: rig.axeGlow,
    eyeMat: rig.eyeMat,
    telegraph: rig.telegraph,
    bar: rig.bar,
    hp: 780,
    maxHp: 780,
    damage: 34,
    speed: 1.9,
    radius: 1.15,
    barY: 4.9,
    state: 'rising',
    timer: 2.0,
    attackCd: 2.2,
    chargeCd: 5.5,
    rise: 0,
    anim: 0,
    walk: 0,
    flash: 0,
    dead: false,
    deathT: 0,
    summoned1: false,
    summoned2: false,
    enraged: false,
    essence: 220,
    facing: 0,
    targetFacing: 0,
    chargeDir: new THREE.Vector3(),
    didHit: false,
  }
  GAME.boss = boss
  ui.bossBar.classList.remove('is-hidden')
  ui.bossFill.style.width = '100%'
  updateHUD()
  spawnMist(new THREE.Vector3(0, 0.4, -14.4), 0x9f3a3a, 6, 2.2)
  window.setTimeout(() => {
    if (GAME.state === 'playing' && GAME.boss === boss) {
      spawnSoulBurst(new THREE.Vector3(0, 1.5, -14.4), 0xff4a3b, 30)
      screenShake(0.3)
    }
  }, 600)
}

function completeWave() {
  if (GAME.phase !== 'combat') return
  GAME.phase = 'cleared'
  GAME.clearTimer = 3.4
  player.hp = Math.min(player.maxHp, player.hp + 20)
  player.flasks = Math.min(player.maxFlasks, player.flasks + 1)
  showWaveBanner('RITE COMPLETE', 'The Gloom Breathes', 'Gather what the dead left behind.')
  setObjective('RITE COMPLETE', 'The way opens', 'Prepare yourself. The next rite stirs.')
  audio.levelUp()
  spawnLoot('iron', 2, player.group.position.clone(), true)
  spawnLoot('bone', 2, player.group.position.clone(), true)
  spawnLoot('ember', 1, player.group.position.clone(), true)
  spawnLoot('shard', 18, player.group.position.clone(), true)
  updateHUD()
}

function checkWaveComplete() {
  if (GAME.phase !== 'combat') return
  if (GAME.spawnQueue.length > 0) return
  const alive = GAME.enemies.some((e) => !e.dead)
  if (!alive) completeWave()
}

function updateWaves(dt) {
  if (GAME.phase === 'combat') {
    if (GAME.spawnQueue.length > 0) {
      GAME.spawnTimer -= dt
      if (GAME.spawnTimer <= 0) {
        const type = GAME.spawnQueue.shift()
        const p = findSpawnPoint()
        spawnEnemy(type, p.x, p.z)
        GAME.spawnTimer = rnd(0.35, 0.72)
      }
    }
    checkWaveComplete()
  } else if (GAME.phase === 'cleared') {
    GAME.clearTimer -= dt
    if (GAME.clearTimer <= 0) {
      if (GAME.waveIndex + 1 < WAVES.length) startWave(GAME.waveIndex + 1)
    }
  }
}

function findSpawnPoint() {
  for (let i = 0; i < 30; i++) {
    const a = rnd(0, TAU)
    const r = rnd(13, 21)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (Math.hypot(x - player.group.position.x, z - player.group.position.z) < 8) continue
    let blocked = false
    for (const o of world.obstacles) {
      if (Math.hypot(x - o.x, z - o.z) < o.r + 1.2) {
        blocked = true
        break
      }
    }
    if (!blocked) return { x, z }
  }
  return { x: rnd(-12, 12), z: rnd(-8, 8) }
}

function spawnEnemy(type, x, z) {
  const base = ENEMY_STATS[type]
  const scale = 1 + GAME.waveIndex * 0.1
  const rig = createEnemy(scene, type, x, z, world.textures)
  const e = {
    rig,
    group: rig.group,
    type,
    glow: rig.glow,
    telegraph: rig.telegraph,
    bar: rig.bar,
    hp: Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    damage: Math.round(base.damage * (1 + GAME.waveIndex * 0.06)),
    speed: base.speed * (1 + GAME.waveIndex * 0.025),
    range: base.range,
    windup: base.windup,
    cooldown: base.cooldown,
    essence: base.essence,
    radius: base.radius,
    barY: base.barY,
    state: 'idle',
    attackState: null,
    attackTimer: 0,
    attackCd: rnd(0.4, 1.4),
    flash: 0,
    stagger: 0,
    dead: false,
    deathT: 0,
    anim: rnd(0, 10),
    walk: 0,
    moving: false,
    facing: 0,
    targetFacing: 0,
    shootCd: rnd(0.5, 1.5),
  }
  rig.bar.fill.scale.x = 1
  rig.bar.fill.position.x = 0
  rig.bar.group.visible = false
  GAME.enemies.push(e)
  spawnMist(new THREE.Vector3(x, 0.25, z), type === 'brute' ? 0xff5a42 : type === 'wisp' ? 0x65cde0 : 0x78d4c7, type === 'brute' ? 2.2 : 1.4, 0.9)
  return e
}

function spawnBossAdds(count) {
  if (!GAME.boss) return
  for (let i = 0; i < count; i++) {
    const a = rnd(0, TAU)
    const x = GAME.boss.group.position.x + Math.cos(a) * rnd(2.5, 4.5)
    const z = GAME.boss.group.position.z + Math.sin(a) * rnd(2.5, 4.5)
    spawnEnemy('thrall', x, z)
  }
  spawnRing(GAME.boss.group.position.clone().setY(0.06), 0xff4034, 0.8, 7, 0.9, 0.5)
}

function spawnSparks(pos, color = 0xffffff, count = 10, speed = 4, size = 0.055) {
  const positions = new Float32Array(count * 3)
  const velocities = []
  for (let i = 0; i < count; i++) {
    positions[i * 3] = pos.x
    positions[i * 3 + 1] = pos.y
    positions[i * 3 + 2] = pos.z
    const a = rnd(0, TAU)
    const up = rnd(0.2, 1)
    velocities.push(new THREE.Vector3(Math.cos(a) * rnd(0.4, 1) * speed, up * speed, Math.sin(a) * rnd(0.4, 1) * speed))
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color,
    size,
    map: world.textures.particle,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  scene.add(points)
  GAME.effects.push({
    object: points,
    life: 0,
    maxLife: rnd(0.45, 0.8),
    update(dt) {
      this.life += dt
      const arr = geo.attributes.position.array
      for (let i = 0; i < count; i++) {
        const v = velocities[i]
        v.y -= 9 * dt
        arr[i * 3] += v.x * dt
        arr[i * 3 + 1] += v.y * dt
        arr[i * 3 + 2] += v.z * dt
      }
      geo.attributes.position.needsUpdate = true
      mat.opacity = clamp(1 - this.life / this.maxLife, 0, 1)
      return this.life < this.maxLife
    },
  })
}

function spawnRing(pos, color, startScale, endScale, duration, opacity = 0.5) {
  const group = new THREE.Group()
  group.position.copy(pos)
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.0, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  )
  mesh.rotation.x = -Math.PI / 2
  group.add(mesh)
  scene.add(group)
  GAME.effects.push({
    object: group,
    life: 0,
    maxLife: duration,
    startScale,
    endScale,
    opacity,
    update(dt) {
      this.life += dt
      const p = clamp(this.life / this.maxLife, 0, 1)
      const s = lerp(this.startScale, this.endScale, easeOut(p))
      group.scale.set(s, s, s)
      mesh.material.opacity = this.opacity * (1 - p)
      return this.life < this.maxLife
    },
  })
}

function spawnMist(pos, color = 0x8eb5b6, scale = 1.6, duration = 1.1) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: world.textures.fog,
    color,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.NormalBlending,
    rotation: rnd(0, TAU),
  }))
  sprite.position.copy(pos)
  sprite.scale.set(scale, scale * 0.55, 1)
  scene.add(sprite)
  GAME.effects.push({
    object: sprite,
    life: 0,
    maxLife: duration,
    update(dt) {
      this.life += dt
      const p = clamp(this.life / this.maxLife, 0, 1)
      const s = scale * (1 + p * 1.6)
      sprite.scale.set(s, s * 0.55, 1)
      sprite.position.y += dt * 0.28
      sprite.material.opacity = 0.3 * (1 - p)
      sprite.material.rotation += dt * 0.25
      return this.life < this.maxLife
    },
  })
}

function spawnSlash(pos, facing, color = 0x8fe6da, heavy = false) {
  const group = new THREE.Group()
  group.position.copy(pos)
  group.position.y = heavy ? 0.7 : 1.05
  group.rotation.y = facing - Math.PI / 2
  const arc = new THREE.Mesh(
    new THREE.RingGeometry(heavy ? 0.5 : 0.55, heavy ? 1.9 : 1.5, 28, 1, heavy ? -1.15 : -0.8, heavy ? 2.3 : 1.6),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: heavy ? 0.55 : 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  )
  arc.rotation.x = -Math.PI / 2
  group.add(arc)
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: world.textures.glow,
    color,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }))
  flash.position.set(0, 0.05, 0)
  flash.scale.set(heavy ? 2.2 : 1.4, heavy ? 2.2 : 1.4, 1)
  group.add(flash)
  scene.add(group)
  GAME.effects.push({
    object: group,
    life: 0,
    maxLife: heavy ? 0.42 : 0.3,
    update(dt) {
      this.life += dt
      const p = clamp(this.life / this.maxLife, 0, 1)
      group.rotation.z += dt * (heavy ? 1.2 : 2.2)
      const s = 1 + easeOut(p) * (heavy ? 0.65 : 0.35)
      group.scale.set(s, s, s)
      arc.material.opacity = (heavy ? 0.55 : 0.42) * (1 - p)
      flash.material.opacity = 0.3 * (1 - p)
      return this.life < this.maxLife
    },
  })
}

function spawnSoulBurst(pos, color = 0x74e0d4, count = 24) {
  spawnSparks(pos, color, count, 3.4, 0.07)
  spawnRing(pos.clone().setY(0.06), color, 0.2, 2.4, 0.8, 0.35)
}

function spawnProjectile(origin, target, damage) {
  const group = new THREE.Group()
  group.position.copy(origin)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x7fdcff })
  )
  group.add(core)
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: world.textures.glow,
    color: 0x76d7ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.8,
  }))
  glow.scale.set(0.8, 0.8, 1)
  group.add(glow)
  scene.add(group)
  const dir = target.clone().sub(origin).normalize()
  GAME.projectiles.push({
    group,
    vel: dir.multiplyScalar(8.5),
    life: 0,
    damage,
  })
}

function updateEffects(dt) {
  for (let i = GAME.effects.length - 1; i >= 0; i--) {
    const fx = GAME.effects[i]
    const alive = fx.update(dt)
    if (!alive) {
      scene.remove(fx.object)
      GAME.effects.splice(i, 1)
    }
  }
}

function cameraForward() {
  return new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
}

function cameraRight() {
  return new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw))
}

function playerAttack(heavy = false) {
  if (GAME.state !== 'playing' || player.attack || player.roll) return
  const cost = heavy ? 30 : 8
  if (player.stamina < cost) return
  player.stamina -= cost
  player.regenDelay = 0.7
  const fwd = cameraForward()
  player.facing = Math.atan2(fwd.x, fwd.z)
  player.targetFacing = player.facing
  player.group.rotation.y = player.facing
  const chain = GAME.runTime - player.lastAttack < 0.85 ? (player.combo % 3) + 1 : 1
  player.combo = chain
  player.lastAttack = GAME.runTime
  player.attack = {
    t: 0,
    duration: heavy ? 0.62 : chain === 3 ? 0.46 : 0.38,
    hitAt: heavy ? 0.3 : 0.14,
    hitDone: false,
    heavy,
    combo: chain,
  }
  audio.swing(heavy)
  updateHUD()
}

function performMeleeHit(attack) {
  const fwd = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing))
  const heavy = attack.heavy
  const range = heavy ? 3.6 : 2.6
  const targets = GAME.enemies.filter((e) => !e.dead)
  if (GAME.boss && !GAME.boss.dead) targets.push(GAME.boss)
  let hitAny = false
  let anyCrit = false
  for (const target of targets) {
    const dx = target.group.position.x - player.group.position.x
    const dz = target.group.position.z - player.group.position.z
    const dist = Math.hypot(dx, dz)
    const reach = range + (target.radius || 0.35)
    if (dist > reach) continue
    const dot = dist < 0.35 ? 1 : (dx * fwd.x + dz * fwd.z) / dist
    if (dot < (heavy ? -0.3 : 0.05)) continue
    const comboMult = heavy ? 2.05 : attack.combo === 3 ? 1.5 : attack.combo === 2 ? 1.15 : 1
    const crit = Math.random() < (heavy ? 0.2 : 0.14)
    const dmg = player.damage * comboMult * rnd(0.9, 1.1) * (crit ? 1.8 : 1)
    applyDamage(target, dmg, { crit, heavy, fwd })
    hitAny = true
    anyCrit = anyCrit || crit
  }
  const slashPos = player.group.position.clone().addScaledVector(fwd, heavy ? 1.3 : 0.95)
  spawnSlash(slashPos, player.facing, heavy ? 0xffb060 : 0x8fe6da, heavy)
  if (hitAny) {
    screenShake(heavy ? 0.24 : 0.09)
    audio.hit(anyCrit)
    GAME.hitStop = heavy ? 0.04 : 0.02
    pulseCrosshair()
  }
}

function applyDamage(target, amount, { crit = false, heavy = false, fwd = null } = {}) {
  if (!target || target.dead) return
  target.hp -= amount
  target.flash = 0.14
  target.stagger = Math.max(target.stagger || 0, heavy ? 0.32 : 0.1)
  if (fwd) {
    const push = heavy ? 0.38 : 0.12
    target.group.position.x += fwd.x * push
    target.group.position.z += fwd.z * push
  }
  const y = target.type === 'boss' ? 3.4 : 1.65
  damageNumber(target.group.position.clone().setY(y), amount, crit ? 'crit' : '')
  spawnSparks(target.group.position.clone().setY(1.25), crit ? 0xffd57d : 0xff9a63, crit ? 18 : 10, crit ? 5.2 : 3.8, 0.055)
  if (target.hp <= 0) {
    if (target.type === 'boss') killBoss()
    else killEnemy(target)
  }
}

function killEnemy(e) {
  if (e.dead) return
  e.dead = true
  e.deathT = 0
  e.state = 'dead'
  e.attackState = null
  e.bar.group.visible = false
  e.telegraph.material.opacity = 0
  GAME.kills += 1
  if (GAME.phase === 'combat') {
    GAME.waveKilled += 1
    updateObjectiveCount()
  }
  gainEssence(e.essence)
  spawnSoulBurst(
    e.group.position.clone().setY(e.type === 'wisp' ? 1.1 : 0.9),
    e.type === 'wisp' ? 0x7fdcff : e.type === 'brute' ? 0xff6b50 : 0x74e0d4,
    e.type === 'brute' ? 30 : 17
  )
  screenShake(e.type === 'brute' ? 0.2 : 0.08)

  const pos = e.group.position.clone()
  spawnLoot('shard', Math.round(rnd(4, 9) * (e.type === 'brute' ? 1.8 : 1)), pos, true)
  const matCount = e.type === 'brute' ? 3 : e.type === 'wisp' ? 2 : Math.random() < 0.4 ? 2 : 1
  for (let i = 0; i < matCount; i++) {
    const roll = Math.random()
    const type = roll < 0.45 ? 'iron' : roll < 0.78 ? 'bone' : 'ember'
    spawnLoot(type, 1, pos, true)
  }
  checkWaveComplete()
}

function killBoss() {
  const boss = GAME.boss
  if (!boss || boss.dead) return
  boss.dead = true
  boss.state = 'dead'
  boss.deathT = 0
  boss.bar.group.visible = false
  GAME.phase = 'victory'
  GAME.slowmo = 2.4
  GAME.spawnQueue = []
  screenShake(0.7)
  audio.bossRoar()
  for (const e of GAME.enemies) {
    if (!e.dead) {
      e.dead = true
      e.deathT = 0
      e.attackState = null
      e.bar.group.visible = false
      spawnSoulBurst(e.group.position.clone().setY(1), 0x74e0d4, 12)
    }
  }
  const p = boss.group.position.clone()
  spawnSoulBurst(p.clone().setY(2), 0xffd782, 60)
  spawnRing(p.clone().setY(0.08), 0xffd782, 0.8, 12, 1.8, 0.65)
  spawnRing(p.clone().setY(0.1), 0xa32930, 0.5, 8, 1.3, 0.5)
  spawnLoot('shard', 120, p, true)
  spawnLoot('iron', 4, p, true)
  spawnLoot('bone', 4, p, true)
  spawnLoot('ember', 4, p, true)
  setObjective('THE HOLLOW CROWN', 'Broken', 'The dark is afraid.')
  ui.bossFill.style.width = '0%'
  window.setTimeout(showVictory, 2800)
}

function showVictory() {
  if (GAME.state !== 'playing' && GAME.state !== 'dead') return
  if (!GAME.boss || !GAME.boss.dead) return
  GAME.state = 'victory'
  document.exitPointerLock?.()
  ui.interact.classList.add('is-hidden')
  ui.victoryStats.innerHTML = `
    <div class="end-stat"><span>FOES SLAIN</span><b>${GAME.kills}</b></div>
    <div class="end-stat"><span>TIME IN THE DARK</span><b>${formatTime(GAME.runTime)}</b></div>
    <div class="end-stat"><span>SOUL LEVEL</span><b>${roman(player.level)}</b></div>
    <div class="end-stat"><span>SHARDS WON</span><b>${GAME.totalShards}</b></div>
  `
  showScreen(ui.victory)
  ui.hud.classList.add('is-hidden')
  ui.touch.classList.add('is-hidden')
  audio.victory()
}

function damagePlayer(amount, source = null) {
  if (GAME.state !== 'playing') return
  if (player.invuln > 0) return
  if (player.roll && player.roll.t < player.roll.iframes) return
  const dmg = Math.max(1, amount * (1 - player.damageReduction))
  player.hp -= dmg
  player.invuln = 0.78
  player.hurtT = 0.36
  player.regenDelay = 0.9
  screenShake(0.34)
  flashDamage()
  audio.hurt()
  damageNumber(player.group.position.clone().setY(1.7), dmg, 'player')
  if (source) {
    const dir = player.group.position.clone().sub(source).setY(0).normalize()
    moveWithCollisions(player.group.position, dir.x * 0.5, dir.z * 0.5, 0.38)
  }
  if (player.hp <= 0) die()
  updateHUD()
}

function die() {
  if (GAME.state !== 'playing') return
  GAME.state = 'dead'
  player.hp = 0
  player.attack = null
  player.roll = null
  player.deathT = 0
  ui.interact.classList.add('is-hidden')
  ui.crosshair.style.opacity = '0'
  document.exitPointerLock?.()
  audio.death()
  screenShake(0.6)
  spawnRing(player.group.position.clone().setY(0.05), 0xa32930, 0.4, 4.5, 1.2, 0.5)
  updateHUD()
  window.setTimeout(() => {
    if (GAME.state !== 'dead') return
    ui.deathStats.innerHTML = `
      <div class="end-stat"><span>FOES SLAIN</span><b>${GAME.kills}</b></div>
      <div class="end-stat"><span>RITE</span><b>${GAME.waveIndex >= 3 ? 'FINAL' : roman(GAME.waveIndex + 1)}</b></div>
      <div class="end-stat"><span>SOUL LEVEL</span><b>${roman(player.level)}</b></div>
    `
    showScreen(ui.death)
    ui.hud.classList.add('is-hidden')
    ui.touch.classList.add('is-hidden')
  }, 1200)
}

function respawnAtCheckpoint() {
  if (GAME.state !== 'dead') return
  hideScreen(ui.death)
  clearEntities()
  player.hp = player.maxHp
  player.stamina = player.maxStamina
  player.flasks = player.maxFlasks
  player.invuln = 2
  player.hurtT = 0
  player.group.position.set(0, 0, 16)
  player.group.rotation.set(0, Math.PI, 0)
  avatar.rig.rotation.set(0, 0, 0)
  avatar.rig.position.set(0, 0, 0)
  player.facing = Math.PI
  player.targetFacing = Math.PI
  player.inventory.shard = Math.floor(player.inventory.shard * 0.8)
  GAME.state = 'playing'
  GAME.slowmo = 0
  ui.hud.classList.remove('is-hidden')
  ui.touch.classList.toggle('is-hidden', !isTouch)
  ui.crosshair.style.opacity = ''
  ui.bossBar.classList.add('is-hidden')
  updateHUD()
  if (GAME.waveIndex >= 3) startBoss()
  else startWave(Math.max(0, GAME.waveIndex))
  if (!isTouch) requestPointerLock()
}

function returnToTitle() {
  document.exitPointerLock?.()
  GAME.state = 'title'
  GAME.phase = 'idle'
  GAME.slowmo = 0
  GAME.shake = 0
  GAME.titleTime = 0
  clearEntities()
  hideAllScreens()
  showScreen(ui.title)
  ui.hud.classList.add('is-hidden')
  ui.touch.classList.add('is-hidden')
  ui.bossBar.classList.add('is-hidden')
  ui.crosshair.style.opacity = ''
  resetProgression()
  player.group.position.set(0, 0, 16)
  player.group.rotation.set(0, Math.PI, 0)
  avatar.rig.rotation.set(0, 0, 0)
  avatar.rig.position.set(0, 0, 0)
  setSoundLabels()
}

function dodge() {
  if (GAME.state !== 'playing' || player.roll) return
  if (player.stamina < 28) return
  const input = getMoveDirection()
  let dir = input.lengthSq() > 0.01 ? input : new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing))
  dir.normalize()
  player.facing = Math.atan2(dir.x, dir.z)
  player.targetFacing = player.facing
  player.group.rotation.y = player.facing
  player.roll = { t: 0, duration: 0.52, dir, iframes: 0.36, speed: 10.5 }
  player.stamina -= 28
  player.regenDelay = 0.8
  player.invuln = Math.max(player.invuln, 0.36)
  audio.noise(0.24, 300, 0.07, 0, 1.1, 'lowpass', 100)
  spawnMist(player.group.position.clone().setY(0.5), 0x6b9b9a, 1.4, 0.65)
  updateHUD()
}

function useFlask() {
  if (GAME.state !== 'playing') return
  if (player.flasks <= 0) return
  if (player.hp >= player.maxHp - 0.5) {
    showToast('i-flask', 'You are already whole')
    return
  }
  player.flasks -= 1
  const healed = Math.min(52, player.maxHp - player.hp)
  player.hp += healed
  player.healT = 0.8
  damageNumber(player.group.position.clone().setY(1.9), healed, 'heal')
  spawnSparks(player.group.position.clone().setY(1), 0x8ee3b0, 16, 2.6, 0.06)
  spawnRing(player.group.position.clone().setY(0.06), 0x8ee3b0, 0.3, 2.3, 0.7, 0.4)
  audio.flask()
  updateHUD()
}

function moveWithCollisions(position, dx, dz, radius = 0.4) {
  position.x += dx
  position.z += dz
  for (let pass = 0; pass < 2; pass++) {
    for (const o of world.obstacles) {
      const ox = position.x - o.x
      const oz = position.z - o.z
      const min = o.r + radius
      const d2 = ox * ox + oz * oz
      if (d2 < min * min && d2 > 0.00001) {
        const d = Math.sqrt(d2)
        const push = (min - d) / d
        position.x += ox * push
        position.z += oz * push
      }
    }
  }
  const r = Math.hypot(position.x, position.z)
  const maxR = 28.2
  if (r > maxR) {
    position.x = (position.x / r) * maxR
    position.z = (position.z / r) * maxR
  }
}

function getMoveDirection() {
  let forward = 0
  let right = 0
  if (keys['KeyW'] || keys['ArrowUp']) forward += 1
  if (keys['KeyS'] || keys['ArrowDown']) forward -= 1
  if (keys['KeyD'] || keys['ArrowRight']) right += 1
  if (keys['KeyA'] || keys['ArrowLeft']) right -= 1
  forward += -joystick.y
  right += joystick.x
  const dir = new THREE.Vector3()
  if (Math.abs(forward) > 0.01) dir.addScaledVector(cameraForward(), forward)
  if (Math.abs(right) > 0.01) dir.addScaledVector(cameraRight(), right)
  if (dir.lengthSq() > 1) dir.normalize()
  return dir
}

function updatePlayer(dt) {
  player.invuln = Math.max(0, player.invuln - dt)
  player.hurtT = Math.max(0, player.hurtT - dt)
  player.regenDelay = Math.max(0, player.regenDelay - dt)
  player.gatherCooldown = Math.max(0, player.gatherCooldown - dt)
  player.healT = Math.max(0, player.healT - dt)
  player.animTime += dt

  if (player.attack) {
    const a = player.attack
    a.t += dt
    if (!a.hitDone && a.t >= a.hitAt) {
      a.hitDone = true
      performMeleeHit(a)
    }
    if (a.t >= a.duration) player.attack = null
  }

  let moveDir = getMoveDirection()
  const moving = moveDir.lengthSq() > 0.01
  player.moving = moving
  const sprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && moving && player.stamina > 1 && !player.attack
  const speed = (sprinting ? 6.7 : 4.35) * (player.attack ? 0.26 : 1)

  if (player.roll) {
    const r = player.roll
    r.t += dt
    const p = clamp(r.t / r.duration, 0, 1)
    const velocity = r.speed * (1 - smooth(p) * 0.72)
    moveWithCollisions(player.group.position, r.dir.x * velocity * dt, r.dir.z * velocity * dt, 0.36)
    if (Math.random() < dt * 22) {
      spawnMist(player.group.position.clone().setY(0.45), 0x6d9f9b, 0.9, 0.45)
    }
    if (r.t >= r.duration) {
      player.roll = null
      avatar.rig.rotation.x = 0
      avatar.rig.position.y = 0
    }
  } else if (moving) {
    player.targetFacing = Math.atan2(moveDir.x, moveDir.z)
    player.facing = angleDamp(player.facing, player.targetFacing, 13, dt)
    player.group.rotation.y = player.facing
    moveWithCollisions(player.group.position, moveDir.x * speed * dt, moveDir.z * speed * dt, 0.38)
    if (sprinting) {
      player.stamina = Math.max(0, player.stamina - 22 * dt)
      player.regenDelay = Math.max(player.regenDelay, 0.45)
    }
  } else if (!player.attack && !player.roll) {
    player.facing = angleDamp(player.facing, player.targetFacing, 8, dt)
    player.group.rotation.y = player.facing
  }

  if (player.regenDelay <= 0 && !sprinting) {
    player.stamina = Math.min(player.maxStamina, player.stamina + 17 * dt)
  }

  animatePlayer(dt, moving, sprinting)
  updateHUD()
}

function animatePlayer(dt, moving, sprinting) {
  const p = player
  const t = p.animTime
  p.avatar.rig.rotation.x = 0
  p.avatar.rig.rotation.z = 0
  p.avatar.rig.position.y = 0

  let legSwing = 0
  let armSwing = 0
  if (moving) {
    const cadence = sprinting ? 14 : 9.5
    legSwing = Math.sin(t * cadence) * (sprinting ? 0.72 : 0.5)
    armSwing = Math.sin(t * cadence) * (sprinting ? 0.55 : 0.35)
    p.avatar.rig.position.y = Math.abs(Math.sin(t * cadence)) * 0.035
  } else {
    p.avatar.rig.position.y = Math.sin(t * 2.1) * 0.012
  }

  p.avatar.leftLeg.rotation.x = legSwing
  p.avatar.rightLeg.rotation.x = -legSwing
  p.avatar.leftArm.rotation.x = -armSwing
  p.avatar.rightArm.rotation.x = armSwing
  p.avatar.leftArm.rotation.z = 0.12
  p.avatar.rightArm.rotation.z = -0.12
  p.avatar.torso.rotation.y = Math.sin(t * (moving ? 9.5 : 1.8)) * (moving ? 0.04 : 0.018)
  p.avatar.torso.rotation.x = moving ? 0.055 : Math.sin(t * 1.7) * 0.012
  p.avatar.head.rotation.y = Math.sin(t * 0.63) * 0.055
  p.avatar.head.rotation.x = Math.sin(t * 0.9) * 0.02

  if (p.attack) {
    const a = p.attack
    const pr = clamp(a.t / a.duration, 0, 1)
    const windupEnd = a.heavy ? 0.42 : 0.34
    const swingEnd = a.heavy ? 0.72 : 0.64
    if (pr < windupEnd) {
      const k = smooth(pr / windupEnd)
      p.avatar.rightArm.rotation.x = lerp(0, a.heavy ? -2.55 : -1.9, k)
      p.avatar.rightArm.rotation.z = lerp(-0.12, a.heavy ? -0.9 : -0.55, k)
      p.avatar.leftArm.rotation.x = lerp(0, -0.7, k)
      p.avatar.torso.rotation.y = lerp(0, -0.42, k)
      p.avatar.torso.rotation.x = lerp(0.05, -0.12, k)
    } else if (pr < swingEnd) {
      const k = smooth((pr - windupEnd) / (swingEnd - windupEnd))
      p.avatar.rightArm.rotation.x = lerp(a.heavy ? -2.55 : -1.9, 0.65, k)
      p.avatar.rightArm.rotation.z = lerp(a.heavy ? -0.9 : -0.55, 1.05, k)
      p.avatar.leftArm.rotation.x = lerp(-0.7, 0.3, k)
      p.avatar.torso.rotation.y = lerp(-0.42, 0.5, k)
      p.avatar.torso.rotation.x = lerp(-0.12, 0.16, k)
    } else {
      const k = smooth((pr - swingEnd) / (1 - swingEnd))
      p.avatar.rightArm.rotation.x = lerp(0.65, 0, k)
      p.avatar.rightArm.rotation.z = lerp(1.05, -0.12, k)
      p.avatar.leftArm.rotation.x = lerp(0.3, 0, k)
      p.avatar.torso.rotation.y = lerp(0.5, 0, k)
    }
    p.avatar.rightFore.rotation.x = -0.25 * Math.sin(pr * Math.PI)
    p.avatar.leftFore.rotation.x = -0.12 * Math.sin(pr * Math.PI)
  } else {
    p.avatar.rightFore.rotation.x = -0.08
    p.avatar.leftFore.rotation.x = -0.08
  }

  if (p.roll) {
    const pr = clamp(p.roll.t / p.roll.duration, 0, 1)
    p.avatar.rig.rotation.x = -Math.sin(pr * Math.PI) * 0.72
    p.avatar.rig.position.y = -Math.sin(pr * Math.PI) * 0.22
    p.avatar.leftLeg.rotation.x = -1.1 * Math.sin(pr * Math.PI)
    p.avatar.rightLeg.rotation.x = -1.1 * Math.sin(pr * Math.PI)
    p.avatar.leftArm.rotation.x = 0.8 * Math.sin(pr * Math.PI)
    p.avatar.rightArm.rotation.x = 0.8 * Math.sin(pr * Math.PI)
  }

  if (p.hurtT > 0) {
    p.avatar.rig.rotation.z = Math.sin(p.hurtT * 50) * 0.045
  }

  p.avatar.lanternLight.intensity = 0.78 + Math.sin(t * 11.3) * 0.09 + Math.sin(t * 19.7) * 0.04
  const swordPulse = p.upgrades.blade ? 0.28 + Math.sin(t * 2.6) * 0.09 : 0
  p.avatar.swordGlow.material.opacity = swordPulse
  p.avatar.eyeGlow.material.opacity = 0.24 + Math.sin(t * 2.2) * 0.08
}

function setEnemyFlash(e, amount) {
  for (const m of e.flashMats) {
    if (!m.emissive) continue
    m.emissive.setHex(0x6b0d0d)
    m.emissiveIntensity = amount > 0 ? (amount / 0.14) * 1.9 : 0
  }
}

function updateEnemy(e, dt) {
  if (e.dead) {
    e.deathT += dt
    e.rig.rig.rotation.z = Math.min(1.5, e.deathT * 3.2)
    e.group.position.y -= dt * 0.36
    e.rig.bar.group.visible = false
    return
  }

  e.flash = Math.max(0, e.flash - dt)
  setEnemyFlash(e.rig, e.flash)
  e.stagger = Math.max(0, e.stagger - dt)
  e.attackCd = Math.max(0, e.attackCd - dt)
  e.anim += dt * (e.moving ? e.speed * 3.2 : 1.6)

  const dx = player.group.position.x - e.group.position.x
  const dz = player.group.position.z - e.group.position.z
  const dist = Math.hypot(dx, dz) || 0.001
  const dirX = dx / dist
  const dirZ = dz / dist
  const targetFacing = Math.atan2(dirX, dirZ)
  e.facing = angleDamp(e.facing, targetFacing, 6.5, dt)
  e.group.rotation.y = e.facing
  e.moving = false

  if (e.type === 'wisp') {
    e.group.position.y = 0.34 + Math.sin(e.anim * 1.4) * 0.14
    e.shootCd = Math.max(0, e.shootCd - dt)
    if (e.attackState === 'windup') {
      e.attackTimer -= dt
      e.glow.material.opacity = 0.5 + (1 - e.attackTimer / e.windup) * 0.5
      if (e.attackTimer <= 0) {
        const origin = e.group.position.clone().setY(1.35)
        const target = player.group.position.clone().setY(1.05)
        spawnProjectile(origin, target, e.damage)
        spawnSparks(origin, 0x78d8ff, 10, 2.4, 0.05)
        audio.tone(480, 0.2, 'sine', 0.025, 0, 280)
        e.attackState = 'recover'
        e.attackTimer = 0.7
        e.shootCd = e.cooldown
        e.glow.material.opacity = 0.4
      }
    } else if (e.attackState === 'recover') {
      e.attackTimer -= dt
      if (e.attackTimer <= 0) e.attackState = null
    } else {
      let mx = 0
      let mz = 0
      if (dist < 6.5) {
        mx = -dirX
        mz = -dirZ
      } else if (dist > 11) {
        mx = dirX
        mz = dirZ
      } else {
        mx = -dirZ * Math.sin(e.anim * 0.7)
        mz = dirX * Math.sin(e.anim * 0.7)
      }
      if (e.stagger <= 0) {
        e.group.position.x += mx * e.speed * dt
        e.group.position.z += mz * e.speed * dt
        e.moving = Math.abs(mx) + Math.abs(mz) > 0.1
      }
      if (e.shootCd <= 0 && dist < 15 && dist > 2.3 && e.attackState === null) {
        e.attackState = 'windup'
        e.attackTimer = e.windup
      }
    }
  } else {
    if (e.attackState === 'windup') {
      e.attackTimer -= dt
      const pr = 1 - e.attackTimer / e.windup
      e.telegraph.material.opacity = 0.16 + pr * 0.48
      e.telegraph.scale.setScalar(1 + pr * (e.type === 'brute' ? 1.3 : 0.5))
      if (e.attackTimer <= 0) {
        const hitRange = e.type === 'brute' ? 3.2 : 2.15
        if (dist < hitRange) damagePlayer(e.damage, e.group.position)
        spawnRing(e.group.position.clone().setY(0.05), e.type === 'brute' ? 0xff5d3f : 0xff7660, 0.35, e.type === 'brute' ? 3.5 : 2.3, 0.42, 0.45)
        if (e.type === 'brute') {
          spawnSparks(e.group.position.clone().setY(0.8), 0xff7a45, 18, 4, 0.06)
          screenShake(0.22)
        }
        audio.swing(e.type === 'brute')
        e.attackState = 'recover'
        e.attackTimer = e.type === 'brute' ? 0.65 : 0.4
        e.telegraph.material.opacity = 0
        e.attackCd = e.cooldown
      }
    } else if (e.attackState === 'recover') {
      e.attackTimer -= dt
      if (e.attackTimer <= 0) e.attackState = null
    } else if (dist < 26) {
      if (dist > e.range * 0.82 && e.stagger <= 0) {
        let mx = dirX
        let mz = dirZ
        for (const other of GAME.enemies) {
          if (other === e || other.dead) continue
          const odx = e.group.position.x - other.group.position.x
          const odz = e.group.position.z - other.group.position.z
          const od = Math.hypot(odx, odz)
          if (od > 0.001 && od < (e.radius + other.radius) * 1.55) {
            mx += (odx / od) * 0.8
            mz += (odz / od) * 0.8
          }
        }
        const ml = Math.hypot(mx, mz) || 1
        moveWithCollisions(e.group.position, (mx / ml) * e.speed * dt, (mz / ml) * e.speed * dt, e.radius)
        e.moving = true
      }
      if (dist <= e.range + 0.45 && e.attackCd <= 0 && e.stagger <= 0) {
        e.attackState = 'windup'
        e.attackTimer = e.windup
        e.telegraph.material.opacity = 0.2
        e.telegraph.scale.setScalar(1)
      }
    }
  }

  // Animation
  const rig = e.rig
  if (e.type === 'wisp') {
    rig.rig.rotation.z = Math.sin(e.anim * 1.1) * 0.05
    rig.leftArm.rotation.z = 0.25 + Math.sin(e.anim * 2) * 0.1
    rig.rightArm.rotation.z = -0.25 - Math.sin(e.anim * 2) * 0.1
    if (e.attackState === 'windup') {
      rig.rightArm.rotation.x = -1.4
      rig.leftArm.rotation.x = -1.2
    } else {
      rig.rightArm.rotation.x = -0.1
      rig.leftArm.rotation.x = -0.1
    }
  } else {
    const swing = e.moving ? Math.sin(e.anim) * (e.type === 'brute' ? 0.35 : 0.48) : Math.sin(e.anim * 0.7) * 0.03
    rig.leftLeg.rotation.x = swing
    rig.rightLeg.rotation.x = -swing
    rig.leftArm.rotation.x = -swing * 0.65
    rig.rightArm.rotation.x = swing * 0.45
    rig.leftArm.rotation.z = 0.14
    rig.rightArm.rotation.z = -0.14
    rig.body.rotation.x = 0.08 + Math.sin(e.anim * 2) * 0.012
    if (e.attackState === 'windup') {
      const pr = 1 - e.attackTimer / e.windup
      rig.rightArm.rotation.x = lerp(0, e.type === 'brute' ? -2.6 : -2.0, smooth(pr))
      rig.rightArm.rotation.z = lerp(-0.14, -0.55, smooth(pr))
      rig.leftArm.rotation.x = lerp(0, -0.7, smooth(pr))
    } else if (e.attackState === 'recover') {
      rig.rightArm.rotation.x = 0.5
      rig.leftArm.rotation.x = 0.2
    }
  }
  rig.cloak.rotation.x = 0.1 + (e.moving ? 0.14 : 0) + Math.sin(e.anim * 1.7) * 0.02

  // Health bar
  const ratio = clamp(e.hp / e.maxHp, 0, 1)
  e.rig.bar.fill.scale.x = ratio
  e.rig.bar.fill.position.x = -(1 - ratio) * 0.51
  e.rig.bar.glint.scale.x = ratio
  e.rig.bar.glint.position.x = -(1 - ratio) * 0.51
  e.rig.bar.group.position.set(e.group.position.x, e.barY + e.group.position.y, e.group.position.z)
  e.rig.bar.group.quaternion.copy(camera.quaternion)
  e.rig.bar.group.scale.setScalar(clamp(1 - dist * 0.012, 0.65, 1))
  e.rig.bar.group.visible = dist < 19 && (e.hp < e.maxHp || dist < 10)
}

function updateEnemies(dt) {
  for (let i = GAME.enemies.length - 1; i >= 0; i--) {
    const e = GAME.enemies[i]
    updateEnemy(e, dt)
    if (e.dead && e.deathT > 1.7) {
      removeEntity(e.rig)
      GAME.enemies.splice(i, 1)
    }
  }
}

function updateBoss(dt) {
  const b = GAME.boss
  if (!b) return
  b.anim += dt * (b.state === 'chase' ? 3.2 : 1.4)
  b.flash = Math.max(0, b.flash - dt)
  setEnemyFlash(b.rig, b.flash)

  if (b.dead) {
    b.deathT += dt
    b.group.rotation.z = Math.min(1.25, b.deathT * 1.8)
    b.group.position.y = Math.max(-1.8, -b.deathT * 0.8)
    b.rig.bar.group.visible = false
    b.aura.material.opacity = Math.max(0, b.aura.material.opacity - dt * 0.5)
    return
  }

  if (b.state === 'rising') {
    b.rise += dt
    b.timer -= dt
    const p = clamp(b.rise / 2, 0, 1)
    b.group.position.y = lerp(-3.4, 0, easeOut(p))
    b.aura.material.opacity = 0.1 + p * 0.15
    b.aura.rotation.z += dt * 0.5
    if (b.timer <= 0) {
      b.state = 'chase'
      b.group.position.y = 0
      spawnRing(b.group.position.clone().setY(0.08), 0xa32930, 0.5, 7.5, 0.9, 0.45)
      screenShake(0.28)
    }
    return
  }

  const dx = player.group.position.x - b.group.position.x
  const dz = player.group.position.z - b.group.position.z
  const dist = Math.hypot(dx, dz) || 0.001
  const dirX = dx / dist
  const dirZ = dz / dist
  b.targetFacing = Math.atan2(dirX, dirZ)
  b.facing = angleDamp(b.facing, b.targetFacing, 4.2, dt)
  b.group.rotation.y = b.facing

  b.attackCd = Math.max(0, b.attackCd - dt)
  b.chargeCd = Math.max(0, b.chargeCd - dt)

  if (!b.summoned1 && b.hp / b.maxHp < 0.67 && b.state === 'chase') {
    b.summoned1 = true
    b.state = 'summon'
    b.timer = 1.5
    audio.bossRoar()
    screenShake(0.3)
    showToast('i-skull', 'The Warden calls the hollow', true)
  }
  if (!b.summoned2 && b.hp / b.maxHp < 0.33 && b.state === 'chase') {
    b.summoned2 = true
    b.state = 'summon'
    b.timer = 1.3
    audio.bossRoar()
    screenShake(0.4)
    showToast('i-skull', 'The Hollow Crown burns bright', true)
  }
  if (!b.enraged && b.hp / b.maxHp < 0.3) {
    b.enraged = true
    b.speed *= 1.28
    b.eyeMat.color.setHex(0xff1b12)
    b.aura.material.color.setHex(0xff1f16)
    b.aura.material.opacity = 0.35
    b.light.color.setHex(0xff1f16)
    b.light.intensity = 2.4
    showToast('i-ember', '<b>THE WARDEN ENRAGES</b>', true)
  }

  if (b.state === 'chase') {
    if (dist > 4.6) {
      moveWithCollisions(b.group.position, dirX * b.speed * dt, dirZ * b.speed * dt, b.radius)
    }
    if (dist <= 5.2 && b.attackCd <= 0) {
      b.state = 'windup-slam'
      b.timer = 1.0
      b.attackCd = 2.3
      b.telegraph.material.opacity = 0.2
      b.telegraph.scale.setScalar(1)
    } else if (dist > 8 && b.chargeCd <= 0) {
      b.state = 'windup-charge'
      b.timer = 0.72
      b.chargeCd = 6.5
    }
  } else if (b.state === 'windup-slam') {
    b.timer -= dt
    const pr = 1 - b.timer / 1.0
    b.telegraph.material.opacity = 0.2 + pr * 0.5
    b.telegraph.scale.setScalar(1 + pr * 1.4)
    if (b.timer <= 0) {
      b.state = 'recover'
      b.timer = 1.0
      b.telegraph.material.opacity = 0
      spawnRing(b.group.position.clone().setY(0.06), 0xff3d35, 0.4, 7.5, 0.75, 0.6)
      spawnRing(b.group.position.clone().setY(0.08), 0xffd782, 0.2, 5.2, 0.55, 0.35)
      spawnSparks(b.group.position.clone().setY(0.4), 0xff7045, 32, 6, 0.08)
      if (dist < 5.6) damagePlayer(b.damage, b.group.position)
      screenShake(0.5)
      audio.hit(true)
    }
  } else if (b.state === 'windup-charge') {
    b.timer -= dt
    if (b.timer <= 0) {
      b.state = 'charge'
      b.timer = 0.68
      b.didHit = false
      b.chargeDir.set(dirX, 0, dirZ)
      spawnSparks(b.group.position.clone().setY(0.3), 0xff3d35, 18, 4, 0.07)
      audio.bossRoar()
    }
  } else if (b.state === 'charge') {
    b.timer -= dt
    moveWithCollisions(b.group.position, b.chargeDir.x * 14.5 * dt, b.chargeDir.z * 14.5 * dt, b.radius)
    if (Math.random() < dt * 30) spawnMist(b.group.position.clone().setY(0.4), 0x9b3535, 1.5, 0.45)
    if (!b.didHit && dist < 2.4) {
      b.didHit = true
      damagePlayer(b.damage * 0.9, b.group.position)
      screenShake(0.45)
    }
    if (b.timer <= 0) {
      b.state = 'recover'
      b.timer = 1.1
      screenShake(0.2)
    }
  } else if (b.state === 'summon') {
    b.timer -= dt
    b.telegraph.material.opacity = 0.25 + Math.sin(b.anim * 4) * 0.1
    b.telegraph.scale.setScalar(1.8)
    if (b.timer <= 0) {
      b.telegraph.material.opacity = 0
      spawnBossAdds(b.hp / b.maxHp < 0.34 ? 3 : 2)
      b.state = 'recover'
      b.timer = 0.8
    }
  } else if (b.state === 'recover') {
    b.timer -= dt
    if (b.timer <= 0) b.state = 'chase'
  }

  // Boss animation
  const rig = b.rig
  const swing = Math.sin(b.anim) * 0.32
  rig.leftLeg.rotation.x = swing
  rig.rightLeg.rotation.x = -swing
  rig.leftArm.rotation.x = -swing * 0.4
  rig.rightArm.rotation.x = swing * 0.4
  rig.leftArm.rotation.z = 0.18
  rig.rightArm.rotation.z = -0.18
  rig.torso.rotation.x = 0.04 + Math.sin(b.anim * 1.8) * 0.012
  if (b.state === 'windup-slam') {
    const pr = 1 - b.timer
    rig.rightArm.rotation.x = lerp(0, -2.6, smooth(clamp(pr, 0, 1)))
    rig.leftArm.rotation.x = lerp(0, -2.4, smooth(clamp(pr, 0, 1)))
    rig.torso.rotation.x = lerp(0.04, -0.22, smooth(clamp(pr, 0, 1)))
  } else if (b.state === 'windup-charge') {
    rig.torso.rotation.x = 0.3
    rig.rightArm.rotation.x = -0.7
    rig.leftArm.rotation.x = -0.5
  } else if (b.state === 'charge') {
    rig.torso.rotation.x = 0.42
    rig.rightArm.rotation.x = 0.9
    rig.leftArm.rotation.x = 0.7
  } else if (b.state === 'summon') {
    rig.leftArm.rotation.x = -1.8
    rig.rightArm.rotation.x = -1.8
    rig.leftArm.rotation.z = 0.8
    rig.rightArm.rotation.z = -0.8
  } else if (b.state === 'recover') {
    rig.rightArm.rotation.x = 0.55
    rig.leftArm.rotation.x = 0.3
  }

  b.axeGlow.material.opacity = 0.15 + Math.sin(b.anim * 2) * 0.06 + (b.enraged ? 0.16 : 0)
  b.aura.rotation.z += dt * 0.4
  b.aura.material.opacity = 0.12 + Math.sin(b.anim * 1.7) * 0.045 + (b.enraged ? 0.08 : 0)
  b.light.intensity = (b.enraged ? 2.2 : 1.35) + Math.sin(b.anim * 5.5) * 0.25
  b.rig.bar.group.visible = false
}

function updateProjectiles(dt) {
  for (let i = GAME.projectiles.length - 1; i >= 0; i--) {
    const p = GAME.projectiles[i]
    p.life += dt
    p.group.position.addScaledVector(p.vel, dt)
    p.group.rotation.x += dt * 5
    p.group.rotation.y += dt * 7
    if (Math.random() < dt * 30) {
      spawnSparks(p.group.position.clone(), 0x78d8ff, 1, 0.3, 0.04)
    }
    const dist = p.group.position.distanceTo(player.group.position.clone().setY(p.group.position.y))
    const dx = p.group.position.x - player.group.position.x
    const dz = p.group.position.z - player.group.position.z
    if (Math.hypot(dx, dz) < 0.65 && Math.abs(p.group.position.y - (player.group.position.y + 1.05)) < 1.1) {
      damagePlayer(p.damage, p.group.position)
      spawnSparks(p.group.position.clone(), 0x78d8ff, 14, 3.2, 0.055)
      scene.remove(p.group)
      GAME.projectiles.splice(i, 1)
      continue
    }
    if (p.life > 4 || p.group.position.y < 0) {
      scene.remove(p.group)
      GAME.projectiles.splice(i, 1)
    }
  }
}

function updateLoot(dt) {
  for (let i = GAME.loot.length - 1; i >= 0; i--) {
    const orb = GAME.loot[i]
    if (orb.dead) {
      GAME.loot.splice(i, 1)
      continue
    }
    orb.age += dt
    if (!orb.settled) {
      orb.vel.y -= 11 * dt
      orb.group.position.addScaledVector(orb.vel, dt)
      if (orb.group.position.y <= orb.baseY) {
        orb.group.position.y = orb.baseY
        if (Math.abs(orb.vel.y) > 1.5) {
          orb.vel.y *= -0.35
          orb.vel.x *= 0.7
          orb.vel.z *= 0.7
        } else {
          orb.settled = true
        }
      }
    }
    const dx = player.group.position.x - orb.group.position.x
    const dz = player.group.position.z - orb.group.position.z
    const dist = Math.hypot(dx, dz)
    if (orb.settled) {
      orb.group.position.y = orb.baseY + Math.sin(orb.age * 2.6 + orb.phase) * 0.07
    }
    orb.core.rotation.x += dt * 2.2
    orb.core.rotation.y += dt * 3.1
    orb.ring.rotation.z += dt * 1.8
    orb.glow.material.opacity = 0.52 + Math.sin(orb.age * 3 + orb.phase) * 0.16

    if (dist < 1.25 && orb.age > 0.35) {
      collectOrb(orb)
      GAME.loot.splice(i, 1)
    }
  }
}

function updateInteractPrompt() {
  if (GAME.state !== 'playing') {
    ui.interact.classList.add('is-hidden')
    return
  }
  const target = getInteractable()
  GAME.lastInteract = target
  if (!target) {
    ui.interact.classList.add('is-hidden')
    return
  }
  ui.interact.classList.remove('is-hidden')
  ui.interactLabel.textContent = target.label
}

function getInteractable() {
  const p = player.group.position
  if (Math.hypot(p.x - world.shrine.group.position.x, p.z - world.shrine.group.position.z) < 2.7) {
    return { type: 'shrine', label: 'Commune with the shrine' }
  }
  for (const chest of world.chests) {
    if (!chest.opened && Math.hypot(p.x - chest.group.position.x, p.z - chest.group.position.z) < 2.5) {
      return { type: 'chest', chest, label: 'Open the reliquary' }
    }
  }
  let nearby = 0
  for (const orb of GAME.loot) {
    if (!orb.dead && Math.hypot(p.x - orb.group.position.x, p.z - orb.group.position.z) < 5.4) nearby++
  }
  if (nearby > 0) return { type: 'loot', label: `Gather ${nearby} offering${nearby > 1 ? 's' : ''}` }
  return null
}

function interact() {
  if (GAME.state !== 'playing') return
  const target = getInteractable()
  if (!target) return
  if (target.type === 'shrine') useShrine()
  else if (target.type === 'chest') openChest(target.chest)
  else if (target.type === 'loot') gatherNearby()
}

function useShrine() {
  if (GAME.state !== 'playing') return
  const healed = player.maxHp - player.hp
  player.hp = player.maxHp
  player.stamina = player.maxStamina
  player.flasks = player.maxFlasks
  player.invuln = Math.max(player.invuln, 0.8)
  spawnRing(world.shrine.group.position.clone().setY(0.08), 0x61c4b9, 0.5, 4.5, 0.9, 0.45)
  spawnSparks(world.shrine.group.position.clone().setY(1.4), 0x7be0d5, 22, 3.2, 0.06)
  audio.levelUp()
  showToast('i-flask', healed > 1 ? `<b>The shrine restores you</b> +${Math.round(healed)} vitality` : '<b>The shrine is silent</b> — you are already whole')
  updateHUD()
}

function openChest(chest) {
  if (chest.opened) return
  chest.opened = true
  chest.openT = 0
  const pos = chest.group.position.clone()
  spawnLoot('shard', 30, pos, true)
  spawnLoot('iron', 3, pos, true)
  spawnLoot('bone', 3, pos, true)
  spawnLoot('ember', 2, pos, true)
  spawnSparks(pos.clone().setY(0.7), 0x74e0d4, 22, 3.2, 0.06)
  spawnRing(pos.clone().setY(0.06), 0x74e0d4, 0.3, 3.4, 0.8, 0.45)
  audio.craft()
  showToast('i-key', '<b>Reliquary opened</b> — the dead were generous', true)
}

function updateCamera(dt) {
  if (GAME.state === 'title') {
    updateTitleCamera(dt)
    return
  }
  const target = new THREE.Vector3(
    player.group.position.x,
    player.group.position.y + 1.3,
    player.group.position.z
  )
  const horiz = Math.cos(cameraPitch) * cameraDistance
  const shoulder = 0.7
  const desired = new THREE.Vector3(
    target.x + Math.sin(cameraYaw) * horiz + Math.cos(cameraYaw) * shoulder,
    target.y + Math.sin(cameraPitch) * cameraDistance + 0.5,
    target.z + Math.cos(cameraYaw) * horiz - Math.sin(cameraYaw) * shoulder
  )
  const follow = 1 - Math.exp(-9 * dt)
  camera.position.lerp(desired, follow)
  if (camera.position.y < 0.55) camera.position.y = 0.55
  camera.lookAt(target.x, target.y + 0.12, target.z)

  if (GAME.shake > 0.001) {
    const s = GAME.shake
    camera.position.x += rnd(-s, s) * 0.24
    camera.position.y += rnd(-s, s) * 0.18
    camera.rotation.z += rnd(-s, s) * 0.035
    GAME.shake *= Math.exp(-7 * dt)
  } else {
    GAME.shake = 0
  }
}

function updateTitleCamera(dt) {
  GAME.titleTime += dt
  titleCameraAngle += dt * 0.032
  const r = 18.5
  const x = Math.cos(titleCameraAngle) * r
  const z = Math.sin(titleCameraAngle) * r + 5.5
  const desired = new THREE.Vector3(x, 6.2 + Math.sin(GAME.titleTime * 0.12) * 0.6, z)
  camera.position.lerp(desired, 1 - Math.exp(-1.5 * dt))
  camera.lookAt(0, 1.7, 0)
}

function updateMinimap() {
  const ctx = ui.minimap.getContext('2d')
  const w = ui.minimap.width
  const h = ui.minimap.height
  const cx = w / 2
  const cy = h / 2
  const mapR = w * 0.455
  const scale = mapR / 31
  ctx.clearRect(0, 0, w, h)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, mapR, 0, TAU)
  ctx.clip()
  const bg = ctx.createRadialGradient(cx, cy, 4, cx, cy, mapR)
  bg.addColorStop(0, 'rgba(26, 35, 34, 0.9)')
  bg.addColorStop(0.7, 'rgba(9, 14, 15, 0.92)')
  bg.addColorStop(1, 'rgba(3, 6, 7, 0.98)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(199,161,91,0.15)'
  ctx.lineWidth = 1
  for (const rr of [31, 20, 10, 6]) {
    ctx.beginPath()
    ctx.arc(cx, cy, rr * scale, 0, TAU)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(95, 180, 172, 0.22)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(cx, cy, 6 * scale, 0, TAU)
  ctx.stroke()

  // Path
  ctx.strokeStyle = 'rgba(199,161,91,0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy + 20 * scale)
  ctx.lineTo(cx, cy - 17 * scale)
  ctx.stroke()

  // Landmarks
  const drawDot = (x, z, color, radius = 2.5) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx + x * scale, cy + z * scale, radius, 0, TAU)
    ctx.fill()
  }
  drawDot(world.shrine.group.position.x, world.shrine.group.position.z, 'rgba(97,196,185,0.9)', 3.4)
  drawDot(0, -18.4, 'rgba(169,43,49,0.85)', 4.2)
  for (const chest of world.chests) {
    if (!chest.opened) drawDot(chest.group.position.x, chest.group.position.z, 'rgba(199,161,91,0.8)', 2.2)
  }
  for (const e of GAME.enemies) {
    if (e.dead) continue
    drawDot(e.group.position.x, e.group.position.z, e.type === 'wisp' ? 'rgba(110,210,255,0.9)' : e.type === 'brute' ? 'rgba(255,102,70,0.95)' : 'rgba(209,61,55,0.9)', e.type === 'brute' ? 3 : 2)
  }
  if (GAME.boss && !GAME.boss.dead) {
    drawDot(GAME.boss.group.position.x, GAME.boss.group.position.z, 'rgba(255,46,38,0.95)', 5.5)
  }

  // Player arrow
  ctx.save()
  ctx.translate(cx + player.group.position.x * scale, cy + player.group.position.z * scale)
  ctx.rotate(Math.PI - player.group.rotation.y)
  ctx.fillStyle = '#f2d48d'
  ctx.shadowColor = 'rgba(242,212,141,0.8)'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.moveTo(0, -5.5)
  ctx.lineTo(3.6, 4.2)
  ctx.lineTo(0, 2.4)
  ctx.lineTo(-3.6, 4.2)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Fog wash
  const fog = ctx.createRadialGradient(cx, cy, mapR * 0.55, cx, cy, mapR)
  fog.addColorStop(0, 'rgba(4,7,8,0)')
  fog.addColorStop(1, 'rgba(4,7,8,0.7)')
  ctx.fillStyle = fog
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  ctx.strokeStyle = 'rgba(199,161,91,0.42)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(cx, cy, mapR, 0, TAU)
  ctx.stroke()
}

function canCraft(recipe) {
  if (recipe.unique && player.upgrades[recipe.flag]) return false
  if (recipe.counter && player.upgrades[recipe.counter] >= recipe.limit) return false
  for (const [type, amount] of Object.entries(recipe.cost)) {
    if ((player.inventory[type] || 0) < amount) return false
  }
  return true
}

function renderSatchel() {
  ui.modalShards.textContent = String(player.inventory.shard)
  ui.heroLevel.textContent = `SOUL ${roman(player.level)}`
  ui.equipWeapon.textContent = player.equipment.weapon
  ui.equipWeaponStat.textContent = `+${player.damage} strike`
  ui.equipArmor.textContent = player.equipment.armor
  ui.equipArmorStat.textContent = `+${Math.max(0, player.maxHp - 120 - (player.level - 1) * 10)} max vitality`
  ui.equipCharm.textContent = player.equipment.charm
  ui.equipCharmStat.textContent = player.upgrades.charm ? '20% harm warded' : 'No ward'
  ui.statDamage.textContent = String(player.damage)
  ui.statVitality.textContent = String(player.maxHp)
  ui.statFlasks.textContent = String(player.maxFlasks)

  ui.materials.innerHTML = Object.entries(MATERIALS).map(([key, data]) => {
    const count = key === 'shard' ? player.inventory.shard : player.inventory[key] || 0
    return `
      <div class="material-card" data-mat="${key}" style="${count ? '' : 'opacity:.48'}">
        <div class="mat-icon"><svg><use href="#${data.icon}"></use></svg></div>
        <span class="mat-name">${data.name}</span>
        <b class="mat-count">${count}</b>
        <span class="mat-desc">${data.desc}</span>
      </div>
    `
  }).join('')

  ui.recipes.innerHTML = RECIPES.map((recipe) => {
    const done = recipe.unique && player.upgrades[recipe.flag]
    const maxed = recipe.counter && player.upgrades[recipe.counter] >= recipe.limit
    const affordable = canCraft(recipe)
    const cost = Object.entries(recipe.cost).map(([type, amount]) => {
      const has = (player.inventory[type] || 0) >= amount
      return `<span class="cost ${has ? '' : 'missing'}"><svg><use href="#${MATERIALS[type].icon}"></use></svg>${amount} ${MATERIALS[type].name}</span>`
    }).join('')
    let buttonText = 'FORGE'
    if (done) buttonText = 'FORGED'
    else if (maxed) buttonText = 'MASTERED'
    else if (!affordable) buttonText = 'NEED MORE'
    const countLabel = recipe.counter ? ` <small style="color:var(--ash);font-size:.72rem">(${player.upgrades[recipe.counter]}/${recipe.limit})</small>` : ''
    return `
      <article class="recipe-card ${done || maxed ? 'crafted' : ''}">
        <div class="recipe-icon"><svg><use href="#${recipe.icon}"></use></svg></div>
        <div class="recipe-body">
          <h3>${recipe.name}${countLabel}</h3>
          <p>${recipe.desc}</p>
          <div class="recipe-cost">${cost}</div>
          <button class="recipe-btn ${done || maxed ? 'done' : ''}" data-recipe="${recipe.id}" ${!affordable || done || maxed ? 'disabled' : ''}>${buttonText}</button>
        </div>
      </article>
    `
  }).join('')

  ui.boons.innerHTML = `
    <div class="boon ${player.upgrades.blade ? '' : 'locked'}"><span>EMBERFORGED</span><b>${player.upgrades.blade ? 'Blade awakened' : 'Blade still sleeps'}</b></div>
    <div class="boon ${player.upgrades.cuirass ? '' : 'locked'}"><span>BONEWEAVE</span><b>${player.upgrades.cuirass ? 'Bone and iron' : 'Bare leathers'}</b></div>
    <div class="boon ${player.upgrades.charm ? '' : 'locked'}"><span>GRAVEWARD</span><b>${player.upgrades.charm ? 'Harm warded' : 'No reliquary'}</b></div>
  `
}

function craftRecipe(id) {
  const recipe = RECIPES.find((r) => r.id === id)
  if (!recipe || !canCraft(recipe)) return
  for (const [type, amount] of Object.entries(recipe.cost)) player.inventory[type] -= amount
  recipe.apply()
  recalcStats(true)
  if (recipe.id === 'flask') player.flasks = player.maxFlasks
  if (recipe.id === 'cuirass') player.hp = Math.min(player.maxHp, player.hp + 40)
  audio.craft()
  showToast(recipe.icon, `<b>${recipe.name}</b> forged`, true)
  spawnRing(player.group.position.clone().setY(0.06), 0xffd782, 0.3, 2.6, 0.8, 0.45)
  spawnSparks(player.group.position.clone().setY(1.1), 0xffd782, 18, 2.8, 0.06)
  updateHUD()
  renderSatchel()
}

function openSatchel() {
  if (GAME.state === 'satchel') return
  if (GAME.state !== 'playing' && GAME.state !== 'paused') return
  GAME.satchelReturn = GAME.state === 'paused' ? 'paused' : 'playing'
  GAME.state = 'satchel'
  document.exitPointerLock?.()
  hideScreen(ui.pause)
  renderSatchel()
  showScreen(ui.satchel)
  audio.ui()
}

function closeSatchel() {
  if (GAME.state !== 'satchel') return
  hideScreen(ui.satchel)
  if (GAME.satchelReturn === 'paused') {
    GAME.state = 'paused'
    showScreen(ui.pause)
  } else {
    GAME.state = 'playing'
    if (!isTouch) requestPointerLock()
  }
}

function pauseGame() {
  if (GAME.state !== 'playing') return
  GAME.state = 'paused'
  document.exitPointerLock?.()
  showScreen(ui.pause)
  setSoundLabels()
}

function resumeGame() {
  if (GAME.state !== 'paused') return
  hideScreen(ui.pause)
  GAME.state = 'playing'
  if (!isTouch) requestPointerLock()
}

const keys = {}
const joystick = { x: 0, y: 0, active: false, id: null, cx: 0, cy: 0 }

function clearKeys() {
  for (const key of Object.keys(keys)) delete keys[key]
}

function onKeyDown(e) {
  if (['Tab', 'Space', 'KeyE', 'KeyQ', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault()
  }
  if (e.code === 'KeyM') {
    toggleSound()
    return
  }
  if (e.code === 'Tab' || e.code === 'KeyI') {
    e.preventDefault()
    if (GAME.state === 'satchel') closeSatchel()
    else if (GAME.state === 'playing' || GAME.state === 'paused') openSatchel()
    return
  }
  if (e.code === 'Escape') {
    if (GAME.state === 'satchel') closeSatchel()
    else if (GAME.state === 'paused') resumeGame()
    else if (GAME.state === 'playing') pauseGame()
    return
  }
  if (GAME.state === 'playing') {
    keys[e.code] = true
    if (e.code === 'Space') dodge()
    else if (e.code === 'KeyQ') useFlask()
    else if (e.code === 'KeyE') interact()
    else if (e.code === 'Enter') playerAttack(false)
  } else if (GAME.state === 'dead' && e.code === 'Enter') {
    respawnAtCheckpoint()
  } else if (GAME.state === 'victory' && e.code === 'Enter') {
    startRun()
  }
}

function onKeyUp(e) {
  delete keys[e.code]
}

function onMouseDown(e) {
  if (GAME.state !== 'playing') return
  if (!isTouch && document.pointerLockElement !== canvas) {
    requestPointerLock()
    return
  }
  if (e.button === 0) playerAttack(false)
  else if (e.button === 2) playerAttack(true)
}

function onMouseMove(e) {
  if (GAME.state !== 'playing') return
  if (document.pointerLockElement !== canvas) return
  cameraYaw -= e.movementX * 0.00215
  cameraPitch = clamp(cameraPitch + e.movementY * 0.0018, -0.24, 0.82)
}

function setupTouchControls() {
  const joy = ui.joystick
  const stick = ui.joystickStick
  const resetJoystick = () => {
    joystick.active = false
    joystick.id = null
    joystick.x = 0
    joystick.y = 0
    stick.style.transform = 'translate(0px, 0px)'
  }
  const updateJoystick = (clientX, clientY) => {
    const dx = clientX - joystick.cx
    const dy = clientY - joystick.cy
    const len = Math.hypot(dx, dy)
    const max = 42
    const k = len > max ? max / len : 1
    const ox = dx * k
    const oy = dy * k
    joystick.x = ox / max
    joystick.y = oy / max
    stick.style.transform = `translate(${ox}px, ${oy}px)`
  }
  joy.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    joystick.active = true
    joystick.id = e.pointerId
    const rect = joy.getBoundingClientRect()
    joystick.cx = rect.left + rect.width / 2
    joystick.cy = rect.top + rect.height / 2
    joy.setPointerCapture(e.pointerId)
    updateJoystick(e.clientX, e.clientY)
  })
  joy.addEventListener('pointermove', (e) => {
    if (!joystick.active || e.pointerId !== joystick.id) return
    e.preventDefault()
    updateJoystick(e.clientX, e.clientY)
  })
  joy.addEventListener('pointerup', resetJoystick)
  joy.addEventListener('pointercancel', resetJoystick)
  joy.addEventListener('pointerleave', (e) => {
    if (joystick.active && e.pointerId === joystick.id && !joy.hasPointerCapture?.(e.pointerId)) resetJoystick()
  })

  document.querySelectorAll('[data-touch]').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const action = btn.dataset.touch
      if (action === 'attack') playerAttack(false)
      else if (action === 'dodge') dodge()
      else if (action === 'flask') useFlask()
      else if (action === 'use') interact()
      else if (action === 'satchel') openSatchel()
    })
  })

  let look = null
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || GAME.state !== 'playing') return
    look = { id: e.pointerId, x: e.clientX, y: e.clientY }
    try { canvas.setPointerCapture(e.pointerId) } catch {}
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!look || look.id !== e.pointerId || GAME.state !== 'playing') return
    const dx = e.clientX - look.x
    const dy = e.clientY - look.y
    cameraYaw -= dx * 0.0065
    cameraPitch = clamp(cameraPitch + dy * 0.0045, -0.24, 0.82)
    look.x = e.clientX
    look.y = e.clientY
  })
  const endLook = (e) => {
    if (look && look.id === e.pointerId) look = null
  }
  canvas.addEventListener('pointerup', endLook)
  canvas.addEventListener('pointercancel', endLook)
}

function onResize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setSize(w, h)
  composer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function bindUI() {
  ui.startBtn.addEventListener('click', () => {
    audio.init()
    startRun()
  })
  ui.titleSoundBtn.addEventListener('click', toggleSound)
  ui.pauseSoundBtn.addEventListener('click', toggleSound)
  ui.resumeBtn.addEventListener('click', resumeGame)
  ui.satchelClose.addEventListener('click', closeSatchel)
  ui.pauseSatchelBtn.addEventListener('click', openSatchel)
  ui.abandonBtn.addEventListener('click', returnToTitle)
  ui.retryBtn.addEventListener('click', respawnAtCheckpoint)
  ui.deathTitleBtn.addEventListener('click', returnToTitle)
  ui.againBtn.addEventListener('click', startRun)
  ui.victoryTitleBtn.addEventListener('click', returnToTitle)

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      const target = tab.dataset.tab
      $('#tab-satchel').classList.toggle('is-hidden', target !== 'satchel')
      $('#tab-forge').classList.toggle('is-hidden', target !== 'forge')
      audio.ui()
    })
  })

  ui.recipes.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-recipe]')
    if (!btn) return
    craftRecipe(btn.dataset.recipe)
  })

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', () => {
    clearKeys()
    if (GAME.state === 'playing') pauseGame()
  })
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      pointerWasLocked = true
    } else {
      if (pointerWasLocked && GAME.state === 'playing') pauseGame()
      pointerWasLocked = false
    }
  })
  window.addEventListener('resize', onResize)
  setupTouchControls()
}

function loop(now) {
  requestAnimationFrame(loop)
  const rawDt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000))
  lastFrame = now
  let dt = rawDt
  if (GAME.hitStop > 0) {
    GAME.hitStop = Math.max(0, GAME.hitStop - rawDt)
    dt *= 0.14
  }
  if (GAME.slowmo > 0) {
    GAME.slowmo = Math.max(0, GAME.slowmo - rawDt)
    dt *= 0.3
  }

  if (GAME.state === 'playing') {
    GAME.runTime += rawDt
    world.update(dt)
    updatePlayer(dt)
    updateEnemies(dt)
    updateBoss(dt)
    updateProjectiles(dt)
    updateLoot(dt)
    updateWaves(dt)
    updateEffects(dt)
    updateInteractPrompt()
    updateHUD()
    updateCamera(rawDt)
    GAME.minimapTimer -= rawDt
    if (GAME.minimapTimer <= 0) {
      updateMinimap()
      GAME.minimapTimer = 0.1
    }
  } else if (GAME.state === 'title') {
    world.update(rawDt)
    player.animTime += rawDt
    animatePlayer(rawDt, false, false)
    updateEffects(rawDt * 0.4)
    updateTitleCamera(rawDt)
  } else if (GAME.state === 'paused' || GAME.state === 'satchel') {
    world.update(rawDt * 0.12)
  } else if (GAME.state === 'dead') {
    world.update(rawDt * 0.3)
    player.deathT += rawDt
    const p = clamp(player.deathT / 1.25, 0, 1)
    avatar.rig.rotation.z = p * 1.38
    avatar.rig.position.y = -p * 0.12
    updateEffects(rawDt * 0.5)
    updateCamera(rawDt)
  } else if (GAME.state === 'victory') {
    world.update(rawDt * 0.35)
    updateEffects(rawDt * 0.5)
    updateCamera(rawDt)
  }

  composer.render()
}

function finishLoading() {
  if (GAME.state !== 'loading') return
  GAME.state = 'title'
  resetProgression()
  player.group.position.set(0, 0, 16)
  player.group.rotation.set(0, Math.PI, 0)
  avatar.rig.rotation.set(0, 0, 0)
  avatar.rig.position.set(0, 0, 0)
  updateHUD()
  setSoundLabels()
  updateMinimap()
  ui.loading.classList.add('done')
  window.setTimeout(() => hideScreen(ui.loading), 900)
}

function init() {
  bindUI()
  onResize()
  updateMinimap()
  setSoundLabels()
  ui.hud.classList.add('is-hidden')
  ui.touch.classList.add('is-hidden')
  world.update(0)
  updateTitleCamera(0)
  requestAnimationFrame(loop)

  const boot = () => {
    window.setTimeout(finishLoading, 420)
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot)
  else boot()

  window.__gloamfall = {
    GAME,
    player,
    world,
    camera,
    startRun,
    respawnAtCheckpoint,
    returnToTitle,
    damagePlayer,
    spawnEnemy,
    startBoss,
    startWave,
    playerAttack,
  }
}

init()
