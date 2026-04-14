class Boss extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);

      // Overall scale factor for the Boss
      this.scaleSize = 0.5;

      // Calculate the real physical collision box based on the scale factor
      let realW = 42 * this.scaleSize;
      let realH = 48 * this.scaleSize;

      this.x = this.x + (this.w - realW) / 2;
      this.y = this.y + (this.h - realH);

      this.w = realW;
      this.h = realH;

      this.maxHp = 20;
      this.hp = this.maxHp;

      // State Machine
      this.state = "IDLE";
      this.stateTimer = 0;
      this.purified = false;

      this.floodHeight = 50;

      // Animation and orientation properties
      this.dir = -1; // -1: Left, 1: Right
      this.animFrame = 0;
      this.animTick = 0;
      this.hurtTimer = 0;

      // Vertical velocity
      this.vy = 0;

      // Sprite Configuration
      this.spriteCfg = {
         frameW: 64,       // Single frame width for most actions is 64
         frameH: 64,       // Single frame height for all actions is 64

         idleFrames: 7,
         moveFrames: 4,
         hurtFrames: 7,
         shootFrames: 17,  // Shoot: 17 frames (width automatically set to 128 in code)
         deathFrames: 12,

         frameDelay: 6,
      };
   }

   update(level, gm) {
      if (this.purified) return;

      this.stateTimer++;

      // 1. Intercept for death state
      if (this.state === "DEATH") {
         this._tickAnim();
         return;
      }

      // Use AABB (Axis-Aligned Bounding Box) rectangular collision detection
      let isColliding = (
         gm.player.x < this.x + this.w &&
         gm.player.x + gm.player.w > this.x &&
         gm.player.y < this.y + this.h &&
         gm.player.y + gm.player.h > this.y
      );

      // If colliding and the player is not currently in the invulnerability (flashing) state
      if (isColliding && gm.player.invulnerableTimer <= 0) {
         gm.player.takeDamage(2, gm); // Deduct 1 point from player health
         gm.player.knockTimer = GameConfig.Player.KnockInterval; // Trigger hit stun/invulnerability frame

         // Apply a physical knockback effect to the player
         gm.player.vy = -4; // Knock upwards
         // Determine if the player is to the left or right of the Boss to decide knockback direction
         gm.player.vx = (gm.player.cx() < this.cx()) ? -3 : 3;
      }

      // Apply gravity to the Boss
      this.vy += 0.2;
      let nextY = this.y + this.vy;

      // Check for solid tiles beneath or above
      let hitTileY = level.isRectOverlappingTile(this.x + 0.1, nextY, this.w - 0.2, this.h, { solidOnly: true, margin: 0 });

      if (hitTileY) {
         if (this.vy > 0) {
            // Landing, standing on top of a tile
            this.y = hitTileY.y - this.h;
         } else if (this.vy < 0) {
            // Hitting the ceiling
            this.y = hitTileY.y + hitTileY.h;
         }
         this.vy = 0; // Vertical velocity resets upon collision
      } else {
         // No collision, free falling
         this.y += this.vy;
      }

      // 2. Countdown for the hurt state
      if (this.hurtTimer > 0) this.hurtTimer--;

      // 3. Keep the Boss facing the player (except during FLOOD to lock orientation)
      if (this.state !== "FLOOD") {
         this.dir = (gm.player.cx() < this.cx()) ? -1 : 1;
      }
      this._tickAnim();

      // 4. State Machine transition logic
      switch (this.state) {
         case "IDLE":
            if (this.stateTimer > 100) {
               this._chooseNextAttack();
            }
            break;

         case "MOVE":
            if (this.stateTimer < 120) {
               let speed = 0.5;
               let nextX = this.x + this.dir * speed;

               // Predict if next step will hit a wall
               let hitWall = level.isRectOverlappingTile(nextX, this.y, this.w, this.h, { solidOnly: true, margin: 0.1 });

               if (!hitWall) {
                  this.x = nextX; // Path is clear, move horizontally
               } else {
                  // Jump upon hitting a wall
                  // If colliding with a wall and the Boss is currently on the ground
                  if (this.vy === 0) {
                     this.vy = -4.5; // Jump height
                  }
               }
            } else {
               this._enterState("IDLE");
            }
            break;

         case "SHOOT":
            // Fire bullets at frame 30, 60, and 90
            if (this.stateTimer === 30 || this.stateTimer === 60 || this.stateTimer === 90) {
               let targetX = gm.player.cx();
               let targetY = gm.player.cy();
               gm.entities.push(new ToxicBullet(this.cx(), this.y - 5, targetX, targetY));
            }

            if (this.stateTimer > 110) {
               this._enterState("IDLE");
            }
            break;

         case "FLOOD":
            if (this.stateTimer === 1) gm.player.setPrompt('ROOF!');
            // During the active flood period (frames 180-360)
            if (this.stateTimer > 180 && this.stateTimer < 360) {
               if (gm.player.y + gm.player.h > level.mapH - this.floodHeight) {
                  if (gm.player.invulnerableTimer <= 0) {
                     gm.player.takeDamage(1, gm);
                     gm.player.knockTimer = GameConfig.Player.KnockInterval;
                     gm.player.vy = -3;
                  }
               }
            }
            if (this.stateTimer > 420) {
               this._enterState("IDLE");
            }
            break;
      }
   }

   _chooseNextAttack() {
      let attacks = ["SHOOT", "FLOOD", "MOVE"];
      let next = attacks[Math.floor(Math.random() * attacks.length)];
      this._enterState(next);
   }

   _enterState(newState) {
      this.state = newState;
      this.stateTimer = 0;
      this.animFrame = 0;
      this.animTick = 0;
   }

   // Player attacks Boss with rope to reduce HP
   onRopeContact(rope, player, gm) {
      if (this.purified || this.state === "DEATH") return;
      if (!player.checkRemainCleanEnergy(GameConfig.Player.AttackConsume)) return;

      this.hp -= player.attackDmg;
      player.reduceCleanEnergy(GameConfig.Player.AttackConsume);
      gm.addParticles(this.cx(), this.cy(), 10);

      if (rope.state !== "RETRACTING") rope.state = "RETRACTING";

      if (this.hp <= 0) {
         this.hurtTimer = 0;
         this._enterState("DEATH");
      } else {
         this.hurtTimer = this.spriteCfg.hurtFrames * this.spriteCfg.frameDelay;
         this.animFrame = 0;
         this.animTick = 0;
      }
   }

   // Animation frame calculation
   _tickAnim() {
      const cfg = this.spriteCfg;
      this.animTick++;

      if (this.animTick % cfg.frameDelay === 0) {

         if (this.state === "DEATH") {
            if (this.animFrame < cfg.deathFrames - 1) {
               this.animFrame++;
            } else {
               this.purified = true;
               this.destroy();
            }
            return;
         }

         let maxFrames = cfg.idleFrames;
         if (this.hurtTimer > 0) {
            maxFrames = cfg.hurtFrames;
         } else {
            if (this.state === "SHOOT") maxFrames = cfg.shootFrames;
            if (this.state === "MOVE") maxFrames = cfg.moveFrames;
            // Use idle frames as default during FLOOD
         }

         this.animFrame = (this.animFrame + 1) % maxFrames;
      }
   }

   display(level) {
      if (this.purified) return;

      const bossImgs = resources?.images?.boss;

      // 1. Draw Boss Entity
      if (bossImgs) {
         let sheet = bossImgs.idle;

         if (this.state === "DEATH") {
            sheet = bossImgs.death;
         } else if (this.hurtTimer > 0) {
            sheet = bossImgs.hurt;
         } else {
            if (this.state === "SHOOT") sheet = bossImgs.shoot;
            if (this.state === "MOVE") sheet = bossImgs.move;
            if (this.state === "FLOOD") sheet = bossImgs.idle; // Use idle sheet during FLOOD
         }

         if (sheet && sheet.width > 0) {
            const cfg = this.spriteCfg;

            // Shoot action has venom, width per frame is 128; others are 64
            const currentFrameW = (this.state === "SHOOT") ? 128 : cfg.frameW;
            const currentFrameH = cfg.frameH;

            const cols = Math.floor(sheet.width / currentFrameW) || 1;
            const f = this.animFrame;

            const srcX = (f % cols) * currentFrameW;
            const srcY = Math.floor(f / cols) * currentFrameH;

            // Center the image relative to the collision box bottom, based on base width 64
            const baseW = 64;
            const dx = this.x + (this.w - baseW) / 2;
            const offsetY = 8;
            const dy = this.y + this.h - currentFrameH + offsetY;

            push();

            if (this.state === "FLOOD") {
               // tint(R, G, B, Alpha)
               // 255, 100, 100 is a soft dark red; 200 alpha for semi-transparency
               tint(255, 100, 100, 200);
            }

            if (this.dir === -1) {
               translate(dx + baseW, dy);
               scale(-1, 1);
               image(sheet, 0, 0, currentFrameW, currentFrameH, srcX, srcY, currentFrameW, currentFrameH);
            } else {
               image(sheet, dx, dy, currentFrameW, currentFrameH, srcX, srcY, currentFrameW, currentFrameH);
            }

            // Must clear tint effect after drawing, or it will affect other images!
            noTint();
            pop();
         }
      } else {
         // Fallback solution (if images aren't loaded)
         if (this.state === "FLOOD") fill(255, 100, 100, 200);
         else fill(150, 0, 150);
         rect(this.x, this.y, this.w, this.h);
      }

      // 2. Draw HP Bar
      if (this.state !== "DEATH") {
         fill(255, 0, 0);
         rect(this.x, this.y - 15, this.w * (this.hp / this.maxHp), 8);
      }
   }

   displayWater(level) {
      if (this.state !== "FLOOD") return; // Only draw during flood state

      let floodH = 0;
      let maxFlood = this.floodHeight;

      // Warning phase (first 120 frames): flashing line at the bottom
      if (this.stateTimer < 120 && level) {
         push();
         if (Math.floor(this.stateTimer / 10) % 2 === 0) {
            stroke(255, 0, 0, 200);
            strokeWeight(6);
            line(0, level.mapH - 3, level.mapW, level.mapH - 3);
         }
         pop();
      }
      // Rising phase (next 60 frames)
      else if (this.stateTimer >= 120 && this.stateTimer < 180) {
         floodH = ((this.stateTimer - 120) / 60) * maxFlood;
      }
      // Receding phase
      else if (this.stateTimer >= 360 && this.stateTimer <= 420) {
         floodH = ((420 - this.stateTimer) / 60) * maxFlood;
      }
      // Full flood phase
      else {
         floodH = maxFlood;
      }

      if (floodH > 0 && level) {
         push();
         // Use semi-transparent purple for toxic water
         fill(100, 0, 150, 180);
         noStroke();
         rect(0, level.mapH - floodH, level.mapW, floodH);

         // Top surface line of the water
         stroke(200, 50, 255);
         strokeWeight(3);
         line(0, level.mapH - floodH, level.mapW, level.mapH - floodH);
         pop();
      }
   }
}
