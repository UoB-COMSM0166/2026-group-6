const ENDING_DEFINITIONS = [
   { key: 'true', minProgress: 100, label: 'True Ending', audioKey: 'true' },
   { key: 'happy', minProgress: 95, label: 'Happy Ending', audioKey: 'happy' },
   { key: 'better', minProgress: 90, label: 'Better Ending', audioKey: 'better' },
   { key: 'normal', minProgress: 85, label: 'Normal Ending', audioKey: 'normal' },
   { key: 'sad', minProgress: 80, label: 'Sad Ending', audioKey: 'sad' },
   { key: 'bad', minProgress: 75, label: 'Bad Ending', audioKey: 'bad' }
];

function normalizeEndingProgress(progress = 0) {
   return Math.max(0, Math.min(100, Math.floor(progress)));
}

function getEndingSounds(resources) {
   return resources?.sounds?.endings || null;
}

function getEndingBackgroundImage(resources) {
   return resources?.images?.painting?.paintings?.[3]
      || resources?.images?.cover
      || resources?.images?.storyIntro?.[0]
      || null;
}

function getEndingImageGroup(resources, endingKey) {
   const groups = resources?.images?.endings;
   if (!groups) return [];

   if (endingKey === 'bad' || endingKey === 'sad') {
      return groups.bad || [];
   }

   if (endingKey === 'normal' || endingKey === 'better') {
      return groups.good || [];
   }

   if (endingKey === 'happy' || endingKey === 'true') {
      return groups.best || [];
   }

   return [];
}

function getEndingImageInterval(endingKey) {
   if (endingKey === 'bad' || endingKey === 'sad') return 3600;
   if (endingKey === 'normal' || endingKey === 'better') return 3000;
   if (endingKey === 'happy' || endingKey === 'true') return 2400;
   return 3000;
}

function drawImageCover(img, dx, dy, dw, dh) {
   if (!img) return;

   const imgRatio = img.width / img.height;
   const boxRatio = dw / dh;

   let sx = 0;
   let sy = 0;
   let sw = img.width;
   let sh = img.height;

   if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
   } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) / 2;
   }

   image(img, dx, dy, dw, dh, sx, sy, sw, sh);
}

function resolveEndingOutcome(progress = 0) {
   const normalizedProgress = normalizeEndingProgress(progress);
   const matchedEnding = ENDING_DEFINITIONS.find((ending) => normalizedProgress >= ending.minProgress)
      || ENDING_DEFINITIONS[ENDING_DEFINITIONS.length - 1];

   return {
      ...matchedEnding,
      progress: normalizedProgress
   };
}

function stopEndingAudio(resources) {
   const endings = getEndingSounds(resources);
   if (endings) {
      Object.values(endings).forEach((sound) => {
         if (sound?.isPlaying?.()) {
            sound.stop();
         }
      });
   }

   resources?.sounds?.begin?.stop?.();
}

function getEndingAudio(resources, endingKey) {
   const endings = getEndingSounds(resources);
   if (endingKey === 'true') {
      return resources?.sounds?.begin || endings?.happy || null;
   }

   if (!endings) return null;
   return endings[endingKey] || null;
}

function playEndingAudio(resources, endingOutcome) {
   if (!endingOutcome) return null;

   stopEndingAudio(resources);

   const targetAudio = getEndingAudio(resources, endingOutcome.audioKey || endingOutcome.key);
   if (!targetAudio) return null;

   targetAudio.setVolume?.(endingOutcome.key === 'true' ? 0.55 : targetAudio.getVolume?.() || 1);
   if (!targetAudio.isPlaying()) {
      targetAudio.play();
   }

   return targetAudio;
}

//Badend
function getBadEndingEnglish() {
   return [
      {
         title: 'The End [Regret]',
         lines: [
            'Energy levels critical, severe system damage detected.',
            'Please return to the cockpit immediately.',
            'The launch was succeeded, but the world below still remains scarred.',
            'Too much pollution was left behind.',
            'We came with hope, we leave with regret.',
            'Mission failed.',
            'Initiating self-destruct sequence.'
         ]
      }
   ];
}

function getBadEndingChinese() {
   return [
      {
         title: '达成【遗憾】结局',
         lines: [
            '能量不足,机体损毁严重,请立即返回机舱',
            '飞船顺利升空，但下方的世界依然伤痕累累。',
            '仍有太多污染被遗留在这颗星球上。',
            '怀着希望而来的我们,怀着遗憾离去，',
            '任务失败。',
            '销毁程序启动。'
         ]
      }
   ];
}

//SadEnd
function getSadEndingEnglish() {
   return [
      {
         title: 'The End [Pity]',
         lines: [
            'The planet acknowledges your efforts and contributions,',
            'A part of the planet has been saved.',
            'But silence still hangs over the ruins.',
            'Recovery began, yet future remains fragile.',
            'Maybe just a little bit more?',
            '[Try Again!]',
            'A faint call of life comes from afar.'
         ]
      }
   ];
}

function getSadEndingChinese() {
   return [
      {
         title: 'The End [Pity]',
         lines: [
            '星球承认你的努力与付出，',
            '这里的一部分得到了拯救。',
            '然而废墟之上的沉寂依然挥之不去。',
            '复苏已经开始,未来却仍然脆弱。',
            '也许只差一点点？',
            '[再试一次吧!]',
            '从远方飘来生命微弱的呼唤'
         ]
      }
   ];
}

//NormalEnd
function getNormalEndingEnglish() {
   return [
      {
         title: 'The End [Serendipity]',
         lines: [
            'The ecosystem shows signs of returning.',
            'Water runs clearer and the air feels lighter.',
            'There is still work to do, but the future has opened.',
            'Step by step, the silent seeds are waiting to sprout.',
            'Thank you for coming with a mission,',
            'Leaving precious footprints on this planet.',
            'Maybe in the future, maybe not far away,',
            'We look forward to meeting again in a thriving tomorrow.'
         ]
      }
   ];
}

function getNormalEndingChinese() {
   return [
      {
         title: '达成【确幸】结局',
         lines: [
            '生态已然出现复苏的迹象。',
            '水流更加清澈,空气更为清新。',
            '前路仍有任务等待，但未来已经被重新打开。',
            '一点一点,沉默的种子正在期待发芽',
            '感谢怀揣使命而来的你',
            '在这个星球上留下了珍贵的足迹',
            '也许未来，也许不远，',
            '期待我们再次相遇在枝繁叶茂的明天'
         ]
      }
   ];
}

//BetterEnd
function getBetterEndingEnglish() {
   return [
      {
         title: 'The End [Future]',
         lines: [
            'Most of the pollution has been removed.',
            'The sleeping world is finally beginning to breathe again.',
            'A stronger tomorrow is now within reach.',
            'Looking forward to the sound of sprouting,',
            'just like looking forward to the future,',
            'Looking forward to what kind of stories the next adventure will bring,',
            'A new future is slowly unfolding ahead.'
         ]
      }
   ];
}

function getBetterEndingChinese() {
   return [
      {
         title: '达成【未来】结局',
         lines: [
            '大部分污染已经被成功清除。',
            '沉睡的世界终于再次开始呼吸。',
            '污染的生物已经不再威胁这个原本脆弱的星球，',
            '万物复苏，萌芽出现',
            '一个更坚定的明天，已然近在眼前。',
            '期待破土的声音，就像期待未来，',
            '期待下一次冒险又将收获什么样的故事与新奇体验，',
            '新的未来正在前方慢慢展开'
         ]
      }
   ];
}

//HappyEnd
function getHappyEndingEnglish() {
   return [
      {
         title: 'The End [Hope]',
         lines: [
            'The planet shines with renewed life.',
            'The mission brought back warmth, color, and movement.',
            'A new age of recovery has begun.',
            'Pass it on! ',
            'The spark of life continues to spread,',
            'Change is quietly happening in the distant universe,',
            'Pass it on!',
            'In the depths of the star sea, new coordinates are flickering.',
            'The blue signal pierces through the long darkness,',
            'Sending the answer here to even farther places.'
         ]
      }
   ];
}

function getHappyEndingChinese() {
   return [
      {
         title: '达成【希望】结局',
         lines: [
            '这颗星球重新闪耀出生命的光。',
            '你的任务带回了温度、色彩与流动。',
            '一个崭新的复苏时代开始了。',
            '传递下去吧！生命火种不断延续',
            '在遥远的宇宙中，变化正悄然发生，',
            '传递下去吧！',
            '星海深处，新的坐标正在闪烁。',
            '蓝色信号穿过漫长的黑暗，',
            '把这里的答案，送往更远的地方。',
         ]
      }
   ];
}

//TrueEnd
function getTrueEndingEnglish() {
   return [
      {
         title: 'The End [Dawn]',
         lines: [
            'The final trace of pollution has disappeared.',
            'The planet shines with the light of life again.',
            'The wind blows across the fields, the water glitters again.',
            'Birds fly across the clear sky, and young lives sleep in the branches.',
            'In the depths of data, a new thought takes shape for the first time:',
            'The subtle connections between life... gradually take on new meaning.',
            'Forests, rivers, air, nests and homecomings,',
            'are written into a gentler cognition.',
            'Let more sleeping programs learn to see the world again.',
            'From now on, restoration is no longer just a command,',
            'It is also the dawn that lights up the sky.'
         ]
      },
   ];
}

function getTrueEndingChinese() {
   return [
      {
         title: '曙光',
         lines: [
            '最后一丝污染已经彻底消失。',
            '这颗星球重新亮起了生命的光。',
            '风重新吹过原野，水流再次闪烁。',
            '鸟群掠过晴空，幼小的生命在枝叶间安睡。',
            '数据深处，某个新的念头第一次成形:',
            '生命之间细小的关联...渐渐拥有了新的意义。',
            '森林、河流、空气、幼巢与归途，',
            '被写入一段更温柔的认知里。',
            '让更多沉睡的程序，学会重新看见世界。',
            '自此修复不再只是指令，',
            '也是黎明亮起的曙光。'
         ]
      },
   ];
}

function getEndingSlidesForLanguage(endingKey, language) {
   const endings = {
      bad: { en: getBadEndingEnglish, zh: getBadEndingChinese },
      sad: { en: getSadEndingEnglish, zh: getSadEndingChinese },
      normal: { en: getNormalEndingEnglish, zh: getNormalEndingChinese },
      better: { en: getBetterEndingEnglish, zh: getBetterEndingChinese },
      happy: { en: getHappyEndingEnglish, zh: getHappyEndingChinese },
      true: { en: getTrueEndingEnglish, zh: getTrueEndingChinese }
   };

   const ending = endings[endingKey] || endings.bad;
   return (language === 'zh' ? ending.zh : ending.en)();
}

class EndingSequence {
   constructor(resources, endingOutcome) {
      this.resources = resources;
      this.endingOutcome = endingOutcome;
      this.currentSlide = 0;
      this.currentLine = 0;
      this.currentChar = 0;
      this.charInterval = 26;
      this.linePause = 750;
      this.slidePause = 1300;
      this.lastCharTime = millis();
      this.linePauseStart = -1;
      this.slidePauseStart = -1;
      this.imageIndex = 0;
      this.lastImageSwitchTime = millis();
      this.imageInterval = getEndingImageInterval(this.endingOutcome?.key);
      this.skipBtn = {
         x: width - 110,
         y: 28,
         w: 78,
         h: 38
      };
      this.textBox = {
         x: 115,
         y: 520,
         w: 770,
         h: 126
      };
      this.refreshLanguage();
      if (typeof onLanguageChanged === 'function') {
         onLanguageChanged(() => this.refreshLanguage());
      }
   }

   refreshLanguage() {
      const language = typeof getLanguage === 'function' ? getLanguage() : 'en';
      this.slides = getEndingSlidesForLanguage(this.endingOutcome?.key, language);
      if (!this.slides.length) this.slides = getTrueEndingEnglish();
      this.currentSlide = Math.min(this.currentSlide, this.slides.length - 1);
      this.currentLine = Math.min(this.currentLine, this.slides[this.currentSlide].lines.length - 1);
      this.currentChar = Math.min(this.currentChar, this.slides[this.currentSlide].lines[this.currentLine].length);
   }

   update() {
      this._updateImageFrame();

      const slide = this.slides[this.currentSlide];
      const lineText = slide.lines[this.currentLine];

      if (this.currentChar < lineText.length) {
         if (millis() - this.lastCharTime >= this.charInterval) {
            this.currentChar++;
            this.lastCharTime = millis();
         }
         return;
      }

      if (this.linePauseStart < 0) {
         this.linePauseStart = millis();
         return;
      }

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
         this.currentChar >= lineText.length &&
         this.currentSlide < this.slides.length - 1
      ) {
         if (this.slidePauseStart < 0) {
            this.slidePauseStart = millis();
            return;
         }

         if (millis() - this.slidePauseStart >= this.slidePause) {
            this.currentSlide++;
            this.currentLine = 0;
            this.currentChar = 0;
            this.lastCharTime = millis();
            this.linePauseStart = -1;
            this.slidePauseStart = -1;
         }
      }
   }

   _updateImageFrame() {
      const frames = getEndingImageGroup(this.resources, this.endingOutcome?.key);
      if (frames.length <= 1) return;
      if (this.imageIndex >= frames.length - 1) return;

      const now = millis();
      if (now - this.lastImageSwitchTime < this.imageInterval) return;

      this.imageIndex = Math.min(this.imageIndex + 1, frames.length - 1);
      this.lastImageSwitchTime = now;
   }

   display() {
      this.update();

      background(0);
      this.drawBackground();
      this.drawImageOverlay();
      this.drawTitle();
      this.drawTextBox();
      this.drawCurrentLineText();
      this.drawSkipHint();
   }

   drawBackground() {
      const frames = getEndingImageGroup(this.resources, this.endingOutcome?.key);
      const imageAsset = frames[this.imageIndex] || getEndingBackgroundImage(this.resources);
      if (imageAsset) {
         drawImageCover(imageAsset, 0, 0, width, height);
         return;
      }

      background(8, 12, 18);
   }

   drawImageOverlay() {
      push();
      noStroke();
      fill(0, 0, 0, 72);
      rect(0, 0, width, height);
      pop();
   }

   drawTitle() {
      const slide = this.slides[this.currentSlide];
      push();
      fill(255);
      noStroke();
      textAlign(CENTER, TOP);
      textSize(42);
      text(slide.title, width / 2, 56);
      pop();
   }

   drawTextBox() {
      const box = this.textBox;

      push();
      drawingContext.shadowBlur = 18;
      drawingContext.shadowColor = 'rgba(0, 235, 220, 0.35)';
      noStroke();
      fill(0, 0, 0, 140);
      rect(box.x, box.y, box.w, box.h, 14);

      noFill();
      stroke(0, 235, 220, 220);
      strokeWeight(2.2);
      rect(box.x, box.y, box.w, box.h, 14);
      pop();
   }

   drawCurrentLineText() {
      const slide = this.slides[this.currentSlide];
      const fullLine = slide.lines[this.currentLine];
      const visibleText = fullLine.substring(0, this.currentChar);
      const box = this.textBox;
      const textOffsetY = getLanguage() === 'zh' ? 28 : 18;

      push();
      fill(255);
      noStroke();
      textAlign(LEFT, TOP);
      textStyle(NORMAL);
      textSize(35);
      textLeading(30);
      text(
         visibleText,
         box.x + 24,
         box.y + textOffsetY,
         box.w - 48,
         box.h - 24
      );
      pop();
   }

   drawSkipHint() {
      push();
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(24);
      text('Press ESC to return to the Menu', width / 2, height - 42);
      pop();
   }
}

function createEndingSequence(resources, endingOutcome) {
   return new EndingSequence(resources, endingOutcome);
}
