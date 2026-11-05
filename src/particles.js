import * as THREE from 'three';

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

export class SparkSystem {
  constructor(scene, capacity = 420) {
    this.capacity = capacity;
    this.particles = [];
    const geometry = new THREE.OctahedronGeometry(0.045, 0);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    for (let i = 0; i < capacity; i += 1) {
      dummy.position.set(0, -999, 0);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.cursor = 0;
  }

  spawn({ position, velocity, color, life = 0.8, size = 1, gravity = -7, drag = 0.985, bounce = 0.3 }) {
    const index = this.cursor;
    this.cursor = (this.cursor + 1) % this.capacity;
    const particle = this.particles[index];
    const data = {
      x: position.x, y: position.y, z: position.z,
      vx: velocity.x, vy: velocity.y, vz: velocity.z,
      life, maxLife: life, size, gravity, drag, bounce,
      color: color instanceof THREE.Color ? color.clone() : new THREE.Color(color),
    };
    if (particle) Object.assign(particle, data);
    else this.particles[index] = data;
    this.mesh.setColorAt(index, data.color);
    this.mesh.instanceColor.needsUpdate = true;
  }

  burst(position, color, count = 12, { speed = 3, spread = 1, life = 0.8, size = 1, gravity = -7, up = 1.2 } = {}) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const power = speed * (0.35 + Math.random() * 0.8);
      this.spawn({
        position,
        velocity: {
          x: Math.cos(angle) * power * spread,
          y: up * (0.4 + Math.random() * 1.4),
          z: Math.sin(angle) * power * spread,
        },
        color,
        life: life * (0.55 + Math.random() * 0.65),
        size: size * (0.6 + Math.random() * 0.9),
        gravity,
      });
    }
  }

  update(dt) {
    const now = performance.now();
    const { capacity } = this;
    for (let i = 0; i < capacity; i += 1) {
      const p = this.particles[i];
      if (!p || p.life <= 0) {
        if (p && p.life > -999) {
          dummy.position.set(0, -999, 0);
          dummy.scale.setScalar(0.0001);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(i, dummy.matrix);
          p.life = -1000;
        }
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }
      p.vy += p.gravity * dt;
      const drag = Math.pow(p.drag, dt * 60);
      p.vx *= drag;
      p.vy *= drag;
      p.vz *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.02) {
        p.y = 0.02;
        p.vy = Math.abs(p.vy) * p.bounce;
        p.vx *= 0.68;
        p.vz *= 0.68;
        if (Math.abs(p.vy) < 0.12) p.vy = 0;
      }
      const ratio = Math.max(0, p.life / p.maxLife);
      const scale = p.size * (0.25 + ratio * 0.95);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(now * 0.001 + i, now * 0.0015 + i, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export class MoteField {
  constructor(scene, texture, count, { color = 0xffc68a, size = 0.075, opacity = 0.55, area = 27, height = 13 } = {}) {
    this.count = count;
    this.area = area;
    this.height = height;
    const positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);
    this.phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * area * 2;
      positions[i * 3 + 1] = Math.random() * height + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * area * 2;
      this.speeds[i] = 0.08 + Math.random() * 0.22;
      this.phases[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size,
      map: texture,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.material = material;
    this.positions = positions;
  }

  update(dt, time) {
    const pos = this.positions;
    for (let i = 0; i < this.count; i += 1) {
      const idx = i * 3;
      pos[idx + 1] += this.speeds[i] * dt;
      pos[idx] += Math.sin(time * 0.23 + this.phases[i]) * dt * 0.14;
      pos[idx + 2] += Math.cos(time * 0.19 + this.phases[i] * 1.3) * dt * 0.12;
      if (pos[idx + 1] > this.height) {
        pos[idx + 1] = 0.2;
        pos[idx] = (Math.random() - 0.5) * this.area * 2;
        pos[idx + 2] = (Math.random() - 0.5) * this.area * 2;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
  }
}

export function sparkColor(hex, boost = 1) {
  tmpColor.setHex(hex);
  tmpColor.multiplyScalar(boost);
  return tmpColor.clone();
}
