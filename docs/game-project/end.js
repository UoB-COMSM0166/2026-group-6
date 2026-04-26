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

   if (endingKey === 'happy') {
      return [
         groups.best?.[1],
         groups.best?.[2],
         groups.best?.[3],
         groups.best?.[4]
      ].filter(Boolean);
   }

   if (endingKey === 'true') {
      return [
         groups.best?.[0],
         groups.best?.[2],
         groups.best?.[3],
         groups.best?.[4]
      ].filter(Boolean);
   }

   return [];
}

function getEndingImageTotalDuration(endingKey) {
   if (endingKey === 'bad' || endingKey === 'sad') return 7200;
   if (endingKey === 'normal' || endingKey === 'better') return 12000;
   if (endingKey === 'happy' || endingKey === 'true') return 16800;
   return 12000;
}

function getEndingSequenceDuration(slides, charInterval, linePause, slidePause, fallbackEndingKey) {
   if (!Array.isArray(slides) || slides.length === 0) {
      return getEndingImageTotalDuration(fallbackEndingKey);
   }

   let duration = 0;
   for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      const slide = slides[slideIndex];
      const lines = Array.isArray(slide?.lines) ? slide.lines : [];

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
         duration += lines[lineIndex].length * charInterval;
         if (lineIndex < lines.length - 1) {
            duration += linePause;
         }
      }

      if (slideIndex < slides.length - 1) {
         duration += slidePause;
      }
   }

   return Math.max(duration, getEndingImageTotalDuration(fallbackEndingKey));
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

function wrapEndingTextByCharacters(content, maxWidth) {
   if (typeof content !== 'string' || !content.length) return content;

   let wrapped = '';
   let currentLine = '';

   for (const char of content) {
      const candidate = currentLine + char;
      if (textWidth(candidate) <= maxWidth || currentLine.length === 0) {
         currentLine = candidate;
         continue;
      }

      wrapped += `${currentLine}\n`;
      currentLine = char;
   }

   return wrapped + currentLine;
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
      targetAudio.loop();
   }

   return targetAudio;
}

//Badend
function getBadEndingEnglish() {
   return [
      {
         title: 'The End [Regret]',
         lines: [
            'Energy levels critical, severe system damage detected. Please return to the cockpit immediately.',
            'The launch was succeeded, but the world below still remains scarred.',
            'Too much pollution was left behind. We came with hope, we leave with regret.',
            '[Mission Failure detected] Initiating self-destruct sequence.'
         ]
      }
   ];
}

function getBadEndingChinese() {
   return [
      {
         title: '达成【遗憾】结局',
         lines: [
            '能量不足,机体损毁严重,请立即返回机舱!',
            '飞船顺利升空，但下方的世界依然伤痕累累。',
            '仍有太多污染被遗留在这颗星球上。怀着希望而来的我们,怀着遗憾离去。',
            '检测到【任务失败】,销毁程序已启动。'
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
            'The planet acknowledges your efforts and contributions, a part of the planet has been saved.',
            'But silence still hangs over the ruins.',
            'Recovery began, yet future remains fragile.',
            'Maybe just a little bit more?',
            '[Try Once Again!] A faint call of life comes from afar.'
         ]
      }
   ];
}

function getSadEndingChinese() {
   return [
      {
         title: '达成【惋惜】结局',
         lines: [
            '星球承认你的努力与付出，这里的一部分得到了拯救。',
            '然而废墟之上的沉寂依然挥之不去。',
            '复苏已经开始,未来却仍然脆弱。',
            '也许只差一点点？',
            '【再试一次吧!】 从远方飘来生命微弱的呼唤。'
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
            'The ecosystem shows signs of returning. Water runs clearer and the air feels lighter.',
            'There is still work to do, but the future has opened.',
            'Step by step, the silent seeds are waiting to sprout.',
            'Thank you for coming with a mission, and leaving precious footprints on this planet.',
            'Maybe in the future, maybe not far away. We look forward to meeting again in a thriving tomorrow.'
         ]
      }
   ];
}

function getNormalEndingChinese() {
   return [
      {
         title: '达成【确幸】结局',
         lines: [
            '生态已然出现复苏的迹象。水流更加清澈,空气更为清新。',
            '前路仍有任务等待，但未来已经被重新定义。',
            '一点一点,沉默的种子正在期待发芽...',
            '感谢怀揣使命而来的你，在这个星球上留下弥足珍贵的足迹。',
            '也许未来，也许不远，期待我们的再次相遇，在枝繁叶茂的明天。'
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
            'Most of the pollution has been removed. The sleeping world is finally beginning to breathe again.',
            'A stronger tomorrow is now within reach.',
            'Looking forward to the sound of sprouting, just like looking forward to the future,',
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
            '大部分污染已经被成功清除，沉睡的世界终于再次开始呼吸。',
            '污染的生物已经不再威胁这个原本脆弱的星球。',
            '万物复苏，萌芽出现。一个更坚定的明天，已然近在眼前。',
            '期待破土的声音，就像期待未来，',
            '期待下一次冒险又将收获什么样的故事与新奇体验，新的未来正在前方慢慢展开...'
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
            'The planet shines with renewed life. The mission brought back warmth, color, and movement.',
            'A new age of recovery has begun.',
            'Pass it on! The spark of life continues to spread,',
            'Change is quietly happening in the distant universe,',
            'Pass it on! In the depths of the star sea, new coordinates are flickering.',
            'The blue signal pierces through the long darkness, sending the answer here to even farther places.'
         ]
      }
   ];
}

function getHappyEndingChinese() {
   return [
      {
         title: '达成【希望】结局',
         lines: [
            '这颗星球重新闪耀出生命的光，你的任务带回了温度、色彩与流动。',
            '一个崭新的复苏时代开始了。',
            '传递下去吧！生命火种不断延续，',
            '在遥远的宇宙中，变化正悄然发生。',
            '传递下去吧！星海深处，新的坐标正在闪烁。',
            '蓝色信号穿过漫长的黑暗，把这里的答案，送往更远的地方。',
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
            'The final trace of pollution has disappeared. The planet shines with the light of life again.',
            'The wind blows across the fields, the water glitters again.',
            'Birds fly across the clear sky, and young lives chirp among the branches.',
            'Forests, rivers, air, nests and homecomings, are written into a gentler cognition.',
            'In the depths of data, a new thought takes shape for the first time: ',
            'The subtle connections between life... gradually take on new meaning.',
            'Let more sleeping programs learn to see the world again.',
            'From now on, restoration is no longer just a command, it is also the dawn that lights up the sky.'
         ]
      },
   ];
}

function getTrueEndingChinese() {
   return [
      {
         title: '达成【曙光】结局',
         lines: [
            '最后一丝污染已经彻底消失，这颗星球重新亮起了生命的光。',
            '风重新吹过原野，水流再次闪烁。鸟群掠过晴空，幼小的生命在枝叶间叽喳作响。',
            '森林、河流、空气、幼巢与归途；被写入一段更温柔的认知里。',
            '数据深处，某个新的念头第一次成形:生命之间细小的关联...渐渐拥有了新的意义。',
            '让更多沉睡的程序，学会重新看见世界。自此修复不再只是指令，也是黎明亮起的曙光。'
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
      this.linePause = 3250;
      this.slidePause = 3800;
      this.lastCharTime = millis();
      this.linePauseStart = -1;
      this.slidePauseStart = -1;
      this.sequenceStartTime = millis();
      this.sequenceDuration = 0;
      this.imageIndex = 0;
      this.skipBtn = {
         x: width - 110,
         y: 28,
         w: 78,
         h: 38
      };
      this.replayBtn = null;
      this.textBox = {
         x: 115,
         y: 520,
         w: 770,
         h: 126
      };
      this.refreshLanguage();
      this._ensureReplayButton();
      if (typeof onLanguageChanged === 'function') {
         onLanguageChanged(() => {
            this.refreshLanguage();
            this._refreshReplayButtonLabel();
         });
      }
   }

   refreshLanguage() {
      const language = typeof getLanguage === 'function' ? getLanguage() : 'en';
      this.slides = getEndingSlidesForLanguage(this.endingOutcome?.key, language);
      if (!this.slides.length) this.slides = getTrueEndingEnglish();
      this.sequenceDuration = getEndingSequenceDuration(
         this.slides,
         this.charInterval,
         this.linePause,
         this.slidePause,
         this.endingOutcome?.key
      );
      this.currentSlide = Math.min(this.currentSlide, this.slides.length - 1);
      this.currentLine = Math.min(this.currentLine, this.slides[this.currentSlide].lines.length - 1);
      this.currentChar = Math.min(this.currentChar, this.slides[this.currentSlide].lines[this.currentLine].length);
   }

   resetPlayback() {
      this.currentSlide = 0;
      this.currentLine = 0;
      this.currentChar = 0;
      this.linePauseStart = -1;
      this.slidePauseStart = -1;
      this.sequenceStartTime = millis();
      this.lastCharTime = millis();
      this.lastImageSwitchTime = millis();
      this.imageIndex = 0;
   }

   _ensureReplayButton() {
      if (typeof document === 'undefined') return;
      if (this.replayBtn && !this.replayBtn.isConnected) {
         this.replayBtn = null;
      }
      if (this.replayBtn) return;

      const btn = document.createElement('button');
      btn.id = 'ending-replay-btn';
      btn.style.cssText =
         'display:none;' +
         'position:fixed; top:calc(50% - 350px + 34px); left:calc(50% - 500px + 58px);' +
         'width:124px; height:42px; font-size:22px; font-weight:bold; color:white;' +
         'font-family:var(--game-font-family), monospace;' +
         'background-image:url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Normal.png");' +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'background-color:transparent;' +
         'border:none; cursor:pointer;' +
         'transition:all 0.2s;' +
         'z-index:120;';

      btn.onmouseenter = () => {
         btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Hover.png")';
      };
      btn.onmouseleave = () => {
         btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Normal.png")';
      };
      btn.onmousedown = () => {
         btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Active.png")';
      };
      btn.onmouseup = () => {
         btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Hover.png")';
      };
      btn.onclick = (event) => {
         event.preventDefault();
         event.stopPropagation();
         this.resetPlayback();
      };

      document.body.appendChild(btn);
      this.replayBtn = btn;
      this._refreshReplayButtonLabel();
   }

   _refreshReplayButtonLabel() {
      if (!this.replayBtn) return;
      this.replayBtn.textContent = getLanguage() === 'zh' ? '回看' : 'Replay';
      this.replayBtn.style.fontSize = getLanguage() === 'zh' ? '20px' : '24px';
   }

   _showReplayButton() {
      this._ensureReplayButton();
      if (!this.replayBtn) return;
      this.replayBtn.style.display = 'block';
      this.replayBtn.style.visibility = 'visible';
      this.replayBtn.style.pointerEvents = 'auto';
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

      const elapsed = Math.max(0, millis() - this.sequenceStartTime);
      const progress = Math.min(1, elapsed / Math.max(1, this.sequenceDuration));
      this.imageIndex = Math.min(
         Math.floor(progress * frames.length),
         frames.length - 1
      );
   }

   display() {
      this.update();
      this._showReplayButton();

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
      const titleSize = getLanguage() === 'zh' ? 39 : 44;
      push();
      fill(255);
      noStroke();
      textAlign(CENTER, TOP);
      textSize(titleSize);
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
      const box = this.textBox;
      const isChinese = getLanguage() === 'zh';
      const textOffsetY = isChinese ? 29 : 16;
      const textSizeValue = isChinese ? 30 : 40;
      const lineSpacing = isChinese ? 40 : 30;
      const textBoxWidth = box.w - 48;

      push();
      fill(255);
      noStroke();
      textAlign(LEFT, TOP);
      textStyle(NORMAL);
      textSize(textSizeValue);
      textLeading(lineSpacing);
      const visibleText = fullLine.substring(0, this.currentChar);
      const displayText = isChinese
         ? wrapEndingTextByCharacters(visibleText, textBoxWidth)
         : visibleText;
      text(
         displayText,
         box.x + 24,
         box.y + textOffsetY,
         textBoxWidth,
         box.h - 24
      );
      pop();
   }

   drawSkipHint() {
      const hintSize = getLanguage() === 'zh' ? 24 : 26;
      push();
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(hintSize);
      text('Press ESC to return to the Menu', width / 2, height - 42);
      pop();
   }
}

function createEndingSequence(resources, endingOutcome) {
   return new EndingSequence(resources, endingOutcome);
}

function setEndingReplayButtonVisible(visible) {
   if (typeof document === 'undefined') return;
   const button = document.getElementById('ending-replay-btn');
   if (!button) return;

   if (visible) {
      button.style.display = 'block';
      button.style.visibility = 'visible';
      button.style.pointerEvents = 'auto';
      return;
   }

   button.remove();
}

// ---------------------------------------------------------------------------
// Extra ending preview menu hooks
// This section is intentionally isolated so it can be removed later without
// touching the existing menu / ending implementation above.
// ---------------------------------------------------------------------------

function getEndingPreviewLabels() {
   if (typeof getLanguage === 'function' && getLanguage() === 'zh') {
      return {
         entry: '结局预览',
         title: '所有结局预览',
         backHint: '按 ESC 返回菜单',
         bad: '遗憾',
         sad: '怜惜',
         normal: '确幸',
         better: '未来',
         happy: '希望',
         true: '曙光'
      };
   }

   return {
      entry: 'Ending Preview',
      title: 'All Endings Preview',
      backHint: 'Press ESC to return to the Menu',
      bad: 'Regret',
      sad: 'Pity',
      normal: 'Serendipity',
      better: 'Future',
      happy: 'Hope',
      true: 'Dawn'
   };
}

class EndingPreviewGameManager {
   constructor(resources, endingOutcome) {
      this.__endingPreview = true;
      this.resources = resources;
      this.status = 'WIN';
      this.endingOutcome = endingOutcome;
      this.endingAudio = playEndingAudio(resources, endingOutcome);
      this.endingSequence = createEndingSequence(resources, endingOutcome);
   }

   update() { }

   render() {
      UI.drawWinScreen(this);
   }

   getEndingOutcome() {
      return this.endingOutcome;
   }

   onKeyPressed() { }

   onMousePressed() { }
}

function createEndingPreviewButton(menuUI, label, onClick, width = 220) {
   const btn = document.createElement('button');
   btn.textContent = label;
   btn.style.cssText =
      `width:${width}px; height:62px; font-size:${getLanguage() === 'zh' ? '28px' : '26px'}; font-weight:bold; color:white;` +
      'font-family:var(--game-font-family), monospace;' +
      `background-image:url("${menuUI.BTN_NORMAL}");` +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-position:center;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'transition: all 0.2s;';

   btn.onmouseenter = () => {
      btn.style.backgroundImage = `url("${menuUI.BTN_HOVER}")`;
   };
   btn.onmouseleave = () => {
      btn.style.backgroundImage = `url("${menuUI.BTN_NORMAL}")`;
   };
   btn.onmousedown = () => {
      btn.style.backgroundImage = `url("${menuUI.BTN_ACTIVE}")`;
   };
   btn.onmouseup = () => {
      btn.style.backgroundImage = `url("${menuUI.BTN_HOVER}")`;
   };
   btn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick(event);
   };

   return btn;
}

function launchEndingPreview(menuUI, endingKey) {
   const matchedEnding = ENDING_DEFINITIONS.find((ending) => ending.key === endingKey);
   if (!matchedEnding) return;

   menuUI._playClickSound?.();
   menuUI.audioManager?.stopGameplayBgmCycle?.();

   const previewManager = new EndingPreviewGameManager(menuUI.resources, {
      ...matchedEnding,
      progress: matchedEnding.minProgress
   });

   menuUI.setGameManager(previewManager);
   if (menuUI.menuDiv) {
      menuUI.menuDiv.style.display = 'none';
   }
   menuUI.setAppState('PLAYING');
}

function attachEndingPreviewMenu(menuUI) {
   if (!menuUI?.menuDiv || menuUI._endingPreviewRefs) return;

   const labels = getEndingPreviewLabels();
   const mainPanel = document.getElementById('menu-main-panel');
   if (!mainPanel) return;

   const entryBtn = menuUI._makeBtn(labels.entry, (event) => {
      event.preventDefault();
      event.stopPropagation();
      menuUI._playClickSound?.();
      menuUI.showMenuPage('ending-preview');
   });

   const previewPanel = document.createElement('div');
   previewPanel.id = 'menu-ending-preview-panel';
   previewPanel.style.cssText =
      'display:none;' +
      'flex-direction:column; align-items:center; justify-content:center; gap:18px; width:100%;';

   const previewTitle = document.createElement('div');
   previewTitle.textContent = labels.title;
   previewTitle.style.cssText =
      'font-size:36px; font-weight:bold; color:#fff; margin-bottom:10px;' +
      'font-family:var(--game-font-family), monospace;';

   const previewGrid = document.createElement('div');
   previewGrid.style.cssText =
      'display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:18px 20px; width:520px;';

   const endingKeys = ['bad', 'sad', 'normal', 'better', 'happy', 'true'];
   const previewButtons = {};
   endingKeys.forEach((endingKey) => {
      const btn = createEndingPreviewButton(menuUI, labels[endingKey], () => {
         launchEndingPreview(menuUI, endingKey);
      }, 240);
      btn.dataset.endingPreviewKey = endingKey;
      previewButtons[endingKey] = btn;
      previewGrid.appendChild(btn);
   });

   const previewHint = document.createElement('div');
   previewHint.textContent = labels.backHint;
   previewHint.style.cssText =
      'margin-top:6px; color:rgba(255,255,255,0.9); font-size:22px;' +
      'font-family:var(--game-font-family), monospace;';

   previewPanel.appendChild(previewTitle);
   previewPanel.appendChild(previewGrid);
   previewPanel.appendChild(previewHint);

   mainPanel.appendChild(entryBtn);
   menuUI.menuDiv.appendChild(previewPanel);

   menuUI._endingPreviewRefs = {
      entryBtn,
      previewPanel,
      previewTitle,
      previewHint,
      previewButtons
   };
}

function patchMenuUIForEndingPreview() {
   if (typeof MenuUI === 'undefined' || MenuUI.prototype.__endingPreviewPatched) return false;

   const originalCreateMenu = MenuUI.prototype.createMenu;
   MenuUI.prototype.createMenu = function (...args) {
      const result = originalCreateMenu.apply(this, args);
      attachEndingPreviewMenu(this);
      return result;
   };

   const originalShowMenuPage = MenuUI.prototype.showMenuPage;
   MenuUI.prototype.showMenuPage = function (page) {
      setEndingReplayButtonVisible(false);
      originalShowMenuPage.call(this, page);
      setEndingReplayButtonVisible(false);

      const refs = this._endingPreviewRefs;
      if (!refs) return;

      const backBtn = document.getElementById('menu-back-btn');
      if (page === 'ending-preview') {
         document.getElementById('menu-main-panel')?.style.setProperty('display', 'none');
         refs.previewPanel.style.display = 'flex';
         if (backBtn) backBtn.style.display = 'block';
      } else {
         refs.previewPanel.style.display = 'none';
      }
   };

   const originalRefreshLanguage = MenuUI.prototype.refreshLanguage;
   MenuUI.prototype.refreshLanguage = function (...args) {
      const result = originalRefreshLanguage.apply(this, args);
      const refs = this._endingPreviewRefs;
      if (!refs) return result;

      const labels = getEndingPreviewLabels();
      refs.entryBtn.textContent = labels.entry;
      refs.previewTitle.textContent = labels.title;
      refs.previewHint.textContent = labels.backHint;
      Object.entries(refs.previewButtons).forEach(([endingKey, button]) => {
         button.textContent = labels[endingKey];
      });
      return result;
   };

   MenuUI.prototype.__endingPreviewPatched = true;
   return true;
}

function patchAudioManagerForEndingPreview() {
   if (typeof AudioManager === 'undefined' || AudioManager.prototype.__endingPreviewPatched) return false;

   const originalUpdateGameplayAudio = AudioManager.prototype.updateGameplayAudio;
   AudioManager.prototype.updateGameplayAudio = function (gm, appState) {
      if (gm?.__endingPreview) {
         return;
      }
      return originalUpdateGameplayAudio.call(this, gm, appState);
   };

   AudioManager.prototype.__endingPreviewPatched = true;
   return true;
}

function patchAppControllerForEndingReplayButton() {
   if (typeof AppController === 'undefined' || AppController.prototype.__endingReplayPatched) return false;

   const originalDraw = AppController.prototype.draw;
   AppController.prototype.draw = function (...args) {
      const showReplay = this.appState === 'PLAYING' && this.gm?.status === 'WIN' && !!this.gm?.endingSequence;
      setEndingReplayButtonVisible(showReplay);
      return originalDraw.apply(this, args);
   };

   AppController.prototype.__endingReplayPatched = true;
   return true;
}

function patchMenuUIForEndingReplayButton() {
   if (typeof MenuUI === 'undefined' || MenuUI.prototype.__endingReplayVisibilityPatched) return false;

   const originalShowMenu = MenuUI.prototype.showMenu;
   MenuUI.prototype.showMenu = function (...args) {
      setEndingReplayButtonVisible(false);
      const result = originalShowMenu.apply(this, args);
      setEndingReplayButtonVisible(false);
      return result;
   };

   const originalHideMenu = MenuUI.prototype.hideMenu;
   MenuUI.prototype.hideMenu = function (...args) {
      const result = originalHideMenu.apply(this, args);
      const showReplay = this.getGameManager?.()?.status === 'WIN' && !!this.getGameManager?.()?.endingSequence;
      setEndingReplayButtonVisible(showReplay);
      return result;
   };

   MenuUI.prototype.__endingReplayVisibilityPatched = true;
   return true;
}

function installEndingPreviewHooks() {
   const replayMenuReady = patchMenuUIForEndingReplayButton();
   const appReady = patchAppControllerForEndingReplayButton();
   return replayMenuReady && appReady;
}

function waitForEndingPreviewHooks() {
   if (installEndingPreviewHooks()) return;
   if (typeof requestAnimationFrame !== 'function') return;
   requestAnimationFrame(waitForEndingPreviewHooks);
}

waitForEndingPreviewHooks();
