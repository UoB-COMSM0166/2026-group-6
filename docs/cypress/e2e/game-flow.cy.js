describe('Black-Box: Game UI and Flow Tests', () => {
  
  beforeEach(() => {
    // 1. Access the local game link
    cy.visit('http://127.0.0.1:5500/docs/index.html'); 

    // 2. This is the initial cover screen. Click anywhere on the Canvas to trigger `storyStarted = true`.
    cy.get('canvas.p5Canvas').click();

    // 3. The game enters the story interface (StoryIntro).
    cy.get('canvas.p5Canvas').click(930, 47);

    // 4. The demo video plays at this point; click the video to skip it.
    cy.get('video').click();

    // 5. Ensure that after skipping the video, the game successfully reaches the main menu.
    cy.get('#game-menu').should('be.visible');
  });

  it('Test Case 1: Successfully load the main menu and click "Start Game" to enter the game', () => {
    // Locate the button labeled "Start Game" and click it.
    cy.get('#menu-main-panel').contains('Start Game').click();

    // Verify the menu is hidden after clicking, entering the game state
    cy.get('#game-menu').should('not.be.visible');
    
    // Verify the core canvas exists (indicating it hasn't crashed)
    cy.get('canvas.p5Canvas').should('exist');
  });

  it('Test Case 2: Able to open the difficulty selection page and change the difficulty', () => {
    cy.contains('Choose Difficulty').click();
    
    // Verify the difficulty panel appears
    cy.get('#menu-difficulty-panel').should('be.visible');
    
    // Click the Hard difficulty
    cy.contains('Hard').click();
    
    // Verify the button scaling effect after clicking (via transform scale)
    cy.contains('Hard').should('have.css', 'transform', 'matrix(1.02, 0, 0, 1.02, 0, 0)');
    
    // Click Back to return to the main menu
    cy.get('#menu-back-btn').click();
    cy.get('#menu-main-panel').should('be.visible');
  });

  it('Test Case 3: Able to call up the resource panel in-game by pressing the C key', () => {
    cy.contains('Start Game').click();
    cy.get('#game-menu').should('not.be.visible');

    // 1. Allow the game engine some initialization time (500 ms)
    cy.wait(500);

    // 2. Simulate the player pressing the 'c' key on the keyboard
    cy.get('body').type('c');

    // 3. Use Cypress's recommended chaining to safely penetrate and check internal variables
    cy.window()
      .its('gm.player.resourcePanel.visible')
      .should('be.true');
  });

  it('Test Case 4: Verify the player jump physics response (avoiding issues with pressing keys too fast)', () => {
    cy.contains('Start Game').click();
    cy.wait(500);

    // Jumping (W) is event-driven, so type('w') will definitely be accurately captured
    cy.get('body').type('w');

    // Use a safe chained call to check if vy becomes negative due to jumping
    cy.window().then((win) => {
      expect(win.gm.player.vy).to.be.lessThan(0);
    });
  });

  it('Test Case 5: Mouse click on the canvas fires the left-click rope (resolving overlay blocking)', () => {
    cy.contains('Start Game').click();
    cy.wait(500);

    // Break through the intro-fx effect layer blockage with z-index: 2
    cy.get('canvas.p5Canvas').click('topRight', { force: true });

    // Use the safe .its() for assertions; if the state hasn't updated, it will automatically retry for a bit
    cy.window()
      .its('gm.player.ropeL.state')
      .should('not.equal', 'IDLE');
  });

  it('Test Case 6: Test global large map logic (directly verifying the core function)', () => {
    cy.contains('Start Game').click();
    cy.wait(500);

    cy.window().then((win) => {
       // Simulate the code that is actually executed inside the game when the M key is pressed
       win.gm.level.drawLargeMap(win.gm.player, win.gm);
       
       // At this point, mapOpen must be set to true
       expect(win.gm.level.mapOpen).to.be.true;
    });
  });

  it('Test Case 7: Main menu audio settings panel (pure DOM interaction verification)', () => {
    // This test doesn't require entering the game; just click "Audio Settings" directly in the main menu
    cy.contains('Audio Settings').click();
    
    // Verify if the audio panel slides out
    cy.get('#menu-audio-panel').should('be.visible');

    // Click the BGM mute button
    cy.get('#bgm-mute-btn').click();
    
    // Verify if the mute icon toggles correctly
    cy.get('#bgm-mute-btn').should('have.text', '🔇');
    
    // Simulate the player dragging the volume slider to 20%
    cy.get('#bgm-volume-slider')
      .invoke('val', 0.2)
      .trigger('input');
    
    // Verify if the Back button on the settings panel can successfully return
    cy.get('#menu-back-btn').click();
    cy.get('#menu-main-panel').should('be.visible');
  });

  it('Test Case 8: Instructions/Help screen pagination function', () => {
    cy.contains('Instructions').click();
    
    // Verify the Instructions panel appears
    cy.get('#menu-instructions-panel').should('be.visible');

    // Verify it is currently on the first page (content introduction)
    cy.get('#menu-content-btn').should('be.visible');

    // Click the "Next Page" arrow in the bottom right corner
    cy.get('#menu-next-page-btn').click();

    // Can further assert that the pagination logic did not cause a crash
    cy.get('#menu-back-btn').click();
    cy.get('#menu-main-panel').should('be.visible');
  });
});