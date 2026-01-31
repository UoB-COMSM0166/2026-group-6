
# Game List 

 - [1. Adventure Puzzle-Solving](#1-Adventure-Puzzle-Solving)
 - [2. Top-down Exploration Puzzle Game](#2-top-down-exploration-puzzle-game)
 - [3. ROGUE(Rogue-lite)](#3-ROGUE-Rogue-lite)
 - [4. Simulation](#4-Simulation)
 - [5. Puzzle RPG](#5-Puzzle-RPG)
 - [6. Pixel-style horror puzzle game](#6-Pixel-style-horror-puzzle-game)

---


# 1 Adventure Puzzle-Solving
## Inspiration:
Limbo
## Core Features:
- **Side-scrolling camera**  
  The map environment will gradually become visible as the player progresses.
- **Time-based dream collapse system**  
  As time goes by, each level will become increasingly unstable. Platforms may collapse, disappear, or become unsafe.
- **Key collection and exit system**  
  Players must collect a key in each level to unlock the exit and escape the dream.
- **Chase sequences**  
  In some levels, monsters will appear and chase the player.
## Optional Features:
- **Environmental storytelling**  
  The changes in the environment reflect the changes in dreams.
- **Difficulty scaling between levels**  
  More complex chase sections will appear in later levels.

---

# 2 Top-down Exploration Puzzle Game
## Inspiration
- Among Us
- Goose Goose Duck

## Core Features
#### Top-down navigation
Players control a character moving through interconnected rooms and corridors from a top-down perspective.
#### Limited visibility (Fog of War)
The map is initially hidden. Only areas near the player gradually become visible as they explore.
#### Procedurally generated maps
Each level layout is randomly generated to encourage replayability and exploration.
#### Key collection and exit system
Players must locate a key within the level before returning to the locked exit to complete the stage.
#### Resource-aware exploration (sustainability theme)
Visibility or movement is treated as a limited resource, encouraging players to plan efficient routes and avoid unnecessary exploration.

## Optional Features
#### Energy system
Movement or exploration consumes energy, reducing visibility when resources are low.
#### Scoring system
Players are rewarded for completing levels using fewer steps or less energy.
#### Environmental storytelling
Lighting, power systems, or environmental details visually reflect resource scarcity and sustainability themes.

---



# 3 ROGUE (Rogue-lite)
## Inspiration:
- Brotato
- Vampire Survivors

## Core Features:
- Top-down 2D movement
- Random enemy spawning
- Enemies move towards the player (melee damage)
- Auto-aim and auto-shoot nearest enemy
- 2 difficulty modes (easy / hard)
- 2 ranged weapons (SMG, Shotgun)
- Health system (damage, death, game over)
- Fixed total stat points (speed, HP, damage, fire-rate)

## Optional Features:
- Bullet modifiers (piercing, bouncing)
- Ranged enemies (hard mode)
- Random trees / destructible objects with healing
- Difficulty scaling over time

---

# 4 Simulation

## Inspiration

### city building & business simulation & strategy game

- example: city skyline

note: **AI controls** citizens' actions to bring a sense of accomplishment to players in city construction. How to make game AI always operate correctly and reasonably in a complex environment is a challenge. The design of diverse and multi-functional facilities brings **freedom and freshness** to the game.

- example: frostpunk

note: Reasonably allocate **limited resources and funds** in a harsh environment to meet the needs of citizens with maximum efficiency and achieve growth and development. It is very challenging to rationally design the overall complex system of map resources, facilities, and various policy options.

- example:Overcooked

note: To implement the interaction of kitchen items using a **physics engine**, it is necessary to precisely set the collision volume of cookware, the trajectory of ingredient throwing, and the judgment of falling. **Data structure design and AI generation** design for management systems such as **order generation and timeout.**

---

# 5 Puzzle RPG
Tower of the Sorcerer

---

# 6 Pixel-style horror puzzle game

## Inspriation
Rust Lake, the Stanley Parable, "Solomen Grundy"
## Style 
2D, pixel, room, single game, puzzle game
## Player Action
- move(up/down/left/right)
- collect memory/ interact with objects/ avoid traps and monsters/ solve the puzzle to next level
## Core Design
- Maps including seven levels,means 7 days of the life enjoury. If everytime goes correct, the map changes to the next level, until level seven is over, go back to level 1, meaning hopeless circle.
- Player has the right to name themselves however we still give the possibility to remain empty name as an signal of freedom, making player feels that they are full of choices at the beginning.
## Seven days and seven levels
- Monday: just name and show in the level 1 and using videos/words/music to introduce the game and rules.
- Tuesday: [objects system]colloct objects and interact with them.
- Wednesday: [add choices model]different sequences but same items will cause different outcomes. This emphasizes the importance of making right and good choices, fully instills a sense of rule awareness to all the players.
- Thursday: [add traps and monsters] Set up traps and monsters to force players to collect the necessary items for moving to the next level through only one path and avoid all the monsters. The actual purpose is to ensure that players will step on the traps and automatically advance to the next level. Hard level: 1. A non-touchable item will start appearing from this level but cannot be obtained.
- Friday: same as Thursday but more difficult to pass to level six. Hard level 2.
- Saturday: same, Hard level 3. Unable to aviod death.
- Sunday: non-touchable item appearing again but can only be obtained until second play time. The entire cycle is actually a person's entire life. So, sometimes it's not that making the right choice will bring about a change. However, we hope to never lose the courage and determination to do what you want, even though life has only one destination but the journey might have so different and fancy memories, slight change means the possiblity of big changes.



