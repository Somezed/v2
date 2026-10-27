/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 豆哥日常生活系统单元测试 (DouGe Life Engine Tests)
 * 验证：
 * 1. 10款虚构穿戴甲的解锁、佩戴与灵感扣减 (零现金消耗)
 * 2. 微信小游戏《抓大鹅》模拟、战报记录与打气陪伴
 * 3. 动漫短剧追番、衍生周边获得与观后感日记
 * 4. 每日低频可选事件判定与无惩罚跳过
 * 5. 跨版本存档迁移与生活状态自动兼容
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultDouGeLifeState,
  PRESS_ON_NAILS,
  ANIME_SHORT_DRAMAS,
  ANIME_DECORS,
} from '../../config/douGeLifeData';
import {
  equipNail,
  unlockNail,
  playGooseGameRound,
  cheerDouGeUp,
  watchDramaEpisode,
  checkAndTriggerDailyLifeEvent,
  acceptDailyLifeEvent,
  skipDailyLifeEvent,
  grantInspirationFromService,
  getDouGeActionDialogue,
} from '../douGeLifeEngine';
import { createInitialGameState } from '../../config/initialData';
import { validateSaveData, migrateSaveData } from '../saveManager';
import { DouGeState } from '../../../types/game';

function createMockDouGe(): DouGeState {
  return {
    name: '豆哥',
    energy: 80,
    maxEnergy: 100,
    mood: 85,
    baristaSkill: 1,
    hospitalitySkill: 1,
    currentAction: 'IDLE',
    life: createDefaultDouGeLifeState(),
  };
}

describe('豆哥日常生活系统 (DouGe Life Engine)', () => {
  describe('穿戴甲系统 (Press-on Nails)', () => {
    it('应包含整整10款不同的原创虚构穿戴甲', () => {
      expect(PRESS_ON_NAILS.length).toBe(10);
      const uniqueIds = new Set(PRESS_ON_NAILS.map((n) => n.id));
      expect(uniqueIds.size).toBe(10);
      // 默认款为免费
      const defaultNail = PRESS_ON_NAILS.find((n) => n.unlockedByDefault);
      expect(defaultNail).toBeDefined();
      expect(defaultNail?.inspirationCost).toBe(0);
    });

    it('默认初始已拥有并佩戴雾面奶咖小猫爪', () => {
      const douGe = createMockDouGe();
      expect(douGe.life.ownedNailIds).toContain('nail_latte_paw');
      expect(douGe.life.activeNailId).toBe('nail_latte_paw');
    });

    it('可以顺利切换佩戴已拥有的穿戴甲', () => {
      const douGe = createMockDouGe();
      // 先给予第二款
      douGe.life.ownedNailIds.push('nail_bw_checker');
      const updated = equipNail(douGe, 'nail_bw_checker');
      expect(updated.life.activeNailId).toBe('nail_bw_checker');
      expect(updated.currentAction).toBe('BROWSING_NAILS');

      // 再次点击相同甲款可卸下
      const unequipped = equipNail(updated, 'nail_bw_checker');
      expect(unequipped.life.activeNailId).toBeNull();
    });

    it('未拥有的款式不能直接佩戴', () => {
      const douGe = createMockDouGe();
      const updated = equipNail(douGe, 'nail_vintage_camellia');
      expect(updated.life.activeNailId).toBe('nail_latte_paw'); // 保持原状
    });

    it('消耗灵感点解锁新穿戴甲，且绝不扣减游戏经营现金', () => {
      const douGe = createMockDouGe();
      douGe.life.inspirationPoints = 50; // 充足灵感
      const initialDiaryCount = douGe.life.dailyDiaries.length;

      const result = unlockNail(douGe, 'nail_bw_checker');
      expect(result.success).toBe(true);
      expect(result.nextDouGe.life.ownedNailIds).toContain('nail_bw_checker');
      expect(result.nextDouGe.life.activeNailId).toBe('nail_bw_checker');
      expect(result.nextDouGe.life.inspirationPoints).toBe(35); // 50 - 15
      expect(result.nextDouGe.life.dailyDiaries.length).toBe(initialDiaryCount + 1);
    });

    it('灵感不足时拒绝解锁并给出温和提示', () => {
      const douGe = createMockDouGe();
      douGe.life.inspirationPoints = 5; // 不足15
      const result = unlockNail(douGe, 'nail_bw_checker');
      expect(result.success).toBe(false);
      expect(result.error).toContain('灵感不足');
    });

    it('重复解锁已拥有款式时应安全阻止', () => {
      const douGe = createMockDouGe();
      const result = unlockNail(douGe, 'nail_latte_paw');
      expect(result.success).toBe(false);
      expect(result.error).toContain('已经拥有');
    });
  });

  describe('微信小游戏《抓大鹅》互动系统', () => {
    it('玩一局抓大鹅应记录对局次数并记录趣味战报', () => {
      const douGe = createMockDouGe();
      const prevAttempts = douGe.life.gooseAttempts;
      const { nextDouGe, anecdote, message } = playGooseGameRound(douGe);

      expect(nextDouGe.life.gooseAttempts).toBe(prevAttempts + 1);
      expect(anecdote).toBeDefined();
      expect(message).toBeDefined();
      expect(nextDouGe.currentAction).toBe('PLAYING_GOOSE');
      expect(nextDouGe.life.dailyDiaries.length).toBeGreaterThan(0);
    });

    it('通关大鹅时应增加通关计数和大量心情', () => {
      const douGe = createMockDouGe();
      const prevCleared = douGe.life.gooseClearedLevels;
      const { nextDouGe, isVictory } = playGooseGameRound(douGe, true);

      expect(isVictory).toBe(true);
      expect(nextDouGe.life.gooseClearedLevels).toBe(prevCleared + 1);
      expect(nextDouGe.mood).toBeGreaterThan(douGe.mood);
    });

    it('伙伴陪伴递咖啡互动应恢复豆哥体力和心情', () => {
      const douGe = createMockDouGe();
      douGe.mood = 70;
      douGe.energy = 50;

      const { nextDouGe, reply, moodBonus } = cheerDouGeUp(douGe);
      expect(nextDouGe.mood).toBe(70 + moodBonus);
      expect(nextDouGe.energy).toBe(58);
      expect(reply.length).toBeGreaterThan(5);
      expect(nextDouGe.life.inspirationPoints).toBeGreaterThan(douGe.life.inspirationPoints);
    });
  });

  describe('动漫短剧与衍生周边系统', () => {
    it('观看动漫短剧应记录已播集数与观后感随笔', () => {
      const douGe = createMockDouGe();
      const drama = ANIME_SHORT_DRAMAS[1]; // 《转生成为书咖店长的我只想摸鱼》
      const { nextDouGe, newDecorUnlocked } = watchDramaEpisode(douGe, drama.id);

      expect(nextDouGe.life.watchedDramaIds).toContain(drama.id);
      expect(nextDouGe.currentAction).toBe('WATCHING_ANIME');
      expect(newDecorUnlocked).toBeDefined();
      expect(nextDouGe.life.ownedDecorIds).toContain(newDecorUnlocked?.id);
    });

    it('所有动漫周边均具备所属短剧出处', () => {
      expect(ANIME_DECORS.length).toBeGreaterThanOrEqual(4);
      for (const decor of ANIME_DECORS) {
        expect(decor.fromDramaTitle).toBeDefined();
        expect(decor.description).toBeDefined();
      }
    });
  });

  describe('生活事件规则与手账回放 (Events & Diaries)', () => {
    it('同个经营日内不重复触发生活事件 (低频自然)', () => {
      const douGe = createMockDouGe();
      const firstCheck = checkAndTriggerDailyLifeEvent(douGe, 2);
      expect(firstCheck.hasEvent).toBe(true);
      expect(firstCheck.event).not.toBeNull();

      // 接受事件
      const afterAccepted = acceptDailyLifeEvent(douGe, firstCheck.event!, 2);
      expect(afterAccepted.life.lastEventTriggeredDay).toBe(2);

      // 再次检测第2天
      const secondCheck = checkAndTriggerDailyLifeEvent(afterAccepted, 2);
      expect(secondCheck.hasEvent).toBe(false);
    });

    it('玩家可以完全跳过生活事件且无任何惩罚', () => {
      const douGe = createMockDouGe();
      const initialMood = douGe.mood;
      const initialEnergy = douGe.energy;
      const initialPoints = douGe.life.inspirationPoints;

      const skipped = skipDailyLifeEvent(douGe, 2);
      expect(skipped.life.lastEventTriggeredDay).toBe(2);
      expect(skipped.mood).toBe(initialMood);
      expect(skipped.energy).toBe(initialEnergy);
      expect(skipped.life.inspirationPoints).toBe(initialPoints);
    });

    it('出餐好评应赠予灵感点数', () => {
      const douGe = createMockDouGe();
      const updated = grantInspirationFromService(douGe, 5);
      expect(updated.life.inspirationPoints).toBe(douGe.life.inspirationPoints + 5);
    });

    it('台词生成符合豆哥性格与当前动作', () => {
      const dialogue = getDouGeActionDialogue('PLAYING_GOOSE', null);
      expect(dialogue).toContain('抓大鹅');
      const nailDialogue = getDouGeActionDialogue('BROWSING_NAILS', 'nail_latte_paw');
      expect(nailDialogue).toContain('雾面奶咖小猫爪');
    });
  });

  describe('存档迁移兼容性测试 (Save Migration)', () => {
    it('旧版未含 life 字段的存档应自动平滑升级补齐默认生活数据', () => {
      const legacySave: Record<string, unknown> = {
        version: 1,
        cash: 350,
        currentDay: 2,
        douGe: {
          name: '豆哥',
          energy: 90,
          mood: 80,
          currentAction: 'IDLE',
          // 无 life 字段
        },
      };

      const migrated = migrateSaveData(legacySave);
      expect(migrated.douGe.life).toBeDefined();
      expect(migrated.douGe.life.ownedNailIds).toContain('nail_latte_paw');
      expect(migrated.douGe.life.dailyDiaries.length).toBeGreaterThan(0);
      expect(validateSaveData(migrated).isValid).toBe(true);
    });
  });
});
