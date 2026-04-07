describe('Black-Box: Game UI and Flow Tests', () => {
  
  // beforeEach 会在每一个 it() 测试用例运行前执行
  // 我们在这里打一套“连招”，跳过所有前置动画，确保每个测试都从主菜单开始
  beforeEach(() => {
    // 1. 访问游戏本地链接（请确保改成你自己的 Live Server 链接）
    cy.visit('http://127.0.0.1:5500/docs/index.html'); 

    // 2. 此时是初始封面，点击 Canvas 任意位置触发 storyStarted = true
    cy.get('canvas.p5Canvas').click();

    // 3. 此时进入剧情界面 (StoryIntro)。
    // 因为 Skip 按钮是画上去的，宽 1000 高 700，Skip 按钮在 x: 890, y: 28, 宽 78, 高 38
    // 我们让机器人精准点击按钮的中心点坐标 (930, 47)
    cy.get('canvas.p5Canvas').click(930, 47);

    // 4. 此时进入演示视频播放，页面上被添加了一个 <video> 标签。
    // 因为代码里写了 demoVideo.onclick = endDemoVideo; 所以我们点击视频即可跳过
    // Cypress 会自动等待 video 元素出现，不用担心加载延迟
    cy.get('video').click();

    // 5. 确保跳过视频后，成功来到了主菜单
    cy.get('#game-menu').should('be.visible');
  });

  it('测试用例 1：成功加载主菜单并点击 Start Game 进入游戏', () => {
    // 找到包含 "Start Game" 的按钮并点击
    cy.get('#menu-main-panel').contains('Start Game').click();

    // 验证点击后菜单隐藏，进入游戏状态
    cy.get('#game-menu').should('not.be.visible');
    
    // 验证核心画布存在（说明没崩溃）
    cy.get('canvas.p5Canvas').should('exist');
  });

  it('测试用例 2：能够打开难度选择页面并修改难度', () => {
    cy.contains('Choose Difficulty').click();
    
    // 验证难度面板出现
    cy.get('#menu-difficulty-panel').should('be.visible');
    
    // 点击 Hard 难度
    cy.contains('Hard').click();
    
    // 验证点击后按钮的缩放效果 (通过 transform scale)
    cy.contains('Hard').should('have.css', 'transform', 'matrix(1.02, 0, 0, 1.02, 0, 0)');
    
    // 点击 Back 返回主菜单
    cy.get('#menu-back-btn').click();
    cy.get('#menu-main-panel').should('be.visible');
  });

  it('测试用例 3：游戏内能够通过按键 C 呼出资源面板', () => {
    cy.contains('Start Game').click();
    cy.get('#game-menu').should('not.be.visible');

    // 1. 给游戏引擎留出一点初始化时间（500毫秒）
    cy.wait(500);

    // 2. 模拟玩家按下键盘的 'c' 键
    cy.get('body').type('c');

    // 3. 使用 Cypress 推荐的链式调用，安全地穿透检查内部变量
    // its() 会自动寻找对象的深层属性，如果没找到它会智能等待重试，而不会立刻报错
    cy.window()
      .its('gm.player.resourcePanel.visible')
      .should('be.true');
  });

  it('测试用例 4：验证玩家跳跃物理响应 (规避按键过快问题)', () => {
    cy.contains('Start Game').click();
    cy.wait(500);

    // 跳跃 (W) 是事件驱动的，所以 type('w') 绝对能被准确捕捉
    cy.get('body').type('w');

    // 使用安全的链式调用检查 vy 是否因为跳跃变成了负数
    cy.window().then((win) => {
      expect(win.gm.player.vy).to.be.lessThan(0);
    });
  });

  it('测试用例 5：鼠标点击画布发射左键绳索 (解决覆盖遮挡)', () => {
    cy.contains('Start Game').click();
    cy.wait(500);

    // 突破 z-index: 2 的 intro-fx 特效层遮挡
    // { force: true } 告诉 Cypress："不要管谁挡在前面，直接在这个坐标触发点击事件！"
    cy.get('canvas.p5Canvas').click('topRight', { force: true });

    // 使用安全的 .its() 进行断言，如果状态没更新它会自动重试一小会
    cy.window()
      .its('gm.player.ropeL.state')
      .should('not.equal', 'IDLE');
  });

  it('测试用例 6：测试全局大地图逻辑 (直接验证核心函数)', () => {
    cy.contains('Start Game').click();
    cy.wait(500);

    // 既然 Cypress 极速按键无法欺骗 60FPS 的 keyIsDown() 循环
    // 在 Canvas 自动化测试中，对于持续按压的逻辑，最稳定的是直接验证其底层的业务函数
    cy.window().then((win) => {
       // 模拟按下 M 键时，游戏内部真正执行的代码
       win.gm.level.drawLargeMap(win.gm.player, win.gm);
       
       // 此时 mapOpen 必定被设置为 true
       expect(win.gm.level.mapOpen).to.be.true;
    });
  });

  it('测试用例 7：主菜单音频设置面板 (纯 DOM 交互验证)', () => {
    // 这个测试不需要进游戏，直接在主菜单点击 "Audio Settings"
    cy.contains('Audio Settings').click();
    
    // 验证音频面板是否滑出
    cy.get('#menu-audio-panel').should('be.visible');

    // 点击 BGM 静音按钮
    cy.get('#bgm-mute-btn').click();
    
    // 验证静音图标是否正确切换
    cy.get('#bgm-mute-btn').should('have.text', '🔇');
    
    // 模拟玩家拖动音量滑块到 20%
    cy.get('#bgm-volume-slider')
      .invoke('val', 0.2)
      .trigger('input');
    
    // 验证设置面板的 Back 按钮能否正常退回
    cy.get('#menu-back-btn').click();
    cy.get('#menu-main-panel').should('be.visible');
  });

  it('测试用例 8：指令/帮助界面 (Instructions) 翻页功能', () => {
    cy.contains('Instructions').click();
    
    // 验证 Instructions 面板出现
    cy.get('#menu-instructions-panel').should('be.visible');

    // 验证当前处于第一页（内容介绍）
    cy.get('#menu-content-btn').should('be.visible');

    // 点击右下角的“下一页”箭头
    cy.get('#menu-next-page-btn').click();

    // 可以进一步断言翻页逻辑没有引起崩溃
    cy.get('#menu-back-btn').click();
    cy.get('#menu-main-panel').should('be.visible');
  });
});