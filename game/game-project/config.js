const GameConfig = {
    // === 世界基础设置 ===
    World: {
        GRID_SIZE: 16,      // 核心：所有尺寸的基准
        GRAVITY: 0.35,       // 全局重力
    },

    level:{
        startLevel: 4,
    },
    
    // === 玩家设置 ===
    Player: {
        MAX_HP: 20,
        SPEED: 0.5,        // 移动速度系数 (基于 GRID_SIZE)
        CLIMB_SPEED: 0.05,  // 爬绳速度系数
        WINCH_FORCE: 0.3,    // 绞盘力度
        JUMPFORCE: 5,
    },

    // === 敌人设置 ===
    Enemy: {
        SPEED: 0.5,
        JUMPFORCE: 3.5, // 敌人能跳多高（以格子数为单位）
        DROP_DEPTH_TILES: 3,     // 敢跳下去的最大深度（格子数）
    },

    // === 绳索物理 ===
    Rope: {
        STIFFNESS: 16,     // 硬度
    }
};