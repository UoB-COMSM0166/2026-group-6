const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'zh'];
let currentLanguage = DEFAULT_LANGUAGE;
const languageChangeListeners = [];

const TRANSLATIONS = {
   en: {
      meta: {
         title: 'Purifying Pollution and Ecological Restoration'
      },
      menu: {
         back: 'Back',
         start: 'Start Game',
         continue: 'Continue Game',
         difficulty: 'Choose Difficulty',
         audio: 'Audio Settings',
         instructions: 'Instructions',
         language: 'Language',
         difficultyTitle: 'Choose Difficulty',
         audioTitle: 'Audio Settings',
         languageTitle: 'Choose Language',
         background: 'Background',
         sounds: 'Sounds',
         easy: 'Easy',
         medium: 'Medium',
         hard: 'Hard',
         english: 'English',
         chinese: 'Chinese'
      },
      controls: {
         title: 'Controls',
         up: 'Up',
         left: 'Left',
         down: 'Down',
         right: 'Right',
         changeRope: 'Change Rope',
         prolongRope: 'Prolong Rope',
         shortenRope: 'Shorten Rope',
         map: 'Map',
         help: 'Help',
         interact: 'Interact',
         leftClick: 'Left Click: Firm Rope',
         rightClick: 'Right Click: Soft Rope'
      },
      hud: {
         hp: 'HP',
         energy: 'Energy',
         areaPurified: 'Area {area} Purified: {progress}%',
         total: 'Total'
      },
      ui: {
         win: 'YOU WON!',
         died: 'DIED',
         restart: 'Press R to Restart'
      },
      resourcePanel: {
         title: 'Player State',
         close: 'Press C to close',
         maxHp: 'MAX HP',
         jumpForce: 'Jump Force',
         ropeLength: 'Rope Len',
         attackDamage: 'Attack Dmg'
      },
      story: {
         skip: 'Skip',
         slides: [
            {
               title: 'The Collapse',
               lines: [
                  'Years of pollution pushed the planet to collapse.',
                  'Cities fell into ruin, and the ecosystem was destroyed.',
                  'The world was no longer suitable for life.'
               ]
            },
            {
               title: 'Dormant Civilization',
               lines: [
                  "Facing extinction, the planet's native civilization made a final decision.",
                  'They entered deep dormancy, waiting for a chance for the world to recover.'
               ]
            },
            {
               title: 'The Mission',
               lines: [
                  'To restore the dying planet, small purification robots were sent from another planet.',
                  'Their mission was to cleanse the pollution and revive the ecosystem.'
               ]
            },
            {
               title: 'The Beginning',
               lines: [
                  'The robot begins its journey.',
                  'Using purification energy, it can cleanse pollution sources.',
                  'But the ruined world still holds many unknown dangers.'
               ]
            }
         ]
      },
      introPanels: {
         movementTitle: 'Movement & Actions',
         move: 'Move',
         interact: 'Interact',
         map: 'Map',
         help: 'Help',
         menu: 'Menu',
         state: 'State',
         ropeTitle: 'Rope Controls',
         cyanRope: 'Cyan Rope',
         redRope: 'Red Rope',
         ropeActions: 'Rope Actions',
         tips: 'Tips',
         prolongRope: 'Prolong Rope',
         shortenRope: 'Shorten Rope',
         tipLines: [
            '1. Click Left or Right Button to Fire',
            'Rope',
            '2. Use Q/E or Mouse Wheel to adjust',
            'rope length',
            '3. You can change the Length of the',
            'rope near the Mouse Cursor, and the',
            'icon represented by this rope will be',
            'Bolded at the bottom of the screen.'
         ]
      },
      instructions: {
         tabs: {
            content: 'Content',
            controls: 'Controls'
         },
         headers: {
            category: 'Category',
            name: 'Name',
            image: 'Image',
            description: 'Description'
         },
         contentPage1: [
            ['Player', 'Robot', "The player's image is a white robot with the ability to purify."],
            ['Ability', 'Energy Rope', 'The rope can help players purify the pollution and traverse difficult terrain.'],
            ['Interactable', 'Energy Pillar', 'Players can obtain purification energy here. Each use restores 100 purification energy.'],
            ['Interactable', 'Button', 'The button can open the mechanism door.'],
            ['Checkpoint', 'Respawn Point', "The player's resurrection point."],
            ['Objective', 'Pollution Source', 'A pollution core that needs to be purified by the player.']
         ],
         contentPage2: [
            ['Enemy', 'Monster', 'It will attack players and can be purified.'],
            ['Gate', 'Area Gate', "A gate between areas that opens when the area's purification level reaches 80%."],
            ['Gate', 'Mechanism Door', 'A door inside the area that opens after pressing a button.'],
            ['Environment', 'Polluted Water', 'Deadly polluted water that kills the player on contact.'],
            ['Environment', 'Clean Water', 'Safe water that does not harm the player.'],
            ['Collectible', 'Energy Crystal', "Scattered crystals that restore the player's purification energy."]
         ],
         controlsPage: {
            attackMonster: 'Attack monster',
            energySupply: 'Energy Supply',
            purifyCore: 'Purify pollution core',
            rest: 'Set a save point and restore HP',
            ropeMechanics: 'Rope Mechanics'
         }
      },
      prompts: {
         environmentChanged: 'Some things have changed due to purification.',
         gateExplore: 'Explore other sub-areas to increase purification.\nReach {threshold}% purification to unlock the next area.',
         gateButton: 'Find button to open the door.'
      }
   },
   zh: {
      meta: {
         title: '污染净化与生态修复'
      },
      menu: {
         back: '返回',
         start: '开始游戏',
         continue: '继续游戏',
         difficulty: '选择难度',
         audio: '音频设置',
         instructions: '游戏说明',
         language: '语言',
         difficultyTitle: '选择难度',
         audioTitle: '音频设置',
         languageTitle: '选择语言',
         background: '背景音乐',
         sounds: '音效',
         easy: '简单',
         medium: '普通',
         hard: '困难',
         english: 'English',
         chinese: '简体中文'
      },
      controls: {
         title: '操作说明',
         up: '上',
         left: '左',
         down: '下',
         right: '右',
         changeRope: '切换绳索',
         prolongRope: '放长绳索',
         shortenRope: '缩短绳索',
         map: '地图',
         help: '帮助',
         interact: '互动',
         leftClick: '左键：硬绳',
         rightClick: '右键：软绳'
      },
      hud: {
         hp: '生命',
         energy: '能量',
         areaPurified: '{area} 区域净化度：{progress}%',
         total: '总计'
      },
      ui: {
         win: '胜利！',
         died: '已死亡',
         restart: '按 R 重新开始'
      },
      resourcePanel: {
         title: '角色状态',
         close: '按 C 关闭',
         maxHp: '最大生命',
         jumpForce: '跳跃力',
         ropeLength: '绳索长度',
         attackDamage: '攻击伤害'
      },
      story: {
         skip: '跳过',
         slides: [
            {
               title: '崩坏',
               lines: [
                  '长年的污染将这颗星球推向崩溃。',
                  '城市化为废墟，生态系统被摧毁。',
                  '这个世界已经不再适合生命生存。'
               ]
            },
            {
               title: '沉眠文明',
               lines: [
                  '面对灭绝，星球上的原生文明做出了最后的决定。',
                  '他们进入深度沉眠，等待世界再次复苏的机会。'
               ]
            },
            {
               title: '使命',
               lines: [
                  '为了拯救濒死的星球，一批小型净化机器人从外星被派遣而来。',
                  '它们的使命，是清除污染并重建生态。'
               ]
            },
            {
               title: '启程',
               lines: [
                  '机器人踏上了它的旅程。',
                  '借助净化能量，它能够清除污染源。',
                  '但这片残破世界中，仍潜藏着许多未知危险。'
               ]
            }
         ]
      },
      introPanels: {
         movementTitle: '移动与操作',
         move: '移动',
         interact: '互动',
         map: '地图',
         help: '帮助',
         menu: '菜单',
         state: '状态',
         ropeTitle: '绳索操作',
         cyanRope: '青色绳索',
         redRope: '红色绳索',
         ropeActions: '绳索动作',
         tips: '提示',
         prolongRope: '放长绳索',
         shortenRope: '缩短绳索',
         tipLines: [
            '1. 点击鼠标左键或右键发射',
            '绳索',
            '2. 使用 Q/E 或鼠标滚轮调节',
            '绳索长度',
            '3. 靠近鼠标的那条绳索会被',
            '优先调节，屏幕底部对应图标',
            '会被加粗高亮显示。',
            ''
         ]
      },
      instructions: {
         tabs: {
            content: '内容',
            controls: '操作'
         },
         headers: {
            category: '类别',
            name: '名称',
            image: '图片',
            description: '说明'
         },
         contentPage1: [
            ['玩家', '机器人', '玩家操控的是一台拥有净化能力的白色机器人。'],
            ['能力', '能量绳索', '绳索可以帮助玩家净化污染并穿越复杂地形。'],
            ['可互动', '能量柱', '玩家可在此补充净化能量，每次恢复 100 点。'],
            ['可互动', '按钮', '按钮可以打开机关门。'],
            ['检查点', '复活点', '玩家死亡后会从这里重新开始。'],
            ['目标', '污染核心', '需要由玩家净化的污染核心。']
         ],
         contentPage2: [
            ['敌人', '怪物', '它会攻击玩家，也可以被净化。'],
            ['门', '区域门', '当区域净化度达到 80% 时，连接区域的门会开启。'],
            ['门', '机关门', '按下按钮后开启的区域内部机关门。'],
            ['环境', '污染水域', '致命的污染水，接触后玩家会死亡。'],
            ['环境', '清洁水域', '安全的水域，不会伤害玩家。'],
            ['收集物', '能量水晶', '散落在地图中的水晶，可恢复玩家净化能量。']
         ],
         controlsPage: {
            attackMonster: '攻击怪物',
            energySupply: '补充能量',
            purifyCore: '净化污染核心',
            rest: '设置存档点并恢复生命',
            ropeMechanics: '绳索机制'
         }
      },
      prompts: {
         environmentChanged: '净化进度提升后，环境发生了变化。',
         gateExplore: '去探索其他子区域以提升净化度。\n达到 {threshold}% 净化度后即可解锁下一区域。',
         gateButton: '找到按钮来打开这扇门。'
      }
   }
};

function getTranslationValue(language, key) {
   return key.split('.').reduce((value, part) => {
      if (value == null) return undefined;
      return value[part];
   }, TRANSLATIONS[language]);
}

function fillTemplate(template, params) {
   return template.replace(/\{(\w+)\}/g, (_, name) => {
      return params[name] ?? `{${name}}`;
   });
}

function t(key, params = {}) {
   const value = getTranslationValue(currentLanguage, key) ?? getTranslationValue(DEFAULT_LANGUAGE, key);
   if (typeof value === 'string') {
      return fillTemplate(value, params);
   }
   return value ?? key;
}

function getLanguage() {
   return currentLanguage;
}

function getLocalizedStorySlides() {
   return t('story.slides');
}

function getUIFontFamilyCss() {
   if (currentLanguage === 'zh') {
      return '"Microsoft YaHei", "Noto Sans SC", "PingFang SC", sans-serif';
   }
   return '"Monogram", monospace';
}

function applyGameTextFont(resources) {
   if (currentLanguage === 'zh') {
      textFont('Microsoft YaHei');
      return;
   }

   if (resources?.fonts?.main) {
      textFont(resources.fonts.main);
   } else {
      textFont('monospace');
   }
}

function updateStaticDomTranslations() {
   document.title = t('meta.title');
   document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
   document.documentElement.style.setProperty('--game-font-family', getUIFontFamilyCss());

   const controlsUi = document.getElementById('controls-ui');
   if (!controlsUi) return;

   const title = controlsUi.querySelector('h3');
   if (title) title.textContent = t('controls.title');

   const rows = controlsUi.querySelectorAll('.row');
   const rowTexts = [
      `W ${t('controls.up')}`,
      `A ${t('controls.left')}`,
      `S ${t('controls.down')}`,
      `D ${t('controls.right')}`,
      `T ${t('controls.changeRope')}`,
      `E ${t('controls.prolongRope')}`,
      `C ${t('controls.shortenRope')}`,
      `M ${t('controls.map')}`,
      `H ${t('controls.help')}`,
      `F ${t('controls.interact')}`
   ];

   rows.forEach((row, index) => {
      const key = row.querySelector('.key');
      const keyLabel = key ? key.textContent : '';
      row.innerHTML = `<span class="key">${keyLabel}</span> ${rowTexts[index].slice(keyLabel.length + 1)}`;
   });

   const paragraphs = controlsUi.querySelectorAll('p');
   if (paragraphs[0]) paragraphs[0].textContent = t('controls.leftClick');
   if (paragraphs[1]) paragraphs[1].textContent = t('controls.rightClick');
}

function onLanguageChanged(listener) {
   languageChangeListeners.push(listener);
}

function setLanguage(language) {
   if (!SUPPORTED_LANGUAGES.includes(language) || language === currentLanguage) {
      updateStaticDomTranslations();
      return;
   }

   currentLanguage = language;
   updateStaticDomTranslations();
   languageChangeListeners.forEach(listener => listener(language));
}

updateStaticDomTranslations();
