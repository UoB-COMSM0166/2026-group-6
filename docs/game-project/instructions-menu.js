/* global t, getLanguage */
// Builds and manages the standalone Instructions view used by the main menu.
class InstructionsMenu {
   constructor(options) {
      this.buttonImages = options.buttonImages;
      this.onPlayClickSound = options.onPlayClickSound || (() => { });

      this.panel = null;
      this.pages = [];
      this.nextPageButton = null;
      this.contentButton = null;
      this.operationPageButton = null;
      this.pageIndex = 1;
      this.styleElement = null;
   }

   refreshLanguage() {
      if (this.contentButton) {
         this.contentButton.textContent = t('instructions.tabs.content');
      }
      if (this.operationPageButton) {
         this.operationPageButton.textContent = t('instructions.tabs.controls');
      }
      if (!this.panel) return;

      const currentPageIndex = this.pageIndex;
      this.pages.forEach(page => page.remove());
      this.pages = [
         this.createContentPage1(),
         this.createContentPage2(),
         this.createControlsPage(),
         this.createRopeMechanicsPage()
      ];

      this.pages.forEach(page => this.panel.insertBefore(page, this.operationPageButton));
      this.showContentPage(currentPageIndex);
   }

   attachTo(parent) {
      if (this.panel) {
         parent.appendChild(this.panel);
         return this.panel;
      }

      this.panel = document.createElement('div');
      this.panel.id = 'menu-instructions-panel';
      this.panel.style.cssText =
         'display:none;' +
         'flex-direction:column;' +
         'align-items:center;' +
         'justify-content:flex-start;' +
         'width:100%;' +
         'height:100%;' +
         'padding:110px 24px 24px 24px;' +
         'box-sizing:border-box;' +
         'overflow:hidden;' +
         'color:#fff;' +
         'position:relative;';

      this.styleElement = document.createElement('style');
      this.styleElement.textContent = `
/* Keep table borders and text wrapping local to the instructions panel. */
#menu-instructions-panel .instructions-table thead th {
   border-bottom: 1px solid rgba(255,255,255,0.18);
}

#menu-instructions-panel .instructions-table thead th:not(:last-child),
#menu-instructions-panel .instructions-table tbody td:not(:last-child) {
   border-right: 1px solid rgba(255,255,255,0.12);
}

#menu-instructions-panel .instructions-table tbody tr:not(:last-child) td {
   border-bottom: 1px solid rgba(255,255,255,0.12);
}

#menu-instructions-panel .instructions-table th,
#menu-instructions-panel .instructions-table td {
   white-space: normal;
   overflow-wrap: anywhere;
   word-break: break-word;
   line-height: 1.35;
}

html[lang="en"] #menu-instructions-panel .instructions-table {
   font-size: 28px !important;
}

html[lang="en"] #menu-instructions-panel .instructions-control-text {
   font-size: 34px !important;
}

html[lang="en"] #menu-instructions-panel .instructions-tab {
   font-size: 34px !important;
}

html[lang="en"] #menu-instructions-panel .instructions-table tbody td:nth-child(2) {
   padding-left: 12px;
}

html[lang="zh"] #menu-instructions-panel .instructions-table tbody td {
   text-align: center;
}
`;
      document.head.appendChild(this.styleElement);

      this.pages = [
         // 1-2 are content tables, 3 is the controls gallery, 4 is the rope mechanics page.
         this.createContentPage1(),
         this.createContentPage2(),
         this.createControlsPage(),
         this.createRopeMechanicsPage()
      ];

      this.pages.forEach(page => this.panel.appendChild(page));

      this.contentButton = this.createTabButton('menu-content-btn', t('instructions.tabs.content'), 'right:40px;', () => {
         this.showContentPage(1);
      });

      this.operationPageButton = this.createTabButton(
         'menu-operation-page-btn',
         t('instructions.tabs.controls'),
         'left:50%; transform:translateX(-50%);',
         () => {
            this.showContentPage(3);
         }
      );

      this.nextPageButton = document.createElement('button');
      this.nextPageButton.id = 'menu-next-page-btn';
      this.nextPageButton.style.cssText =
         'position:absolute;' +
         'right:18px;' +
         'bottom:12px;' +
         'width:56px;' +
         'height:56px;' +
         'padding:0;' +
         'background-image:url("resources/images/instructions/next.png");' +
         'background-size:contain;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'background-color:transparent;' +
         'border:none;' +
         'cursor:pointer;' +
         'transition:opacity 0.2s;' +
         'z-index:100;';
      this.nextPageButton.onmouseenter = function () { this.style.opacity = '0.85'; };
      this.nextPageButton.onmouseleave = function () { this.style.opacity = '1'; };
      this.nextPageButton.onmousedown = function () { this.style.opacity = '0.7'; };
      this.nextPageButton.onmouseup = function () { this.style.opacity = '0.85'; };
      this.nextPageButton.onclick = (e) => {
         e.preventDefault();
         e.stopPropagation();
         this.onPlayClickSound();

         // Pages are grouped as 1<->2 and 3<->4, so the arrow just toggles within each pair.
         if (this.pageIndex === 1) {
            this.showContentPage(2);
         } else if (this.pageIndex === 2) {
            this.showContentPage(1);
         } else if (this.pageIndex === 3) {
            this.showContentPage(4);
         } else {
            this.showContentPage(3);
         }
      };

      this.panel.appendChild(this.operationPageButton);
      this.panel.appendChild(this.contentButton);
      this.panel.appendChild(this.nextPageButton);

      parent.appendChild(this.panel);
      this.reset();
      return this.panel;
   }

   reset() {
      this.showContentPage(1);
   }

   show() {
      if (this.panel) {
         this.panel.style.display = 'flex';
      }
      this.reset();
   }

   hide() {
      if (this.panel) {
         this.panel.style.display = 'none';
      }
   }

   showContentPage(pageIndex) {
      this.pageIndex = pageIndex;
      // Only one instructions sub-page is visible at a time.
      this.pages.forEach((page, index) => {
         page.style.display = index + 1 === pageIndex ? 'flex' : 'none';
      });
      this.loadVisiblePageImages(pageIndex);

      if (this.nextPageButton) {
         this.nextPageButton.style.backgroundImage = (pageIndex === 2 || pageIndex === 4)
            ? 'url("resources/images/instructions/prev.png")'
            : 'url("resources/images/instructions/next.png")';
      }
   }

   createTabButton(id, label, extraPositionCss, onClick) {
      const button = document.createElement('button');
      button.id = id;
      button.className = 'instructions-tab';
      button.textContent = label;
      const tabFontSize = getLanguage() === 'zh' ? '34px' : '38px';
      button.style.cssText =
         'position:absolute;' +
         'top:30px;' +
         extraPositionCss +
         'width:200px;' +
         'height:60px;' +
         `font-size:${tabFontSize};` +
         'font-weight:bold;' +
         'color:white;' +
         `background-image:url("${this.buttonImages.normal}");` +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'background-color:transparent;' +
         'border:none;' +
         'cursor:pointer;' +
         'transition:all 0.2s;' +
         'z-index:100;';

      button.onmouseenter = () => {
         button.style.backgroundImage = `url("${this.buttonImages.hover}")`;
      };
      button.onmouseleave = () => {
         button.style.backgroundImage = `url("${this.buttonImages.normal}")`;
      };
      button.onmousedown = () => {
         button.style.backgroundImage = `url("${this.buttonImages.active}")`;
      };
      button.onmouseup = () => {
         button.style.backgroundImage = `url("${this.buttonImages.hover}")`;
      };
      button.onclick = (e) => {
         e.preventDefault();
         e.stopPropagation();
         this.onPlayClickSound();
         onClick();
      };

      return button;
   }

   createInstructionCard() {
      const wrap = document.createElement('div');
      wrap.style.cssText =
         // Use a fixed card shell so both content tables share the same frame.
         'width:96%;' +
         'max-width:1080px;' +
         'min-height:590px;' +
         'display:flex;' +
         'justify-content:center;' +
         'align-items:center;' +
         'background-image:url("resources/images/instructions/cardX3.png");' +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'padding:24px 26px 28px 26px;' +
         'box-sizing:border-box;';
      return wrap;
   }

   createContentPage1() {
      const page = document.createElement('div');
      page.style.cssText = 'width:100%; display:flex; justify-content:center; box-sizing:border-box;';
      const wrap = this.createInstructionCard();
      const isEnglish = getLanguage() === 'en';
      const categoryWidth = isEnglish ? '18%' : '14%';
      const nameWidth = '15%';
      const imageWidth = '9%';
      const descriptionWidth = isEnglish ? '58%' : '62%';
      wrap.appendChild(this.createTable(`
<thead>
<tr>
<<<<<<< HEAD
<th style="${this.thStyle()} width:${categoryWidth};">${t('instructions.headers.category')}</th>
<th style="${this.thStyle()} width:${nameWidth};">${t('instructions.headers.name')}</th>
<th style="${this.thStyle()} width:${imageWidth};">${t('instructions.headers.image')}</th>
<th style="${this.thStyle()} width:${descriptionWidth};">${t('instructions.headers.description')}</th>
=======
<th style="${this.thStyle()} width:11%;">${t('instructions.headers.category')}</th>
<th style="${this.thStyle()} width:15%;">${t('instructions.headers.name')}</th>
<th style="${this.thStyle()} width:9%;">${t('instructions.headers.image')}</th>
<th style="${this.thStyle()} width:65%;">${t('instructions.headers.description')}</th>
>>>>>>> b531474 (saveallnewchanges)
</tr>
</thead>
<tbody>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.0.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.0.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/contentplayer.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.0.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.1.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.1.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/contentrope.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.1.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}" rowspan="2">${t('instructions.contentPage1.2.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.2.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/cleaningenergy.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.2.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.3.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/button.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.3.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.4.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.4.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/reset.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.4.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.5.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.5.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/pollution_core.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage1.5.2')}</td>
</tr>
</tbody>
      `));
      page.appendChild(wrap);
      return page;
   }

   createContentPage2() {
      const page = document.createElement('div');
      page.style.cssText = 'width:100%; display:none; justify-content:center; box-sizing:border-box;';
      const wrap = this.createInstructionCard();
      const isEnglish = getLanguage() === 'en';
      const categoryWidth = isEnglish ? '18%' : '14%';
      const nameWidth = '15%';
      const imageWidth = '9%';
      const descriptionWidth = isEnglish ? '58%' : '62%';
      wrap.appendChild(this.createTable(`
<thead>
<tr>
<<<<<<< HEAD
<th style="${this.thStyle()} width:${categoryWidth};">${t('instructions.headers.category')}</th>
<th style="${this.thStyle()} width:${nameWidth};">${t('instructions.headers.name')}</th>
<th style="${this.thStyle()} width:${imageWidth};">${t('instructions.headers.image')}</th>
<th style="${this.thStyle()} width:${descriptionWidth};">${t('instructions.headers.description')}</th>
=======
<th style="${this.thStyle()} width:11%;">${t('instructions.headers.category')}</th>
<th style="${this.thStyle()} width:15%;">${t('instructions.headers.name')}</th>
<th style="${this.thStyle()} width:9%;">${t('instructions.headers.image')}</th>
<th style="${this.thStyle()} width:65%;">${t('instructions.headers.description')}</th>
>>>>>>> b531474 (saveallnewchanges)
</tr>
</thead>
<tbody>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.0.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.0.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/contentenemy.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.0.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}" rowspan="2">${t('instructions.contentPage2.1.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.1.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/door1.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.1.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.2.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/door2.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.2.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}" rowspan="2">${t('instructions.contentPage2.3.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.3.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/contentpollutedwater.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.3.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.4.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/contentwater.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.4.2')}</td>
</tr>
<tr>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.5.0')}</td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.5.1')}</td>
<td style="${this.tdStyle()}"><img src="resources/images/instructions/tools.png" style="${this.imgStyle()}"></td>
<td style="${this.tdStyle()}">${t('instructions.contentPage2.5.2')}</td>
</tr>
</tbody>
      `));
      page.appendChild(wrap);
      return page;
   }

   createControlsPage() {
      const page = document.createElement('div');
      page.style.cssText = 'width:100%; display:none; justify-content:center;';
      const controlsPanel = document.createElement('div');
      controlsPanel.style.cssText =
         'width:96%;' +
         'max-width:1080px;' +
         'min-height:590px;' +
         'display:grid;' +
         'grid-template-columns:repeat(2, minmax(0, 1fr));' +
         'grid-template-rows:repeat(2, auto);' +
         'column-gap:22px;' +
         'row-gap:18px;' +
         'padding:58px 26px 28px 26px;' +
         'box-sizing:border-box;' +
         'background-image:url("resources/images/instructions/cardX3.png");' +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'align-content:start;';

      controlsPanel.appendChild(this.createControlItem('attackmonster.gif', t('instructions.controlsPage.attackMonster')));
      controlsPanel.appendChild(this.createControlItem('energySup.gif', t('instructions.controlsPage.energySupply')));
      controlsPanel.appendChild(this.createControlItem('purifycore.gif', t('instructions.controlsPage.purifyCore')));
      controlsPanel.appendChild(this.createControlItem('rest.gif', t('instructions.controlsPage.rest')));

      page.appendChild(controlsPanel);
      return page;
   }

   createRopeMechanicsPage() {
      const page = document.createElement('div');
      page.style.cssText = 'width:100%; display:none; justify-content:center;';
      const panel = document.createElement('div');
      panel.style.cssText =
         'width:96%;' +
         'max-width:1080px;' +
         'min-height:590px;' +
         'display:flex;' +
         'justify-content:center;' +
         'align-items:center;' +
         'padding:24px 26px 28px 26px;' +
         'box-sizing:border-box;' +
         'background-image:url("resources/images/instructions/cardX3.png");' +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;';

      const ropeMechanicsItem = this.createControlItem('Ropemechanics.gif', t('instructions.controlsPage.ropeMechanics'));
      ropeMechanicsItem.style.cssText += 'width:min(500px, 100%);';
      ropeMechanicsItem.querySelector('img').style.height = '340px';
      panel.appendChild(ropeMechanicsItem);
      page.appendChild(panel);
      return page;
   }

   createControlItem(imageName, label) {
      const item = document.createElement('div');
      item.style.cssText =
         'display:flex;' +
         'flex-direction:column;' +
         'align-items:center;' +
         'justify-content:flex-start;' +
         'gap:10px;' +
         'min-height:230px;';

      const preview = document.createElement('img');
      preview.dataset.src = `resources/images/instructions/${imageName}`;
      preview.alt = label;
      preview.loading = 'lazy';
      preview.decoding = 'async';
      preview.style.cssText =
         'width:100%;' +
         'height:185px;' +
         'object-fit:contain;' +
         'flex-shrink:0;';

      const text = document.createElement('div');
      text.className = 'instructions-control-text';
      text.textContent = label;
      const controlTextSize = getLanguage() === 'zh' ? '34px' : '38px';
      text.style.cssText =
         'color:#fff;' +
         `font-size:${controlTextSize};` +
         'font-weight:600;' +
         'line-height:1.2;' +
         'text-align:center;' +
         'text-shadow:0 0 8px rgba(0,0,0,0.35);';

      item.appendChild(preview);
      item.appendChild(text);
      return item;
   }

   loadVisiblePageImages(pageIndex) {
      const page = this.pages[pageIndex - 1];
      if (!page) return;

      page.querySelectorAll('img[data-src]').forEach((img) => {
         if (!img.src) {
            img.src = img.dataset.src;
         }
      });
   }

   createTable(innerHtml) {
      const table = document.createElement('table');
      table.className = 'instructions-table';
      const tableFontSize = getLanguage() === 'zh' ? '27px' : '42px';
      table.style.cssText =
         'width:94%;' +
         'border-collapse:separate;' +
         'border-spacing:0;' +
         'table-layout:fixed;' +
         'color:white;' +
         `font-size:${tableFontSize};` +
         'margin:0 auto;';
      table.innerHTML = innerHtml;
      return table;
   }

   thStyle() {
      return 'border:0;padding:10px 8px;text-align:center;font-weight:bold;';
   }

   tdStyle() {
<<<<<<< HEAD
      return 'border:0;padding:6px 6px;text-align:center;vertical-align:middle;';
=======
      return 'border:0;padding:8px 8px;text-align:left;vertical-align:middle;';
>>>>>>> b531474 (saveallnewchanges)
   }

   imgStyle() {
      return 'display:block;margin:0 auto;max-width:48px;max-height:48px;object-fit:contain;image-rendering:pixelated;';
   }
}
