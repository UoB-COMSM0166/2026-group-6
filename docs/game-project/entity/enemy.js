const DEFAULT_SLIME_CONFIG = {
   type: 'slime',
   movement: {
      kind: 'ground',
      speed: GameConfig.Enemy.SPEED,
      chaseSpeed: GameConfig.Enemy.SPEED,
      jumpForce: GameConfig.Enemy.JUMPFORCE,
      chaseRange: 0,
      verticalAwareness: 0
   },
   combat: {
      attackCooldown: 20
   },
   animation: {
      frameWidth: 96,
      frameHeight: 96,
      frameDelay: 6,
      states: {
         WALK: {
            sheet: 'walk',
            row: 0,
            frames: 8,
            crop: { x: 38, y: 44, w: 19, h: 16 },
            draw: { w: 16, h: 16, anchor: 'ground', yOffset: 3 }
         },
         HURT: {
            sheet: 'hurt',
            row: 0,
            frames: 4,
            crop: { x: 33, y: 35, w: 23, h: 24 },
            draw: { w: 18, h: 19, anchor: 'ground', yOffset: 0.7 }
         },
         ATTACK: {
            sheet: 'attack',
            row: 0,
            frames: 8,
            crop: { x: 33, y: 44, w: 53, h: 45 },
            draw: { w: 40, h: 36, anchor: 'ground', yOffset: 0.85 }
         }
      }
   }
};

class Enemy extends Entity {
   constructor(x, y, w, h, spawnData, level) {
      super(x, y, w, h, spawnData);

      this.enemyType = this._resolveEnemyType(spawnData);
      this.enemyConfig = this._getEnemyConfig();
      this.type = GameConfig.Entity.Enemy;

      this.damage = spawnData.damage ?? 1;
      this.maxHp = spawnData.hp ?? 10;
      this.hp = this.maxHp;
      this.purified = false;

      this.dir = 1;
      this.speed = this.enemyConfig.movement.speed ?? GameConfig.Enemy.SPEED;
      this.chaseSpeed = this.enemyConfig.movement.chaseSpeed ?? this.speed;
      this.verticalSpeed = this.enemyConfig.movement.verticalSpeed ?? 0.2;
      this.chaseRange = this.enemyConfig.movement.chaseRange ?? 0;
      this.verticalAwareness = this.enemyConfig.movement.verticalAwareness ?? 32;
      this.hoverAmplitude = this.enemyConfig.movement.hoverAmplitude ?? 4;
      this.hoverSpeed = this.enemyConfig.movement.hoverSpeed ?? 0.05;
      this.attackCooldownFrames = this.enemyConfig.combat.attackCooldown ?? 20;

      this.vx = 0;
      this.vy = 0;
      this.accel = 0.02;
      this.friction = 0.85;
      this.knockback = false;
      this.grounded = false;
      this.jumpForce = -0.8 * (this.enemyConfig.movement.jumpForce ?? GameConfig.Enemy.JUMPFORCE);
      this.jumpTime = 0;

      this.animState = this.enemyConfig.movement.kind === 'flying' ? 'IDLE' : 'WALK';
      this.animFrame = 0;
      this.animTick = 0;

      this.attackTimer = 0;
      this.attackCooldown = 0;
      this.hurtTimer = 0;

      this.punchSound = resources.sounds.enemy.punch;
      this.purifySound = resources.sounds.purify;

      this.homeX = this.x;
      this.homeY = this.y;
      this.hoverSeed = random(TWO_PI);

      if (this.enemyConfig.movement.kind !== 'flying') {
         let safety = 100;
         while (
            level.isRectOverlappingTile(this.x, this.y, this.w, this.h, { solidOnly: true, margin: 0.1 })
            && safety > 0
         ) {
            this.y -= 1;
            safety--;
         }
      }
   }

   update(level, gm) {
      if (this.hp <= 0) {
         this.destroy();
         return;
      }

      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.attackTimer > 0) this.attackTimer--;
      if (this.hurtTimer > 0) this.hurtTimer--;

      if (this.enemyConfig.movement.kind === 'flying') {
         this._updateFlying(level, gm);
      } else {
         this._updateGround(level, gm);
      }

      this._updateAnimationState(gm?.player);
      this._tickAnim();
   }

   onPlayerContact(player, gm) {
      if (player.invulnerableTimer > 0) return;

      const dir = (player.x < this.x) ? -1 : 1;
      if (this.dir * dir < 0) this._turn();
      this._startAttack();

      player.takeDamage(this.damage, gm);
      player.knockTimer = GameConfig.Player.KnockInterval;
      player.repel(dir * 1.5, this.enemyConfig.movement.kind === 'flying' ? -1.5 : -2);
   }

   onRopeContact(rope, player, gm) {
      if (!player.checkRemainCleanEnergy(GameConfig.Player.AttackConsume)) return;

      if (!this.punchSound.isPlaying()) this.punchSound.play();
      const dir = (player.x < this.x) ? 1 : -1;
      this.repel(dir * 1.5, this.enemyConfig.movement.kind === 'flying' ? -0.5 : 0);
      this.takeDamage(player.attackDmg);
      player.reduceCleanEnergy(GameConfig.Player.AttackConsume);
      gm.addParticles(this.cx(), this.cy());

      if (rope.state !== "RETRACTING") rope.state = "RETRACTING";
   }

   takeDamage(n) {
      this.hp -= n;

      if (this.hp > 0 && this.enemyConfig.animation.states.HURT) {
         this.hurtTimer = this._getStateDuration('HURT');
         this.animFrame = 0;
         this.animTick = 0;
      }

      if (this.hp <= 0) {
         if (!this.purifySound.isPlaying()) this.purifySound.play();
         this.purified = true;
         this.destroy();
      }
   }

   get isDead() {
      return this.hp <= 0;
   }

   _updateGround(level, gm) {
      const player = gm?.player;
      const shouldChase = this._shouldChasePlayer(player);
      if (shouldChase) {
         this.dir = player.cx() < this.cx() ? -1 : 1;
      }

      this.vy += 0.1;
      const nextY = this.y + this.vy;
      this.grounded = false;

      const hitTileY = level.isRectOverlappingTile(this.x + 0.1, nextY, this.w - 0.2, this.h,
         { solidOnly: true, margin: 0 });
      if (hitTileY) {
         if (this.vy > 0) {
            this.y = hitTileY.y - this.h;
            this.grounded = true;
         } else if (this.vy < 0) {
            this.y = hitTileY.y + hitTileY.h;
         }
         this.vy = 0;
      } else {
         this.y += this.vy;
      }

      if (this.y > level.mapH) this.hp = 0;

      const moveSpeed = shouldChase ? this.chaseSpeed : this.speed;
      if (this.knockback) {
         this.vx *= this.friction;
         if (Math.abs(this.vx) < this.speed * 0.5) {
            this.knockback = false;
         }
      } else {
         const targetVx = moveSpeed * this.dir * 0.8;
         this.vx = this._approach(this.vx, targetVx, this.accel);
      }

      const nextX = this.x + this.vx;
      const hitWall = !!level.isRectOverlappingTile(nextX, this.y, this.w, this.h,
         { solidOnly: true, margin: 0.1 });

      const gridSize = GameConfig.World.GRID_SIZE;
      const moveDir = (this.vx >= 0) ? 1 : -1;
      const probeX = (moveDir === 1) ? (nextX + this.w + 0.1) : (nextX - 0.1);
      const feetRow = level.worldToGrid(0, this.y + this.h).row;
      const maxDropRow = level.worldToGrid(0, this.y + this.h + gridSize * GameConfig.Enemy.DROP_DEPTH_TILES).row;
      const probeCol = level.worldToGrid(probeX, 0).col;
      const safeToDrop = level.hasSolidInColumn(probeCol, feetRow - 1, maxDropRow - 1);
      const aboutToFall = !safeToDrop;

      if (hitWall) {
         this.vx = 0;
         if (this.grounded && !this.knockback) {
            this.vy = this.jumpForce;
            this.jumpTime += 1;
            this.grounded = false;
            if (this.jumpTime > 3) this._turn();
         } else if (this.vy > 2.0) {
            this._turn();
         }
      }
      else if (aboutToFall && this.grounded && !this.knockback) {
         this._turn();
      }
      else if (this._isCrossMap(level) && !this.knockback) {
         this._turn();
      }
      else {
         this.x = nextX;
      }
   }

   _updateFlying(level, gm) {
      const player = gm?.player;
      const shouldChase = this._shouldChasePlayer(player, this.chaseRange);
      const hoverOffset = sin(millis() * this.hoverSpeed + this.hoverSeed) * this.hoverAmplitude;

      let targetX = this.homeX + this.dir * 12;
      let targetY = this.homeY + hoverOffset;

      if (shouldChase) {
         targetX = player.cx() - this.w / 2;
         targetY = player.cy() - this.h / 2 + hoverOffset * 0.5;
         this.dir = targetX < this.x ? -1 : 1;
      } else if (this.x <= 8) {
         this.dir = 1;
      } else if (this.x + this.w >= level.mapW - 8) {
         this.dir = -1;
      }

      const targetVx = shouldChase ? this.speed * this.dir : this.speed * 0.55 * this.dir;
      const targetVy = this._clamp((targetY - this.y) * 0.08, -this.verticalSpeed, this.verticalSpeed);

      if (this.knockback) {
         this.vx *= this.friction;
         this.vy *= this.friction;
         if (Math.abs(this.vx) < this.speed * 0.4 && Math.abs(this.vy) < this.verticalSpeed * 0.6) {
            this.knockback = false;
         }
      } else {
         this.vx = this._approach(this.vx, targetVx, this.accel);
         this.vy = this._approach(this.vy, targetVy, this.accel);
      }

      let nextX = this.x + this.vx;
      let nextY = this.y + this.vy;

      const hitWallX = level.isRectOverlappingTile(nextX, this.y, this.w, this.h,
         { solidOnly: true, margin: 0.1 });
      if (hitWallX) {
         this.dir *= -1;
         this.vx *= -0.5;
      } else {
         this.x = this._clamp(nextX, 0, level.mapW - this.w);
      }

      const hitWallY = level.isRectOverlappingTile(this.x, nextY, this.w, this.h,
         { solidOnly: true, margin: 0.1 });
      if (hitWallY) {
         this.vy *= -0.35;
      } else {
         this.y = this._clamp(nextY, 0, level.mapH - this.h);
      }
   }

   _updateAnimationState(player) {
      const states = this.enemyConfig.animation.states;

      if (this.hurtTimer > 0 && states.HURT) {
         this._setAnimationState('HURT');
         return;
      }

      if (this.attackTimer > 0 && states.ATTACK) {
         this._setAnimationState('ATTACK');
         return;
      }

      if (this.enemyConfig.movement.kind === 'flying') {
         this._setAnimationState(this._shouldChasePlayer(player, this.chaseRange) ? 'FLY' : 'IDLE');
         return;
      }

      if (this.enemyType === 'cat' && this._shouldChasePlayer(player)) {
         this._setAnimationState(states.RUN ? 'RUN' : 'WALK');
         return;
      }

      this._setAnimationState('WALK');
   }

   _setAnimationState(state) {
      if (!this.enemyConfig.animation.states[state]) return;
      if (this.animState === state) return;
      this.animState = state;
      this.animFrame = 0;
      this.animTick = 0;
   }

   _startAttack() {
      if (this.attackCooldown > 0 || !this.enemyConfig.animation.states.ATTACK) return;
      this.attackTimer = this._getStateDuration('ATTACK');
      this.attackCooldown = this.attackCooldownFrames;
      this.animFrame = 0;
      this.animTick = 0;
   }

   _getStateDuration(state) {
      const stateConfig = this.enemyConfig.animation.states[state];
      if (!stateConfig) return 0;
      return (stateConfig.frames || 1) * (this.enemyConfig.animation.frameDelay || 1);
   }

   _shouldChasePlayer(player, chaseRange = this.chaseRange) {
      if (!player || chaseRange <= 0) return false;
      return Math.abs(player.cx() - this.cx()) <= chaseRange
         && Math.abs(player.cy() - this.cy()) <= (this.verticalAwareness || chaseRange);
   }

   _resolveEnemyType(spawnData) {
      const explicitType = spawnData?.enemyType || spawnData?.fields?.enemyType;
      if (typeof explicitType === 'string' && explicitType.trim()) {
         return explicitType.trim().toLowerCase();
      }

      const normalized = String(spawnData?.identifier || '').toLowerCase();
      if (normalized.includes('cat')) return 'cat';
      if (normalized.includes('bat')) return 'bat';
      return 'slime';
   }

   _getEnemyConfig() {
      if (this.enemyType === 'cat' && resources?.data?.enemyConfigs?.cat) {
         return resources.data.enemyConfigs.cat;
      }
      if (this.enemyType === 'bat' && resources?.data?.enemyConfigs?.bat) {
         return resources.data.enemyConfigs.bat;
      }
      return DEFAULT_SLIME_CONFIG;
   }

   _getSpriteSheets() {
      if (this.enemyType === 'cat') {
         return resources?.images?.enemy?.cat || {};
      }
      if (this.enemyType === 'bat') {
         return resources?.images?.enemy?.bat || {};
      }
      return resources?.images?.enemy?.slime || {};
   }

   _isCrossMap(level) {
      const nextX = this.x + this.vx;
      const margin = GameConfig.World.GRID_SIZE * 0.5;
      return ((this.vx < 0 && nextX < margin) ||
         (this.vx > 0 && nextX + this.w > level.mapW - margin));
   }

   _turn() {
      this.dir *= -1;
      this.jumpTime = 0;
      this.vx = this.speed * this.dir * 0.3;
   }

   repel(repelX, repelY) {
      this.vx += repelX;
      this.vy += repelY;
      this.knockback = true;
   }

   _tickAnim() {
      const stateConfig = this.enemyConfig.animation.states[this.animState];
      if (!stateConfig) return;

      this.animTick++;
      if (this.animTick % (this.enemyConfig.animation.frameDelay || 1) === 0) {
         this.animFrame = (this.animFrame + 1) % Math.max(1, stateConfig.frames || 1);
      }
   }

   _drawShape() {
      const sheets = this._getSpriteSheets();
      const stateConfig = this.enemyConfig.animation.states[this.animState];
      const sheet = sheets?.[stateConfig?.sheet];

      if (!sheet || !stateConfig) {
         fill(255, 0, 0);
         noStroke();
         rect(this.x, this.y, this.w, this.h);
         return;
      }

      const frameWidth = this.enemyConfig.animation.frameWidth;
      const frameHeight = this.enemyConfig.animation.frameHeight;
      const crop = stateConfig.crop || { x: 0, y: 0, w: frameWidth, h: frameHeight };
      const draw = stateConfig.draw || { w: this.w, h: this.h, anchor: 'ground', yOffset: 0 };

      const frameX = this.animFrame * frameWidth;
      const frameY = (stateConfig.row || 0) * frameHeight;
      const srcX = frameX + crop.x;
      const srcY = frameY + crop.y;
      const srcW = crop.w;
      const srcH = crop.h;

      const dw = draw.w || this.w;
      const dh = draw.h || this.h;
      const dx = this.x + (this.w - dw) / 2;
      const dy = draw.anchor === 'center'
         ? this.y + (this.h - dh) / 2 + (draw.yOffset || 0)
         : this.y + this.h - dh + (draw.yOffset || 0);

      const alpha = Math.round(255 * (this.hp + 0.7 * this.maxHp) / (1.7 * this.maxHp));
      push();
      tint(255, alpha);
      if (this.dir === -1) {
         translate(dx + dw, dy);
         scale(-1, 1);
         image(sheet, 0, 0, dw, dh, srcX, srcY, srcW, srcH);
      } else {
         image(sheet, dx, dy, dw, dh, srcX, srcY, srcW, srcH);
      }
      pop();
   }

   _approach(current, target, step) {
      if (Math.abs(current - target) <= step) return target;
      return current < target ? current + step : current - step;
   }

   _clamp(value, minValue, maxValue) {
      return Math.max(minValue, Math.min(maxValue, value));
   }
}
