/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》终章结局判定与匹配引擎 (Ending Engine)
 * 职责：
 * 1. 计算玩家当前经营存档对各结局的匹配度与达成进度 (0 - 100%)
 * 2. 判定当前最优势的终章结局分支
 * 3. 检测是否自然达成终局触发条件 (用于日结打烊时的里程碑触发)
 */

import { GameSaveData } from '../../types/game';
import { EndingId, GAME_ENDINGS_CATALOG, GameEndingConfig } from '../config/endingData';

export interface EndingMatchResult {
  endingId: EndingId;
  config: GameEndingConfig;
  matchScore: number; // 0 - 100 百分比
  isUnlocked: boolean; // 是否已完全满足条件
  fulfilledCriteriaCount: number;
  totalCriteriaCount: number;
  criteriaStatus: { text: string; satisfied: boolean; currentValText: string }[];
}

/**
 * 评估单个结局在当前存档下的匹配度与达成情况
 */
export function evaluateEndingMatch(gameState: GameSaveData, endingId: EndingId): EndingMatchResult {
  const config = GAME_ENDINGS_CATALOG[endingId];
  const criteriaStatus: { text: string; satisfied: boolean; currentValText: string }[] = [];

  const cash = gameState.cash;
  const reputation = gameState.reputation;
  const level = gameState.growth?.level || 1;
  const days = gameState.currentDay;
  const specs = gameState.growth?.selectedSpecializations || [];
  const regularCustomers = Object.values(gameState.regularCustomers || {});
  const maxAffinityCount = regularCustomers.filter((c) => c.affinityLevel >= 4).length;
  const totalVisits = regularCustomers.reduce((sum, c) => sum + c.visitsCount, 0);

  const reports = gameState.dailyReports || [];
  const avgSatisfaction =
    reports.length > 0
      ? reports.reduce((sum, r) => sum + (r.averageSatisfaction || 0), 0) / reports.length
      : 85;

  const nailCount = gameState.douGe?.life?.ownedNailIds?.length || 0;
  const gooseLevels = gameState.douGe?.life?.gooseClearedLevels || 0;

  switch (endingId) {
    case 'ENDING_CULTURAL_LANDMARK': {
      // 1. 等级 Lv.5
      criteriaStatus.push({
        text: '书咖等级达到 Lv.5 (城市绿洲)',
        satisfied: level >= 5,
        currentValText: `当前 Lv.${level}`,
      });
      // 2. 声誉 >= 800
      criteriaStatus.push({
        text: '书咖声誉累积达到 800 点',
        satisfied: reputation >= 800,
        currentValText: `当前 ${reputation} 点`,
      });
      // 3. 现金 >= 3500
      criteriaStatus.push({
        text: '流动资金储备 ≥ ¥3,500',
        satisfied: cash >= 3500,
        currentValText: `当前 ¥${cash.toFixed(1)}`,
      });
      // 4. 四位熟客好感全满
      criteriaStatus.push({
        text: '4位核心熟客羁绊达 Lv.4 (莫逆知己)',
        satisfied: maxAffinityCount >= 4,
        currentValText: `已满 ${maxAffinityCount}/4 位`,
      });
      // 5. 无逾期借款
      criteriaStatus.push({
        text: '财务健康，无未还借款',
        satisfied: !gameState.loan?.hasActiveLoan,
        currentValText: gameState.loan?.hasActiveLoan ? '有借款' : '无借款',
      });
      break;
    }

    case 'ENDING_CAT_UTOPIA': {
      // 1. 满意度 >= 95
      criteriaStatus.push({
        text: '全店平均出餐满意度 ≥ 95 分',
        satisfied: avgSatisfaction >= 95,
        currentValText: `当前 ${avgSatisfaction.toFixed(1)} 分`,
      });
      // 2. 兰兰好感高
      const lanLanMood = gameState.lanLan?.mood ?? 90;
      criteriaStatus.push({
        text: '兰兰心情保持在 90 分以上',
        satisfied: lanLanMood >= 90,
        currentValText: `当前 ${lanLanMood} 分`,
      });
      // 3. 豆哥穿戴甲 >= 3
      criteriaStatus.push({
        text: '豆哥生活收集：拥有至少 3 款精致穿戴甲',
        satisfied: nailCount >= 3,
        currentValText: `已收藏 ${nailCount} 款`,
      });
      // 4. 抓大鹅通关
      criteriaStatus.push({
        text: '抓大鹅通关至少 1 次 (突破第2关玄学)',
        satisfied: gooseLevels >= 1,
        currentValText: `已通关 ${gooseLevels} 局`,
      });
      // 5. 无借款
      criteriaStatus.push({
        text: '零负债经营，心态从容惬意',
        satisfied: !gameState.loan?.hasActiveLoan,
        currentValText: gameState.loan?.hasActiveLoan ? '存在借款' : '零负债',
      });
      break;
    }

    case 'ENDING_COMMERCIAL_GIANT': {
      // 1. 现金 >= 8000
      criteriaStatus.push({
        text: '流动资金总额突破 ¥8,000 元',
        satisfied: cash >= 8000,
        currentValText: `当前 ¥${cash.toFixed(1)}`,
      });
      // 2. 供应链专长
      criteriaStatus.push({
        text: '激活专长【精益供应链】',
        satisfied: specs.includes('SUPPLY_CHAIN_SAVVY'),
        currentValText: specs.includes('SUPPLY_CHAIN_SAVVY') ? '已激活' : '未激活',
      });
      // 3. 拥有至少5种专业设备
      const equipCount = gameState.ownedEquipment?.length || 0;
      criteriaStatus.push({
        text: '购置至少 5 种专业级餐饮与制作设备',
        satisfied: equipCount >= 5,
        currentValText: `当前拥有 ${equipCount} 种`,
      });
      // 4. 启用自动补货
      criteriaStatus.push({
        text: '开启并配置智能自动补货系统',
        satisfied: !!gameState.autoRestock?.enabled,
        currentValText: gameState.autoRestock?.enabled ? '已开启' : '未开启',
      });
      break;
    }

    case 'ENDING_REGULAR_SANCTUARY': {
      // 1. 熟客到访 >= 30
      criteriaStatus.push({
        text: '熟客累计进店光顾 ≥ 30 人次',
        satisfied: totalVisits >= 30,
        currentValText: `累计已到访 ${totalVisits} 次`,
      });
      // 2. 解锁回忆故事
      const unlockedStories = gameState.almanac?.unlockedCustomerStoryIds?.length || 0;
      criteriaStatus.push({
        text: '解锁至少 4 个熟客专属回忆录条目',
        satisfied: unlockedStories >= 4,
        currentValText: `已解锁 ${unlockedStories} 篇故事`,
      });
      // 3. 亲和待客或猫咪治愈专长
      const hasCharmSpec = specs.includes('HOSPITALITY_WARMTH') || specs.includes('HEALING_VIBES');
      criteriaStatus.push({
        text: '激活【亲和待客】或【猫咪治愈场】专长',
        satisfied: hasCharmSpec,
        currentValText: hasCharmSpec ? '已激活' : '未激活',
      });
      // 4. 至少2位熟客好感达到 Lv.3 以上
      const closeFriends = regularCustomers.filter((c) => c.affinityLevel >= 3).length;
      criteriaStatus.push({
        text: '至少 2 位熟客达到【默契熟客】以上羁绊',
        satisfied: closeFriends >= 2,
        currentValText: `已达成 ${closeFriends}/2 位`,
      });
      break;
    }

    case 'ENDING_RAINY_FAREWELL': {
      // 1. 现金 <= 50 或有借款
      const isFinanciallyDistressed = cash <= 60 || gameState.loan?.hasActiveLoan;
      criteriaStatus.push({
        text: '流动资金极度紧张 (现金 ≤ ¥60 或申请了救助金)',
        satisfied: isFinanciallyDistressed,
        currentValText: `当前现金 ¥${cash.toFixed(1)}`,
      });
      // 2. 经营天数 >= 5
      criteriaStatus.push({
        text: '经历至少 5 个营业日的风雨打磨',
        satisfied: days >= 5,
        currentValText: `已经营 ${days} 天`,
      });
      break;
    }

    case 'ENDING_LITERARY_HAVEN': {
      // 1. 藏书 >= 3
      const booksCount = gameState.ownedBooks?.length || 0;
      criteriaStatus.push({
        text: '馆藏书籍数量达到 3 本及以上',
        satisfied: booksCount >= 3,
        currentValText: `馆藏 ${booksCount} 本`,
      });
      // 2. 饮品出餐偏好
      criteriaStatus.push({
        text: '手冲咖啡与清茶保持在售，文墨茶香不绝',
        satisfied: !!gameState.menuOnSale?.classic_coffee && !!gameState.menuOnSale?.jasmine_tea,
        currentValText: gameState.menuOnSale?.jasmine_tea ? '茶香在售' : '茶饮未在售',
      });
      // 3. 经营声誉 >= 400
      criteriaStatus.push({
        text: '文友读者口碑认可度 (声誉 ≥ 400)',
        satisfied: reputation >= 400,
        currentValText: `当前声誉 ${reputation}`,
      });
      break;
    }
  }

  const satisfiedCount = criteriaStatus.filter((c) => c.satisfied).length;
  const totalCount = criteriaStatus.length;
  const matchScore = totalCount > 0 ? Math.round((satisfiedCount / totalCount) * 100) : 0;
  const isUnlocked = satisfiedCount === totalCount;

  return {
    endingId,
    config,
    matchScore,
    isUnlocked,
    fulfilledCriteriaCount: satisfiedCount,
    totalCriteriaCount: totalCount,
    criteriaStatus,
  };
}

/**
 * 获取全部 6 个结局的当前达成情况列表
 */
export function evaluateAllEndings(gameState: GameSaveData): EndingMatchResult[] {
  const ids: EndingId[] = [
    'ENDING_CULTURAL_LANDMARK',
    'ENDING_CAT_UTOPIA',
    'ENDING_COMMERCIAL_GIANT',
    'ENDING_REGULAR_SANCTUARY',
    'ENDING_LITERARY_HAVEN',
    'ENDING_RAINY_FAREWELL',
  ];

  return ids.map((id) => evaluateEndingMatch(gameState, id));
}

/**
 * 寻找当前最契合或已解锁的推荐结局
 */
export function getBestMatchingEnding(gameState: GameSaveData): EndingMatchResult {
  const all = evaluateAllEndings(gameState);
  
  // 优先看完全解锁的
  const unlocked = all.filter((r) => r.isUnlocked);
  if (unlocked.length > 0) {
    // 优先排在前面的稀有结局
    return unlocked[0];
  }

  // 否则按匹配度最高排序
  return [...all].sort((a, b) => b.matchScore - a.matchScore)[0];
}

/**
 * 检查当前日结是否自动触发“达成终章结局条件”的提示弹窗
 */
export function checkNaturalEndingTrigger(gameState: GameSaveData): EndingId | null {
  // 破产告急触发
  if (gameState.cash <= 0 && gameState.loan?.hasActiveLoan && gameState.currentDay >= 6) {
    return 'ENDING_RAINY_FAREWELL';
  }

  // 经营大满贯触发 (Lv.5 且 声誉高 且 天数 >= 15)
  if (gameState.growth?.level >= 5 && gameState.reputation >= 800 && gameState.cash >= 3500) {
    return 'ENDING_CULTURAL_LANDMARK';
  }

  // 商业大亨触发
  if (gameState.cash >= 8000 && gameState.growth?.selectedSpecializations?.includes('SUPPLY_CHAIN_SAVVY')) {
    return 'ENDING_COMMERCIAL_GIANT';
  }

  return null;
}
