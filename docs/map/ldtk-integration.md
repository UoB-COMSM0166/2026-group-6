**LDtk Map Update – Integration Notes (GateWall / Pollution\_Core / Tools)**



**1. LDtk Changes**

Pollution\_Core

•	coreId (String)

Used for: cleanse a specific core → unlock related GateWalls

GateWall

•	unlockByCoreIds (String Array)

Core IDs that control this wall

•	requiredTool (Enum: ToolType, nullable)

Most walls leave this empty

•	GateWall now supports Resizable (Width / Height)

→ Collision should use the entity’s actual size

Tools

•	Added new tool type: hammer (used to break walls)

•	The claw\_hook tool is used to interact with ladders.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**2. Gameplay Logic (Required)**

2.1 Core-unlock wall (automatic)

If unlockByCoreIds is not empty:

•	When the specified core is cleansed

→ the GateWall disappears

→ no rendering and no collision

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

2.2 Tool-breakable wall

•	When the player owns the hammer

•	And the player collides with the GateWall

→ the GateWall disappears



