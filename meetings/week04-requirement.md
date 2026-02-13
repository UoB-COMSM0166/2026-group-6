# 1. Stakeholders
- Player
- Game Designer
- Game Developer
- Tester
- Course instructor

# 2. Epics & User Stories
## Epic 1：Purification-based Core Gameplay and Progression
#### User Story 1: 
As a player, I want to be able to quit the game or die without losing critical progress, so that I can handle real-life interruptions and feel encouraged to retry challenges.

Acceptance Criteria:
Given the player quits the game or dies, when the game is resumed or reloaded, then the player respawns at the most recent purification checkpoint, and all previously purified areas remain purified, and all unlocked abilities are retained.

#### User Story 2:
As a player, I want purification energy to be limited, so that I must make meaningful decisions about when and where to purify the environment.

Acceptance Criteria:
Given purification actions and rope-based abilities consume purification energy, when the player uses these abilities repeatedly, then the available purification energy is reduced, and the player must choose between purifying, exploring further, or retreating to recover resources.

#### User Story 3:
As a player, I want to experience non-lethal failure states, so that mistakes create tension without immediately ending my progress.

Acceptance Criteria:
Given the player accumulates high corruption or runs out of purification energy,when continuing exploration then the player is forced to retreat, reroute, or recover and progress is not reset through immediate death.

## Epic 2：Rope Tools and Environmental Interaction
#### User Story 3:
As a game designer, I want players to unlock new purification or rope-related abilities over time, so that they feel a clear sense of progression throughout the game.

Acceptance Criteria:
Given the player purifies a pollution core in an area, when purification is completed, then a new purification-related or rope-based ability is unlocked.

#### User Story 4:
As a game designer, I want rope-based mechanics to replace traditional weapons, so that core gameplay feels creative and non-violent.

Acceptance Criteria:
Given the player uses rope tools, when interacting with polluted enemies or environmental objects, then purification, traversal, or puzzle-solving can be performed without using traditional weapons.

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
As a player, I want purification progress to continuously change the environment and provide clear feedback, so that exploration feels fresh and my actions feel meaningful.

Acceptance Criteria:
Given an area’s pollution level decreases, when purification progress is made, then environmental elements change to reflect the new world state, and visual feedback is clearly presented (e.g. reduced fog, cleaner colors, restored visibility).

#### User Story 8:
As a player, I want the overall level of world purification and the amount of collected fuel to affect the game’s ending and final score, so that my approach to exploration feels meaningful.

Acceptance Criteria:
Given different levels of total world purification and fuel collected, when the player returns to the ship or completes the final objective, then the game’s ending reflects the player’s purification progress, and the final score is calculated based on the amount of fuel collected.

## Epic 5: System Consistency and Testability
#### User Story 10:
As a game developer, I want core gameplay systems to be modular and loosely coupled, so that features can be implemented, tested, and modified without affecting unrelated systems.

Acceptance Criteria:
Given a core gameplay system is modified, when changes are applied, then other unrelated systems continue to function correctly.

#### User Story 11:
As a tester, I want mechanics to follow understandable rules, so that player actions produce predictable outcomes.

Acceptance Criteria: 
Given the player interacts with the environment, when an action is performed, then the outcome follows consistent and understandable rules.

## Epic 6: Assessment, Documentation and Course Requirements
#### User Story 12
As a course instructor, I want the project requirements and outcomes to be clearly documented, so that the game can be assessed fairly and consistently.

Acceptance Criteria:
Given the project repository is reviewed for assessment, when assessment begins, then documented epics and user stories can be clearly identified and related to implemented features.
