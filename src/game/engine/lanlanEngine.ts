/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 蓝猫兰兰 (Lanlan) 自主行为核心引擎
 * 职责：
 * 1. 九大自主行为状态机驱动 (睡眠、伸懒腰、揣手休息、走动、短跑跑酷、停下观察、主动亲近、玩毛球、拒绝被抱)
 * 2. 8×6 店铺网格无障碍阻挡检测与合理移动 (避开实体家具碰撞)
 * 3. 仿生节奏控制：状态停留时间自然，杜绝高频机械动画
 * 4. 主动亲近机制：长时间无人理会时主动靠近豆哥蹭裤腿，无惩罚
 * 5. 拒绝被抱机制：傲娇扭动滑脱或敏捷跳开，连续强抱时拉开身位
 * 6. 毛球玩具物理位移与爪击玩耍机制
 * 7. 书咖顾客舒适度微加成 (非强制打卡、非纯赚钱工具)
 */

import {
  LanLanAutonomousState,
  LanLanBehavior,
  PlacedFurniture,
  YarnBallEntity,
} from '../../types/game';
import {
  GRID_COLS,
  GRID_ROWS,
  FURNITURE_CATALOG,
  getRotatedDimensions,
} from './layoutEngine';
import {
  BEHAVIOR_DURATIONS,
  LANLAN_BEHAVIOR_BUBBLES,
  REPEATED_HUG_REFUSAL_BUBBLES,
  PETTING_BUBBLES,
  createDefaultLanLanBehaviorState,
} from '../config/lanlanData';

/**
 * 构建 8×6 空间网格碰撞阻挡矩阵
 * true = 被实体家具阻挡，不可行走；false = 畅通空地
 */
export function buildFurnitureObstacleGrid(placedFurniture: PlacedFurniture[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => false)
  );

  for (const placed of placedFurniture) {
    const item = FURNITURE_CATALOG[placed.furnitureId];
    if (!item) continue;

    // 获取旋转后的占用尺寸
    const { w, h } = getRotatedDimensions(item, placed.rotation);

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const gx = placed.x + dx;
        const gy = placed.y + dy;
        if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS) {
          // 毛球垫或羊毛小地毯允许猫咪走在上面，实体大桌柜则阻挡
          if (item.category !== 'CAT_ZONE' || item.id !== 'yarn_scratching_mat') {
            grid[gy][gx] = true;
          }
        }
      }
    }
  }

  return grid;
}

/**
 * 校验某网格坐标是否合法且未被阻挡
 */
export function isTileWalkable(x: number, y: number, obstacleGrid: boolean[][]): boolean {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
  return !obstacleGrid[y][x];
}

/**
 * 获取某个坐标周围的可行空格子
 */
export function getAdjacentWalkableTiles(
  x: number,
  y: number,
  obstacleGrid: boolean[][]
): { x: number; y: number }[] {
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  const valid: { x: number; y: number }[] = [];
  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (isTileWalkable(nx, ny, obstacleGrid)) {
      valid.push({ x: nx, y: ny });
    }
  }
  return valid;
}

/**
 * 查找距离目标最近的未阻挡格子
 */
export function findNearestWalkableTile(
  targetX: number,
  targetY: number,
  obstacleGrid: boolean[][]
): { x: number; y: number } {
  if (isTileWalkable(targetX, targetY, obstacleGrid)) {
    return { x: targetX, y: targetY };
  }

  for (let r = 1; r <= 3; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = targetX + dx;
        const ny = targetY + dy;
        if (isTileWalkable(nx, ny, obstacleGrid)) {
          return { x: nx, y: ny };
        }
      }
    }
  }

  // 兜底返回原点或 (1, 1)
  return { x: 1, y: 1 };
}

/**
 * 随机获取某行为的状态台词气泡
 */
export function getRandomBubbleForBehavior(behavior: LanLanBehavior): string {
  const list = LANLAN_BEHAVIOR_BUBBLES[behavior] || ['呼噜噜~'];
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

/**
 * 检查店内是否有猫咪设施 (猫窝、猫爬架、毛球垫)
 */
export function findCatFacilityPositions(placedFurniture: PlacedFurniture[]): {
  beds: { x: number; y: number }[];
  trees: { x: number; y: number }[];
  yarnMats: { x: number; y: number }[];
} {
  const beds: { x: number; y: number }[] = [];
  const trees: { x: number; y: number }[] = [];
  const yarnMats: { x: number; y: number }[] = [];

  for (const f of placedFurniture) {
    if (f.furnitureId === 'soft_fluffy_cat_bed') {
      beds.push({ x: f.x, y: f.y });
    } else if (f.furnitureId === 'sisal_cat_tree') {
      trees.push({ x: f.x, y: f.y });
    } else if (f.furnitureId === 'yarn_scratching_mat') {
      yarnMats.push({ x: f.x, y: f.y });
    }
  }

  return { beds, trees, yarnMats };
}

/**
 * 自主推进与行为切换核心时钟 (Tick)
 * @param currentState 当前兰兰状态
 * @param placedFurniture 当前店内家具布局
 * @param deltaSeconds 步进秒数 (营业现场以 0.5s 或 1s 步进)
 * @param douGePosition 豆哥所在的吧台坐标 (默认 x: 1, y: 1)
 */
export function tickLanLanAutonomous(
  currentState: LanLanAutonomousState,
  placedFurniture: PlacedFurniture[],
  deltaSeconds: number = 1,
  douGePosition: { x: number; y: number } = { x: 1, y: 1 }
): LanLanAutonomousState {
  const state: LanLanAutonomousState = { ...currentState };
  const obstacleGrid = buildFurnitureObstacleGrid(placedFurniture);

  // 累计当前行为已持续秒数
  state.behaviorElapsedSeconds += deltaSeconds;

  // 睡觉时长累计
  if (state.currentBehavior === 'SLEEPING') {
    state.dailySleepingMinutes += deltaSeconds / 60;
  }

  // 1. 如果还在当前行为预期持续周期内，执行微动作 (如走动位移)
  if (state.behaviorElapsedSeconds < state.behaviorDurationSeconds) {
    // WALKING: 偶数秒尝试沿可行走邻格踱步
    if (state.currentBehavior === 'WALKING' && Math.floor(state.behaviorElapsedSeconds) % 2 === 0) {
      const neighbors = getAdjacentWalkableTiles(state.position.x, state.position.y, obstacleGrid);
      if (neighbors.length > 0) {
        const nextTile = neighbors[Math.floor(Math.random() * neighbors.length)];
        state.facing = nextTile.x >= state.position.x ? 'RIGHT' : 'LEFT';
        state.position = nextTile;
      }
    }

    // ZOOMING: 短跑冲刺，每步沿直线加速推进 1-2 格
    if (state.currentBehavior === 'ZOOMING' && state.targetPosition) {
      if (state.position.x !== state.targetPosition.x || state.position.y !== state.targetPosition.y) {
        const stepX = Math.sign(state.targetPosition.x - state.position.x);
        const stepY = Math.sign(state.targetPosition.y - state.position.y);
        const nx = state.position.x + stepX;
        const ny = state.position.y + stepY;
        if (isTileWalkable(nx, ny, obstacleGrid)) {
          state.facing = stepX < 0 ? 'LEFT' : 'RIGHT';
          state.position = { x: nx, y: ny };
        }
      }
    }

    // PLAYING_YARN: 毛球若在附近，产生轻微弹跳
    if (state.currentBehavior === 'PLAYING_YARN' && state.yarnBall) {
      if (Math.random() < 0.25) {
        // 毛球被爪子拍向周围空格子
        const ballNeighbors = getAdjacentWalkableTiles(state.yarnBall.x, state.yarnBall.y, obstacleGrid);
        if (ballNeighbors.length > 0) {
          const nextBallTile = ballNeighbors[Math.floor(Math.random() * ballNeighbors.length)];
          state.yarnBall = {
            ...state.yarnBall,
            x: nextBallTile.x,
            y: nextBallTile.y,
            lastBattedTimestamp: Date.now(),
            playCount: state.yarnBall.playCount + 1,
            isMoving: true,
          };
          // 兰兰转向毛球方向
          state.facing = nextBallTile.x >= state.position.x ? 'RIGHT' : 'LEFT';
        }
      }
    }

    return state;
  }

  // 2. 当前行为自然结束，根据环境与兰兰自主性格，智能决策下一个行为
  const now = Date.now();
  const timeSincePlayerInteraction = (now - state.lastInteractionTimestamp) / 1000;
  const facilities = findCatFacilityPositions(placedFurniture);

  let nextBehavior: LanLanBehavior = 'RESTING';
  let nextTarget: { x: number; y: number } | null = null;
  state.isNearDouGe = false;

  // 规则 A：刚睡醒 (SLEEPING 结束) 必然进入【伸懒腰 (STRETCHING)】舒展筋骨！
  if (state.currentBehavior === 'SLEEPING') {
    nextBehavior = 'STRETCHING';
  }
  // 规则 B：伸懒腰结束，大概率进入【揣手休息 (RESTING)】或【自由走动 (WALKING)】
  else if (state.currentBehavior === 'STRETCHING') {
    nextBehavior = Math.random() < 0.6 ? 'RESTING' : 'WALKING';
  }
  // 规则 C：短跑跑酷 (ZOOMING) 结束，必定【停下观察 (OBSERVING)】好奇四顾！
  else if (state.currentBehavior === 'ZOOMING') {
    nextBehavior = 'OBSERVING';
    // 随机调头观察
    state.facing = state.facing === 'LEFT' ? 'RIGHT' : 'LEFT';
  }
  // 规则 D：好久没人理会兰兰 (>25秒) 且当前不在豆哥身边，有较高概率【主动亲近 (APPROACHING)】豆哥！
  else if (timeSincePlayerInteraction > 25 && Math.random() < 0.45) {
    nextBehavior = 'APPROACHING';
    // 寻路走向豆哥吧台附近的未阻挡格子
    const douGeSpot = findNearestWalkableTile(douGePosition.x, douGePosition.y + 1, obstacleGrid);
    nextTarget = douGeSpot;
    state.position = douGeSpot;
    state.isNearDouGe = true;
    state.facing = douGeSpot.x < douGePosition.x ? 'RIGHT' : 'LEFT';
  }
  // 规则 E：店内有毛球且距离近时，兰兰有较高几率自主【玩毛球 (PLAYING_YARN)】
  else if (state.yarnBall && Math.random() < 0.3) {
    nextBehavior = 'PLAYING_YARN';
    // 踱步到毛球相邻格子
    const ballSpot = findNearestWalkableTile(state.yarnBall.x, state.yarnBall.y, obstacleGrid);
    state.position = ballSpot;
    state.facing = state.yarnBall.x >= state.position.x ? 'RIGHT' : 'LEFT';
  }
  // 规则 F：店内摆放了羊羔绒猫窝或猫爬架，兰兰有 40% 几率踱步过去【睡懒觉 (SLEEPING)】
  else if ((facilities.beds.length > 0 || facilities.trees.length > 0) && Math.random() < 0.4) {
    nextBehavior = 'SLEEPING';
    const targetFacility = facilities.beds.length > 0
      ? facilities.beds[Math.floor(Math.random() * facilities.beds.length)]
      : facilities.trees[0];
    const walkTile = findNearestWalkableTile(targetFacility.x, targetFacility.y, obstacleGrid);
    state.position = walkTile;
  }
  // 规则 G：偶发突然短跑起飞 (ZOOMING)！
  else if (Math.random() < 0.16) {
    nextBehavior = 'ZOOMING';
    // 寻找一条直线 2-3 格的冲刺终点
    const directions = [
      { dx: 2, dy: 0 },
      { dx: -2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: 0, dy: -2 },
    ];
    for (const dir of directions) {
      const zx = state.position.x + dir.dx;
      const zy = state.position.y + dir.dy;
      if (isTileWalkable(zx, zy, obstacleGrid)) {
        nextTarget = { x: zx, y: zy };
        break;
      }
    }
    if (!nextTarget) {
      nextBehavior = 'WALKING';
    }
  }
  // 规则 H：常规自主行为切换 (在 休息、走动、观察 之间加权分配)
  else {
    const roll = Math.random();
    if (roll < 0.4) {
      nextBehavior = 'RESTING';
    } else if (roll < 0.75) {
      nextBehavior = 'WALKING';
    } else {
      nextBehavior = 'OBSERVING';
    }
  }

  // 设定新行为时长与气泡台词
  const durationCfg = BEHAVIOR_DURATIONS[nextBehavior];
  const duration = durationCfg.min + Math.random() * (durationCfg.max - durationCfg.min);

  state.currentBehavior = nextBehavior;
  state.behaviorDurationSeconds = Math.round(duration * 10) / 10;
  state.behaviorElapsedSeconds = 0;
  state.targetPosition = nextTarget;
  state.dialogueBubble = getRandomBubbleForBehavior(nextBehavior);
  state.bubbleExpiresTimestamp = Date.now() + 6500;

  return state;
}

/**
 * 玩家尝试抱起兰兰 (触发核心性格：不喜欢被抱！)
 * 兰兰可能躲开、扭动或跳下，显示猫咪真实抗拒性格反馈。
 * 严禁玩家连续强迫抱抱：连续尝试时兰兰会短跑拉开距离。
 * 不设任何负面惩罚或好感度损失。
 */
export function attemptHugLanLan(
  currentState: LanLanAutonomousState,
  placedFurniture: PlacedFurniture[]
): {
  nextState: LanLanAutonomousState;
  message: string;
  isEscaped: boolean;
} {
  const state: LanLanAutonomousState = { ...currentState };
  const obstacleGrid = buildFurnitureObstacleGrid(placedFurniture);

  state.consecutiveHugAttempts += 1;
  state.lastInteractionTimestamp = Date.now();
  state.currentBehavior = 'REFUSING_HUG';
  state.behaviorDurationSeconds = BEHAVIOR_DURATIONS.REFUSING_HUG.min;
  state.behaviorElapsedSeconds = 0;

  let bubble = '';

  // 如果玩家连续尝试抱抱 >= 2 次，兰兰身手敏捷地小跑躲开 1-2 格！
  if (state.consecutiveHugAttempts >= 2) {
    const neighbors = getAdjacentWalkableTiles(state.position.x, state.position.y, obstacleGrid);
    if (neighbors.length > 0) {
      const escapeTile = neighbors[Math.floor(Math.random() * neighbors.length)];
      state.position = escapeTile;
      state.facing = escapeTile.x < state.position.x ? 'LEFT' : 'RIGHT';
    }
    const repeatedBubbles = REPEATED_HUG_REFUSAL_BUBBLES;
    bubble = repeatedBubbles[Math.floor(Math.random() * repeatedBubbles.length)];
  } else {
    // 首次尝试抱抱：展现“猫是流动的”泥鳅般滑脱动画与俏皮台词
    const normalBubbles = LANLAN_BEHAVIOR_BUBBLES.REFUSING_HUG;
    bubble = normalBubbles[Math.floor(Math.random() * normalBubbles.length)];
  }

  state.dialogueBubble = bubble;
  state.bubbleExpiresTimestamp = Date.now() + 5000;

  return {
    nextState: state,
    message: bubble,
    isEscaped: true,
  };
}

/**
 * 玩家主动抚摸兰兰 (摸摸下巴/脑袋)
 * 纯治愈陪伴，兰兰发出小马达呼噜声，无强制数值任务
 */
export function petLanLan(
  currentState: LanLanAutonomousState
): {
  nextState: LanLanAutonomousState;
  message: string;
} {
  const state: LanLanAutonomousState = { ...currentState };
  state.consecutiveHugAttempts = 0;
  state.lastInteractionTimestamp = Date.now();

  const bubble = PETTING_BUBBLES[Math.floor(Math.random() * PETTING_BUBBLES.length)];
  state.dialogueBubble = bubble;
  state.bubbleExpiresTimestamp = Date.now() + 5500;

  // 如果原本处于拒绝被抱或惊吓状态，安抚后转为揣手舒适休息
  if (state.currentBehavior === 'REFUSING_HUG') {
    state.currentBehavior = 'RESTING';
    state.behaviorElapsedSeconds = 0;
  }

  return {
    nextState: state,
    message: bubble,
  };
}

/**
 * 玩家或兰兰拨动毛球玩具
 * 毛球产生弹跳位移，兰兰进入兴致勃勃的玩耍状态
 */
export function playWithYarnBall(
  currentState: LanLanAutonomousState,
  placedFurniture: PlacedFurniture[]
): {
  nextState: LanLanAutonomousState;
  message: string;
} {
  const state: LanLanAutonomousState = { ...currentState };
  const obstacleGrid = buildFurnitureObstacleGrid(placedFurniture);

  state.consecutiveHugAttempts = 0;
  state.lastInteractionTimestamp = Date.now();

  // 若尚未初始化毛球，就放置在兰兰身旁空地
  let ball = state.yarnBall;
  if (!ball) {
    const nearby = findNearestWalkableTile(state.position.x + 1, state.position.y, obstacleGrid);
    ball = {
      id: `yarn_${Date.now()}`,
      x: nearby.x,
      y: nearby.y,
      lastBattedTimestamp: Date.now(),
      playCount: 1,
      isMoving: true,
    };
  } else {
    // 毛球受到拍打，向邻近未阻挡空格滚动 1 格
    const neighbors = getAdjacentWalkableTiles(ball.x, ball.y, obstacleGrid);
    if (neighbors.length > 0) {
      const nextTile = neighbors[Math.floor(Math.random() * neighbors.length)];
      ball = {
        ...ball,
        x: nextTile.x,
        y: nextTile.y,
        lastBattedTimestamp: Date.now(),
        playCount: ball.playCount + 1,
        isMoving: true,
      };
    }
  }

  state.yarnBall = ball;
  state.currentBehavior = 'PLAYING_YARN';
  state.behaviorDurationSeconds = BEHAVIOR_DURATIONS.PLAYING_YARN.min + 4;
  state.behaviorElapsedSeconds = 0;
  state.facing = ball.x >= state.position.x ? 'RIGHT' : 'LEFT';

  const bubbles = LANLAN_BEHAVIOR_BUBBLES.PLAYING_YARN;
  const bubble = bubbles[Math.floor(Math.random() * bubbles.length)];
  state.dialogueBubble = bubble;
  state.bubbleExpiresTimestamp = Date.now() + 5500;

  return {
    nextState: state,
    message: bubble,
  };
}

/**
 * 顾客体验加成估算：
 * 兰兰在店内睡觉打呼噜或玩毛球时，给在场顾客带来温馨治愈感 (+2~+4 满意度微加成)
 * 但绝非自动印钞机，无挂机打卡压力
 */
export function getLanLanAtmosphereBonus(state: LanLanAutonomousState): {
  satisfactionBonus: number;
  tipChanceBonus: number;
  atmosphereNote: string;
} {
  if (state.currentBehavior === 'SLEEPING') {
    return {
      satisfactionBonus: 3,
      tipChanceBonus: 0.04,
      atmosphereNote: '蓝猫正蜷成毛球打呼噜，满屋治愈安详 (+3 阅读满意度)',
    };
  }

  if (state.currentBehavior === 'PLAYING_YARN') {
    return {
      satisfactionBonus: 4,
      tipChanceBonus: 0.06,
      atmosphereNote: '蓝猫活泼扑抓毛球，引得顾客忍俊不禁 (+4 体验满意度)',
    };
  }

  if (state.currentBehavior === 'APPROACHING') {
    return {
      satisfactionBonus: 2,
      tipChanceBonus: 0.03,
      atmosphereNote: '蓝猫在吧台蹭着豆哥裤腿，店内其乐融融',
    };
  }

  return {
    satisfactionBonus: 1,
    tipChanceBonus: 0.01,
    atmosphereNote: '蓝猫在书咖自在生活，环境温馨',
  };
}
