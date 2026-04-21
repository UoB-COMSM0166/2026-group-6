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
      this.faceRightByDefault = this.enemyConfig.render?.faceRightByDefault !== false;

      this.vx = 0;
      this.vy = 0;
      this.accel = 0.02;
      this.friction = 0.85;
      this.knockback = false;
      this.grounded = false;
      this.jumpForce = -0.8 * (this.enemyConfig.movement.jumpForce ?? GameConfig.Enemy.JUMPFORCE);
      this.jumpTime = 0;
      this.catDetectRangeX = this.enemyConfig.behavior?.detectRangeX ?? this.chaseRange;
      this.catDetectRangeY = this.enemyConfig.behavior?.detectRangeY ?? this.verticalAwareness;
      this.catDetectRadius = this.enemyConfig.behavior?.detectRadius ?? Math.max(this.catDetectRangeX, this.catDetectRangeY);
      this.catChaseMemoryFrames = this.enemyConfig.behavior?.chaseMemoryFrames ?? 18;
      this.catChaseMemory = 0;
      this.catAttackHoldFrames = this.enemyConfig.behavior?.catAttackHoldFrames ?? 16;
      this.catRunRange = this.enemyConfig.behavior?.runRange ?? 84;
      this.catAttackRange = this.enemyConfig.behavior?.attackRange ?? 28;
      this.catAttackRadius = this.enemyConfig.behavior?.attackRadius ?? this.catAttackRange;
      this.catRunSpeedScale = this.enemyConfig.behavior?.runSpeedScale ?? 1.0;
      this.catAttackMoveScale = this.enemyConfig.behavior?.attackMoveScale ?? 0.32;
      this.catStuckFramesThreshold = this.enemyConfig.behavior?.stuckFramesThreshold ?? 18;
      this.catStuckHopScale = this.enemyConfig.behavior?.stuckHopScale ?? 0.9;
      this.catStuckFrames = 0;
      this.catBehaviorState = this.enemyType === 'cat' ? 'IDLE' : null;
      this.knockbackScale = this.enemyConfig.behavior?.knockbackScale ?? 1.0;
      this.batDetectRangeX = this.enemyConfig.behavior?.detectRangeX ?? this.chaseRange;
      this.batDetectRangeY = this.enemyConfig.behavior?.detectRangeY ?? this.verticalAwareness;
      this.batDetectRadius = this.enemyConfig.behavior?.detectRadius ?? Math.max(this.batDetectRangeX, this.batDetectRangeY);
      this.batChaseMemoryFrames = this.enemyConfig.behavior?.chaseMemoryFrames ?? 20;
      this.batAttackRange = this.enemyConfig.behavior?.attackRange ?? 34;
      this.batAttackVerticalRange = this.enemyConfig.behavior?.attackVerticalRange ?? 24;
      this.batAttackRadius = this.enemyConfig.behavior?.attackRadius ?? this.batAttackRange;
      this.batAttackHoldFrames = this.enemyConfig.behavior?.attackHoldFrames ?? 12;
      this.batAttackSpeedScale = this.enemyConfig.behavior?.attackSpeedScale ?? 1.15;
      this.batAttackAccel = this.enemyConfig.behavior?.attackAccel ?? (this.accel * 3.5);
      this.batCruiseSpeedScale = this.enemyConfig.behavior?.cruiseSpeedScale ?? 0.7;
      this.batChaseSpeedScale = this.enemyConfig.behavior?.chaseSpeedScale ?? 1.35;
      this.batAccel = this.enemyConfig.behavior?.accel ?? (this.accel * 2.2);
      this.batVerticalAccel = this.enemyConfig.behavior?.verticalAccel ?? (this.accel * 1.8);
      this.batChaseMemory = 0;
      this.attackJustStarted = false;

      this.animState = this.enemyConfig.movement.kind === 'flying'
         ? 'IDLE'
         : (this.enemyConfig.animation.states.IDLE ? 'IDLE' : 'WALK');
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
      if (this.attackTimer <= 0) this.attackJustStarted = false;

      if (this.enemyConfig.movement.kind === 'flying') {
         this._updateFlying(level, gm);
      } else {
         this._updateGround(level, gm);
      }

      this._updateAnimationState(gm?.player);
      this._tickAnim();
   }

   onPlayerContact(player, gm) {
      const dir = (player.x < this.x) ? -1 : 1;
      if (this.dir * dir < 0) this._turn();
      this._startAttack();

      if (player.invulnerableTimer > 0) return;

      player.takeDamage(this.damage, gm);
      player.knockTimer = GameConfig.Player.KnockInterval;
      player.repel(dir * 1.5, this.enemyConfig.movement.kind === 'flying' ? -1.5 : -2);
   }

   onRopeContact(rope, player, gm) {
      if (!player.checkRemainCleanEnergy(GameConfig.Player.AttackConsume)) return;

      if (!this.punchSound.isPlaying()) this.punchSound.play();
      const dir = (player.x < this.x) ? 1 : -1;
      if (this.enemyType === 'bat' || this.enemyType === 'cat') {
         this.attackTimer = 0;
         this.attackJustStarted = false;
         this.attackCooldown = Math.max(this.attackCooldown, this.attackCooldownFrames);
         this.animState = this.enemyType === 'bat' ? 'FLY' : 'RUN';
         this.animFrame = 0;
         this.animTick = 0;
         if (this.enemyType === 'cat' && !this.grounded) {
            this.vx *= 0.35;
            this.vy = Math.min(this.vy, -0.4);
         }
      }
      const knockbackScale = this.knockbackScale;
      const knockbackY = this.enemyConfig.movement.kind === 'flying'
         ? -0.5 * knockbackScale
         : 0;
      this.repel(dir * 1.5 * knockbackScale, knockbackY);
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
      const isCat = this.enemyType === 'cat';
      const catState = isCat ? this._getCatBehaviorState(player) : null;
      const shouldChase = isCat ? catState !== 'IDLE' : this._shouldChasePlayer(player);
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
         let targetVx = moveSpeed * this.dir * 0.8;
         if (isCat) {
            if (catState === 'ATTACK') {
               if (this.attackTimer <= 0 && this.attackCooldown <= 0) this._startAttack();
               targetVx = this.attackTimer > 0
                  ? this.chaseSpeed * this.catAttackMoveScale * this.dir
                  : 0;
            } else if (catState === 'RUN') {
               targetVx = this.chaseSpeed * this.catRunSpeedScale * this.dir;
            } else {
               targetVx = 0;
            }
         }
         this.vx = this._approach(this.vx, targetVx, this.accel);
      }

      if (isCat) {
         const isTryingToAdvance = shouldChase && catState !== 'IDLE';
         if (isTryingToAdvance && this.grounded && !this.knockback && Math.abs(this.vx) < 0.04) {
            this.catStuckFrames++;
         } else {
            this.catStuckFrames = 0;
         }

         if (this.catStuckFrames >= this.catStuckFramesThreshold && this.grounded) {
            this.vy = this.jumpForce * this.catStuckHopScale;
            this.vx = this.chaseSpeed * 0.9 * this.dir;
            this.grounded = false;
            this.catStuckFrames = 0;
         }
      }

      const nextX = this.x + this.vx;
      const hitWall = !!level.isRectOverlappingTile(nextX, this.y, this.w, this.h,
         { solidOnly: true, margin: 0.1 });

      const gridSize = GameConfig.World.GRID_SIZE;
      const moveDir = Math.abs(this.vx) > 0.02 ? ((this.vx >= 0) ? 1 : -1) : this.dir;
      const probeX = (moveDir === 1) ? (nextX + this.w + 0.1) : (nextX - 0.1);
      const feetRow = level.worldToGrid(0, this.y + this.h).row;
      const maxDropRow = level.worldToGrid(0, this.y + this.h + gridSize * GameConfig.Enemy.DROP_DEPTH_TILES).row;
      const probeCol = level.worldToGrid(probeX, 0).col;
      const safeToDrop = level.hasSolidInColumn(probeCol, feetRow - 1, maxDropRow - 1);
      const aboutToFall = !safeToDrop;

      if (hitWall) {
         const steppedUp = this.grounded && !this.knockback && this._tryStepUp(level, nextX);
         if (steppedUp) {
            this.x = nextX;
            this.grounded = false;
            return;
         }

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
      const shouldChase = this._shouldBatChasePlayer(player);
      const hoverOffset = sin(millis() * this.hoverSpeed + this.hoverSeed) * this.hoverAmplitude;
      const horizontalDelta = player ? Math.abs(player.cx() - this.cx()) : Infinity;
      const verticalDelta = player ? Math.abs(player.cy() - this.cy()) : Infinity;
      const shouldAttack = !!player
         && this.attackTimer <= 0
         && this.attackCooldown <= 0
         && !this.knockback
         && this._isWithinBatRange(horizontalDelta, verticalDelta, this.batAttackRange, this.batAttackVerticalRange, this.batAttackRadius);

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

      if (shouldAttack) {
         this._startAttack();
      }

      const isAttacking = this.attackTimer > 0;
      const moveSpeedScale = isAttacking
         ? this.batAttackSpeedScale
         : (shouldChase ? this.batChaseSpeedScale : this.batCruiseSpeedScale);
      const targetVx = shouldChase
         ? this.speed * moveSpeedScale * this.dir
         : this.speed * moveSpeedScale * this.dir;
      const targetVy = this._clamp(
         (targetY - this.y) * (isAttacking ? 0.14 : 0.08),
         -this.verticalSpeed * moveSpeedScale,
         this.verticalSpeed * moveSpeedScale
      );

      if (this.knockback) {
         this.vx *= this.friction;
         this.vy *= this.friction;
         if (Math.abs(this.vx) < this.speed * 0.4 && Math.abs(this.vy) < this.verticalSpeed * 0.6) {
            this.knockback = false;
         }
      } else {
         const horizontalAccel = isAttacking ? this.batAttackAccel : this.batAccel;
         const verticalAccel = isAttacking ? Math.max(this.batVerticalAccel, this.batAttackAccel * 0.85) : this.batVerticalAccel;
         this.vx = this._approach(this.vx, targetVx, horizontalAccel);
         this.vy = this._approach(this.vy, targetVy, verticalAccel);
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
      const isCat = this.enemyType === 'cat';

      if (this.hurtTimer > 0 && states.HURT) {
         this._setAnimationState('HURT');
         return;
      }

      if (this.attackTimer > 0 && states.ATTACK) {
         this._setAnimationState('ATTACK');
         return;
      }

      if (this.enemyConfig.movement.kind === 'flying') {
         this._setAnimationState(this._shouldBatChasePlayer(player) ? 'FLY' : 'IDLE');
         return;
      }

      if (isCat) {
         if (this.catBehaviorState === 'ATTACK' && states.ATTACK) {
            this._setAnimationState('ATTACK');
            return;
         }

         if (this.catBehaviorState === 'RUN' && states.RUN) {
            this._setAnimationState('RUN');
            return;
         }

         if (states.IDLE) {
            this._setAnimationState('IDLE');
            return;
         }

         this._setAnimationState(states.IDLE ? 'IDLE' : 'WALK');
         return;
      }

      this._setAnimationState(states.IDLE ? 'IDLE' : 'WALK');
   }

   _setAnimationState(state) {
      if (!this.enemyConfig.animation.states[state]) return;
      if (this.animState === state) return;
      this.animState = state;
      this.animFrame = 0;
      this.animTick = 0;
   }

   _startAttack() {
      if ((this.attackCooldown > 0 && !this.attackJustStarted) || !this.enemyConfig.animation.states.ATTACK) return;
      const attackHoldFrames = this.enemyType === 'cat'
         ? this.catAttackHoldFrames
         : (this.enemyType === 'bat' ? this.batAttackHoldFrames : 0);
      this.attackTimer = this._getStateDuration('ATTACK') + attackHoldFrames;
      this.attackCooldown = this.attackCooldownFrames;
      this.animFrame = 0;
      this.animTick = 0;
      this.attackJustStarted = true;
      if (this.enemyType === 'cat') {
         this.vx = 0;
         this.catBehaviorState = 'ATTACK';
         this._setAnimationState('ATTACK');
      } else if (this.enemyType === 'bat') {
         this._setAnimationState('ATTACK');
      }
   }

   _getStateDuration(state) {
      const stateConfig = this.enemyConfig.animation.states[state];
      if (!stateConfig) return 0;
      return this._getFrameCount(stateConfig) * this._getStateFrameDelay(stateConfig);
   }

   _shouldChasePlayer(player, chaseRange = this.chaseRange) {
      if (!player || chaseRange <= 0) return false;
      return Math.abs(player.cx() - this.cx()) <= chaseRange
         && Math.abs(player.cy() - this.cy()) <= (this.verticalAwareness || chaseRange);
   }

   _shouldBatChasePlayer(player) {
      if (this.enemyType !== 'bat') {
         return this._shouldChasePlayer(player, this.chaseRange);
      }

      if (!player) {
         this.batChaseMemory = 0;
         return false;
      }

      const horizontalDelta = Math.abs(player.cx() - this.cx());
      const verticalDelta = Math.abs(player.cy() - this.cy());
      const detectRangeX = this.batDetectRangeX || this.chaseRange;
      const detectRangeY = this.batDetectRangeY || detectRangeX;
      const detectRadius = this.batDetectRadius || Math.max(detectRangeX, detectRangeY);
      if (detectRangeX <= 0 || detectRangeY <= 0) return false;

      const detected = this._isWithinBatRange(horizontalDelta, verticalDelta, detectRangeX, detectRangeY, detectRadius);
      if (detected) {
         this.batChaseMemory = this.batChaseMemoryFrames;
         return true;
      }

      if (this.batChaseMemory > 0) {
         this.batChaseMemory--;
         return true;
      }

      return false;
   }

   _isWithinBatRange(horizontalDelta, verticalDelta, rangeX, rangeY, radialRange) {
      const safeRangeX = Math.max(1, rangeX || radialRange || 1);
      const safeRangeY = Math.max(1, rangeY || radialRange || 1);
      const ellipseDistance = (horizontalDelta * horizontalDelta) / (safeRangeX * safeRangeX)
         + (verticalDelta * verticalDelta) / (safeRangeY * safeRangeY);
      if (ellipseDistance <= 1) {
         return true;
      }

      const safeRadius = Math.max(safeRangeX, safeRangeY, radialRange || 0);
      return Math.hypot(horizontalDelta, verticalDelta) <= safeRadius;
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

   _tryStepUp(level, nextX) {
      const maxStepHeight = Math.max(2, Math.floor(GameConfig.World.GRID_SIZE * 0.75));
      for (let step = 1; step <= maxStepHeight; step++) {
         const testY = this.y - step;
         const blocked = level.isRectOverlappingTile(
            nextX,
            testY,
            this.w,
            this.h,
            { solidOnly: true, margin: 0.1 }
         );
         if (blocked) continue;

         const support = level.isRectOverlappingTile(
            nextX,
            testY + 1,
            this.w,
            this.h,
            { solidOnly: true, margin: 0.1 }
         );
         if (!support) continue;

         this.y = testY;
         this.vy = 0;
         return true;
      }
      return false;
   }

   _getCatBehaviorState(player) {
      if (!player) {
         this.catChaseMemory = 0;
         this.catBehaviorState = 'IDLE';
         return this.catBehaviorState;
      }

      const verticalDelta = Math.abs(player.cy() - this.cy());
      const horizontalDelta = Math.abs(player.cx() - this.cx());
      const detected = this._isWithinBatRange(
         horizontalDelta,
         verticalDelta,
         this.catDetectRangeX,
         this.catDetectRangeY,
         this.catDetectRadius
      );

      if (detected) {
         this.catChaseMemory = this.catChaseMemoryFrames;
      } else if (this.catChaseMemory > 0) {
         this.catChaseMemory--;
      } else {
         this.catBehaviorState = 'IDLE';
         return this.catBehaviorState;
      }

      if (this._isWithinBatRange(
         horizontalDelta,
         verticalDelta,
         this.catAttackRange,
         this.verticalAwareness || this.catAttackRange,
         this.catAttackRadius
      )) {
         this.catBehaviorState = 'ATTACK';
      } else if (this._isWithinBatRange(
         horizontalDelta,
         verticalDelta,
         this.catRunRange,
         this.verticalAwareness || this.catRunRange,
         this.catRunRange
      )) {
         this.catBehaviorState = 'RUN';
      } else {
         this.catBehaviorState = this.catChaseMemory > 0 ? 'RUN' : 'IDLE';
      }

      return this.catBehaviorState;
   }

   repel(repelX, repelY) {
      this.vx += repelX;
      this.vy += repelY;
      this.knockback = true;
   }

   _tickAnim() {
      const stateConfig = this.enemyConfig.animation.states[this.animState];
      if (!stateConfig) return;
      const frameCount = this._getFrameCount(stateConfig);
      const frameDelay = this._getStateFrameDelay(stateConfig);

      this.animTick++;
      if (this.animTick % frameDelay === 0) {
         this.animFrame = (this.animFrame + 1) % frameCount;
      }
   }

   _getStateFrameDelay(stateConfig) {
      return stateConfig?.frameDelay || this.enemyConfig.animation.frameDelay || 1;
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
      const frameRect = stateConfig.frameRects?.[this.animFrame] || null;
      const crop = frameRect || stateConfig.crop || { x: 0, y: 0, w: frameWidth, h: frameHeight };
      const draw = stateConfig.draw || { w: this.w, h: this.h, anchor: 'ground', yOffset: 0 };

      const frameX = frameRect ? 0 : this.animFrame * frameWidth;
      const frameY = frameRect ? 0 : (stateConfig.row || 0) * frameHeight;
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

      const healthRatio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
      const fadeRatio = 1 - this._clamp(healthRatio, 0, 1);
      const tintBase = Math.round(255 - fadeRatio * 85);
      const alpha = Math.round(255 * (0.72 + healthRatio * 0.28));
      push();
      tint(255, tintBase, tintBase, alpha);
      const shouldFlip = this.faceRightByDefault ? this.dir === -1 : this.dir === 1;
      if (shouldFlip) {
         translate(dx + dw, dy);
         scale(-1, 1);
         image(sheet, 0, 0, dw, dh, srcX, srcY, srcW, srcH);
      } else {
         image(sheet, dx, dy, dw, dh, srcX, srcY, srcW, srcH);
      }
      pop();
   }

   _getFrameCount(stateConfig) {
      if (!stateConfig) return 1;
      if (Array.isArray(stateConfig.frameRects) && stateConfig.frameRects.length > 0) {
         return stateConfig.frameRects.length;
      }
      return Math.max(1, stateConfig.frames || 1);
   }

   _approach(current, target, step) {
      if (Math.abs(current - target) <= step) return target;
      return current < target ? current + step : current - step;
   }

   _clamp(value, minValue, maxValue) {
      return Math.max(minValue, Math.min(maxValue, value));
   }
}
