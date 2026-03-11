class StoryIntro {
   constructor(resources, onFinish) {
      this.resources = resources;
      this.onFinish = onFinish;

      this.slides = [
         {
            title: "The Collapse",
            lines: [
               "Years of pollution pushed the planet to collapse.",
               "Cities fell into ruin, and the ecosystem was destroyed.",
               "The world was no longer suitable for life."
            ]
         },
         {
            title: "Dormant Civilization",
            lines: [
               "Facing extinction, the planet's native civilization made a final decision.",
               "They entered deep dormancy, waiting for a chance for the world to recover."
            ]
         },
         {
            title: "The Mission",
            lines: [
               "To restore the dying planet, small purification robots were sent from another planet.",
               "Their mission was to cleanse the pollution and revive the ecosystem."
            ]
         },
         {
            title: "The Beginning",
            lines: [
               "The robot begins its journey.",
               "Using purification energy, it can cleanse pollution sources.",
               "But the ruined world still holds many unknown dangers."
            ]
         }
      ];

      this.currentSlide = 0;
      this.currentLine = 0;
      this.currentChar = 0;

      // speed
      this.charInterval = 26;
      this.linePause = 750;
      this.slidePause = 1300;

      this.lastCharTime = millis();
      this.linePauseStart = -1;
      this.slidePauseStart = -1;

      this.finished = false;

      // Skip
      this.skipBtn = {
         x: width - 110,
         y: 28,
         w: 78,
         h: 38
      };

      this.textBox = {
         x: 115,
         y: 548,
         w: 770,
         h: 96
      };

      this.boxStrokeColor = [0, 235, 220];
      this.boxGlowColor = [0, 235, 220];
      this.boxFillColor = [0, 0, 0, 125];

      //new: bgm
      this.bgmPlayed = false;
   }

   playStoryBgm() {
      // stop others(if add more in the future)
      this.resources.sounds.gameBgm?.stop();
      //
      const storyBgm = this.resources.sounds.story;
      if (storyBgm && !storyBgm.isPlaying()) {
         storyBgm.loop(false); // no loop playing
         storyBgm.setVolume(0.55); //volume change
         storyBgm.play();
      }
   }

   stopStoryBgm() {
      const storyBgm = this.resources.sounds.storyBgm;
      if (storyBgm && storyBgm.isPlaying()) {
         storyBgm.stop();
      }
   }

   update() {
      if (this.finished) return;

      let slide = this.slides[this.currentSlide];
      let lineText = slide.lines[this.currentLine];

      if (this.currentChar < lineText.length) {
         if (millis() - this.lastCharTime >= this.charInterval) {
            this.currentChar++;
            this.lastCharTime = millis();
         }
         return;
      }

      // stop
      if (this.linePauseStart < 0) {
         this.linePauseStart = millis();
         return;
      }

      // next
      if (
         millis() - this.linePauseStart >= this.linePause &&
         this.currentLine < slide.lines.length - 1
      ) {
         this.currentLine++;
         this.currentChar = 0;
         this.lastCharTime = millis();
         this.linePauseStart = -1;
         return;
      }

      if (
         this.currentLine === slide.lines.length - 1 &&
         this.currentChar >= lineText.length
      ) {
         if (this.slidePauseStart < 0) {
            this.slidePauseStart = millis();
            return;
         }

         if (millis() - this.slidePauseStart >= this.slidePause) {
            this.nextSlide();
         }
      }
   }

   nextSlide() {
      if (this.currentSlide >= this.slides.length - 1) {
         this.finish();
         return;
      }

      this.currentSlide++;
      this.currentLine = 0;
      this.currentChar = 0;
      this.lastCharTime = millis();
      this.linePauseStart = -1;
      this.slidePauseStart = -1;
   }

   finish() {
      this.finished = true;
      // new: bgm
      this.stopStoryBgm();
      if (typeof this.onFinish === "function") {
         this.onFinish();
      }
   }

   display() {
      background(0);
      //new: bgm
      if (!this.bgmPlayed && !this.finished) {
         this.playStoryBgm();
         this.bgmPlayed = true;
      }
      
      this.drawImage();
      this.drawImageOverlay();
      this.drawTextBox();
      this.drawCurrentLineText();
      this.drawSkipButton();
   }

   drawImage() {
      let img = this.resources.images.storyIntro[this.currentSlide];
      if (!img) return;

      image(img, 0, 0, width, height);
   }

   drawImageOverlay() {
      push();
      noStroke();
      fill(0, 0, 0, 28);
      rect(0, 0, width, height);
      pop();
   }

   drawTextBox() {
      let box = this.textBox;

      push();


      drawingContext.shadowBlur = 18;
      drawingContext.shadowColor = "rgba(0, 235, 220, 0.35)";


      noStroke();
      fill(
         this.boxFillColor[0],
         this.boxFillColor[1],
         this.boxFillColor[2],
         this.boxFillColor[3]
      );
      rect(box.x, box.y, box.w, box.h, 14);

      noFill();
      stroke(
         this.boxStrokeColor[0],
         this.boxStrokeColor[1],
         this.boxStrokeColor[2],
         220
      );
      strokeWeight(2.2);
      rect(box.x, box.y, box.w, box.h, 14);

      pop();
   }

   drawCurrentLineText() {
      let slide = this.slides[this.currentSlide];
      let fullLine = slide.lines[this.currentLine];
      let visibleText = fullLine.substring(0, this.currentChar);
      let box = this.textBox;

      push();
      fill(255);
      noStroke();
      textAlign(LEFT, TOP);
      textStyle(NORMAL);
      textSize(22);
      textLeading(24);

      text(
         visibleText,
         box.x + 24,
         box.y + 18,
         box.w - 48,
         box.h - 24
      );
      pop();
   }

   drawSkipButton() {
      let b = this.skipBtn;
      let hovering = this.isMouseInsideSkip();

      push();
      stroke(255, 220);
      strokeWeight(1.2);
      fill(hovering ? 255 : 240);
      rect(b.x, b.y, b.w, b.h, 8);

      noStroke();
      fill(25);
      textAlign(CENTER, CENTER);
      textStyle(NORMAL);
      textSize(16);
      text("Skip", b.x + b.w / 2, b.y + b.h / 2 + 1);
      pop();
   }

   handleMousePressed() {
      if (this.isMouseInsideSkip()) {
         this.finish();
         return true;
      }
      return false;
   }

   isMouseInsideSkip() {
      let b = this.skipBtn;
      return (
         mouseX >= b.x &&
         mouseX <= b.x + b.w &&
         mouseY >= b.y &&
         mouseY <= b.y + b.h
      );
   }
}