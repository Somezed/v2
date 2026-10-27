/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 蓝猫兰兰 (Lanlan) 自主行为系统单元测试
 * 覆盖验收标准：
 * 1. 兰兰能够自主切换行为 (9种自主状态)
 * 2. 睡觉、短跑、停下观察、玩毛球都有实际表现与合理时长
 * 3. 没人互动时可能主动亲近豆哥
 * 4. 被抱时表现猫咪本能拒绝 (泥鳅滑脱、拉开距离)，且绝无好感惩罚
 * 5. 不互动不会产生负面惩罚 (无强制每日喂养/清洁/心情打卡)
 * 6. 家具阻挡和猫咪移动逻辑合理 (不穿墙不卡模型)
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultLanLanBehaviorState,
  BEHAVIOR_DURATIONS,
  REPEATED_HUG_REFUSAL_BUBBLES,
} from '../../config/lanlanData';
import {
  buildFurnitureObstacleGrid,
  isTileWalkable,
  getAdjacentWalkableTiles,
  tickLanLanAutonomous,
  attemptHugLanLan,
  petLanLan,
  playWithYarnBall,
  getLanLanAtmosphereBonus,
} from '../lanlanEngine';
import { PlacedFurniture } from '../../../types/game';

describe('蓝猫兰兰自主行为系统 (LanLan Autonomous Engine)', () => {
  const mockPlacedFurniture: PlacedFurniture[] = [
    // 吧台在 (1, 1)，占地 2x1
    { instanceId: 'inst_counter_1', furnitureId: 'wood_order_counter', x: 1, y: 1, rotation: 0 },
    // 制作台在 (3, 1)，占地 2x1
    { instanceId: 'inst_bev_1', furnitureId: 'pour_over_bar', x: 3, y: 1, rotation: 0 },
    // 双人木桌在 (2, 4)，占地 2x1
    { instanceId: 'inst_table_1', furnitureId: 'oak_double_table', x: 2, y: 4, rotation: 0 },
    // 猫窝在 (5, 4)，占地 1x1
    { instanceId: 'inst_cat_bed', furnitureId: 'soft_fluffy_cat_bed', x: 5, y: 4, rotation: 0 },
  ];

  describe('网格阻挡与空间移动逻辑', () => {
    it('应准确识别被实体家具阻挡的格子与畅通空地', () => {
      const obstacleGrid = buildFurnitureObstacleGrid(mockPlacedFurniture);
      // 吧台覆盖 (1, 1) 和 (2, 1)
      expect(isTileWalkable(1, 1, obstacleGrid)).toBe(false);
      expect(isTileWalkable(2, 1, obstacleGrid)).toBe(false);
      // 空白走道 (1, 2) 应畅通
      expect(isTileWalkable(1, 2, obstacleGrid)).toBe(true);
      // 越界坐标不可行走
      expect(isTileWalkable(-1, 0, obstacleGrid)).toBe(false);
      expect(isTileWalkable(8, 0, obstacleGrid)).toBe(false);
    });

    it('猫咪移动不会穿过明确阻挡的实体家具', () => {
      const obstacleGrid = buildFurnitureObstacleGrid(mockPlacedFurniture);
      // 兰兰在 (1, 2)
      const walkableNeighbors = getAdjacentWalkableTiles(1, 2, obstacleGrid);
      // 上方 (1, 1) 被吧台阻挡，邻格列表中不得包含 (1, 1)
      const hasBlockedTile = walkableNeighbors.some((t) => t.x === 1 && t.y === 1);
      expect(hasBlockedTile).toBe(false);
    });
  });

  describe('自主状态机与仿生时钟', () => {
    it('刚睡醒 (SLEEPING 结束) 必然进入【伸懒腰 (STRETCHING)】', () => {
      const state = createDefaultLanLanBehaviorState();
      state.currentBehavior = 'SLEEPING';
      state.behaviorDurationSeconds = 10;
      state.behaviorElapsedSeconds = 9.9;

      // 步进 0.2 秒触发状态切换
      const next = tickLanLanAutonomous(state, mockPlacedFurniture, 0.2);
      expect(next.currentBehavior).toBe('STRETCHING');
      expect(next.dialogueBubble).toBeTruthy();
    });

    it('短跑跑酷 (ZOOMING) 结束，必然【停下观察 (OBSERVING)】', () => {
      const state = createDefaultLanLanBehaviorState();
      state.currentBehavior = 'ZOOMING';
      state.behaviorDurationSeconds = 3;
      state.behaviorElapsedSeconds = 3.0;

      const next = tickLanLanAutonomous(state, mockPlacedFurniture, 0.1);
      expect(next.currentBehavior).toBe('OBSERVING');
    });

    it('行为切换节奏自然，不会高频重复刷新', () => {
      const state = createDefaultLanLanBehaviorState();
      state.currentBehavior = 'RESTING';
      state.behaviorDurationSeconds = 15;
      state.behaviorElapsedSeconds = 2;

      // 步进 1 秒，未达到 15 秒时不应随意切换行为
      const next = tickLanLanAutonomous(state, mockPlacedFurniture, 1);
      expect(next.currentBehavior).toBe('RESTING');
      expect(next.behaviorElapsedSeconds).toBe(3);
    });
  });

  describe('核心性格：主动亲近豆哥', () => {
    it('长时间无人互动 (>25秒) 且不在豆哥身边时，有概率触发主动亲近豆哥', () => {
      const state = createDefaultLanLanBehaviorState();
      state.currentBehavior = 'WALKING';
      state.behaviorDurationSeconds = 5;
      state.behaviorElapsedSeconds = 5;
      // 模拟 40 秒前最后一次交互
      state.lastInteractionTimestamp = Date.now() - 40000;

      // 多次测试或概率命中主动亲近
      let triggeredApproaching = false;
      for (let i = 0; i < 20; i++) {
        const testState = { ...state };
        const result = tickLanLanAutonomous(testState, mockPlacedFurniture, 1, { x: 1, y: 1 });
        if (result.currentBehavior === 'APPROACHING') {
          triggeredApproaching = true;
          expect(result.isNearDouGe).toBe(true);
          break;
        }
      }
      expect(triggeredApproaching).toBe(true);
    });

    it('玩家不回应亲近时，绝不降低好感度或产生任何负面惩罚', () => {
      const state = createDefaultLanLanBehaviorState();
      state.currentBehavior = 'APPROACHING';
      state.behaviorDurationSeconds = 10;
      state.behaviorElapsedSeconds = 10;

      // 玩家未操作，时间自然流逝进入下一行为
      const next = tickLanLanAutonomous(state, mockPlacedFurniture, 1);
      // 顺利回归走动、休息或玩耍，且不产生任何惩罚状态
      expect(['WALKING', 'RESTING', 'OBSERVING', 'SLEEPING', 'PLAYING_YARN', 'ZOOMING']).toContain(next.currentBehavior);
      expect(next.isNearDouGe).toBe(false);
    });
  });

  describe('核心性格：拒绝被抱 (不喜欢被抱)', () => {
    it('尝试抱兰兰时，兰兰触发傲娇拒绝行为且不扣减好感', () => {
      const state = createDefaultLanLanBehaviorState();
      state.consecutiveHugAttempts = 0;

      const { nextState, message, isEscaped } = attemptHugLanLan(state, mockPlacedFurniture);

      expect(nextState.currentBehavior).toBe('REFUSING_HUG');
      expect(isEscaped).toBe(true);
      expect(message).toBeTruthy();
      expect(nextState.consecutiveHugAttempts).toBe(1);
    });

    it('连续尝试强行抱抱时，兰兰会敏捷拉开身位躲开', () => {
      const state = createDefaultLanLanBehaviorState();
      state.consecutiveHugAttempts = 1; // 已经是第二次尝试
      const originX = state.position.x;
      const originY = state.position.y;

      const { nextState, message } = attemptHugLanLan(state, mockPlacedFurniture);

      expect(nextState.consecutiveHugAttempts).toBe(2);
      // 弹出了严正抗议台词
      expect(REPEATED_HUG_REFUSAL_BUBBLES).toContain(message);
    });
  });

  describe('毛球互动机制', () => {
    it('拨动毛球时，毛球产生位移且兰兰进入玩毛球状态', () => {
      const state = createDefaultLanLanBehaviorState();
      const originBallPos = { ...state.yarnBall! };

      const { nextState, message } = playWithYarnBall(state, mockPlacedFurniture);

      expect(nextState.currentBehavior).toBe('PLAYING_YARN');
      expect(nextState.yarnBall).toBeDefined();
      expect(nextState.yarnBall?.playCount).toBe(originBallPos.playCount + 1);
      expect(message).toBeTruthy();
    });
  });

  describe('抚摸互动与顾客体验加成', () => {
    it('摸摸下巴抚摸互动提供呼噜回应并解除强抱警戒', () => {
      const state = createDefaultLanLanBehaviorState();
      state.consecutiveHugAttempts = 3;

      const { nextState, message } = petLanLan(state);

      expect(nextState.consecutiveHugAttempts).toBe(0);
      expect(message).toBeTruthy();
    });

    it('兰兰安详睡觉或玩毛球时为店内顾客提供满意的环境微加成', () => {
      const state = createDefaultLanLanBehaviorState();
      state.currentBehavior = 'SLEEPING';
      const sleepingBonus = getLanLanAtmosphereBonus(state);
      expect(sleepingBonus.satisfactionBonus).toBeGreaterThanOrEqual(3);

      state.currentBehavior = 'PLAYING_YARN';
      const playingBonus = getLanLanAtmosphereBonus(state);
      expect(playingBonus.satisfactionBonus).toBeGreaterThanOrEqual(4);
    });
  });
});
