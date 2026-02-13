# 1. Stakeholders
- Player
- Game Designer
- Game Developer
- Tester
- Course instructor

# 2. Epics & User Stories
## Epic 1：Purification-based Core Gameplay & Progression
#### User Story 1: 
As a player, I want to quit the game at any time without losing major progress, so that I can deal with real-life interruptions.

Acceptance Criteria:
Given the player quits the game or dies,when the game is resumed, then the player respawns at the latest purification checkpoint with unlocked abilities retained.

#### User Story 2: 
As a player, I want death to be punishing but fair, so that I am willing to retry instead of quitting.

Acceptance Criteria:
Given the player dies due to corruption or damage, when the player respawns,
then previously purified areas and unlocked abilities remain unchanged.

## Epic 2：Rope Tools and Environmental Interaction
#### User Story 3:
As a game designer, I want players to feel their power growing, so that they stay engaged throughout the game.

Acceptance Criteria:
Given the player purifies the pollution core in Area A, when the purification is completed, then a new purification or rope-related ability is unlocked

#### User Story 4:
As a game designer, I want players to use rope-based mechanics instead of traditional weapons, so that gameplay feels creative.

Acceptance Criteria： 
Given the player uses rope tools, when interacting with polluted enemies or environmental objects, then purification, movement, or puzzle-solving can be performed without traditional weapons.

## Epic 3：Exploration and Area Unlocking
#### User Story 5:
As a player, I want to see locked areas early, so that I know there is more to explore later.

Acceptance Criteria:
Given the player is in Area A, when the player opens the world map, then Areas B and C are visible but marked as inaccessible.

#### User Story 6:
As a game designer, I want to control exploration through abilities, so that the world feels structured and rewarding.

Acceptance Criteria：
Given the player lacks a required ability, when approaching a gated or polluted area, then access is blocked with clear visual feedback.

## Epic 4：Feedback, World State and Multiple Endings
#### User Story 7:
As a player, I want the game to continuously introduce new changes, so that exploration does not feel boring.

Acceptance Criteria:
Given the player reduces an area’s pollution level, when purification progress is made, then environmental elements change to reflect the new state.

#### User Story 8:
As a player, I want my actions to visibly affect the environment, so that my progress feels meaningful.

Acceptance Criteria：
Given the area pollution index decreases, when the environment updates, then visual feedback such as reduced fog or cleaner colors is shown.

#### User Story 9:
As a game designer, I want the UI to clearly show danger, so that players can react in time.

Acceptance Criteria：
Given the player is attacked or contacts polluted entities, when danger occurs, then UI indicators update immediately to reflect risk or contamination.

## Epic 5: System Consistency and Testability
#### User Story 10:
As a game developer, I want core gameplay systems to be modular and loosely coupled, so that features can be implemented, tested, and modified without affecting unrelated systems.

Acceptance Criteria:
Given a core gameplay system is modified, when changes are applied, then other unrelated systems continue to function correctly.

#### User Story 11:
As a tester, I want mechanics to follow understandable rules, so that player actions produce predictable outcomes.

Acceptance Criteria: 
Given the player interacts with the environment, when an action is performed,
then the outcome follows consistent and understandable rules.

## Epic 6: Assessment, Documentation and Course Requirements
#### User Story 12
As a course instructor, I want the project requirements and outcomes to be clearly documented, so that the game can be assessed fairly and consistently.

Acceptance Criteria:
Given the project repository is reviewed for assessment, when assessment begins, then documented epics and user stories can be clearly identified and related to implemented features.
