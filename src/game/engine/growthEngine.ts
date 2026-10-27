/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》长线成长、熟客、自动补货与风险控制引擎
 * 职责：
 * 1. 经营等级与经验结算 (根据有效经营与订单质量升级，杜绝重复空刷)
 * 2. 熟客长线羁绊系统 (多次光临、专属订单、故事解锁与纪念物赠送)
 * 3. 严格合规的自动补货引擎 (阈值触发、单次上限、每日预算、现金安全底线、绝不自动借贷)
 * 4. 经营危机预警与应急贷款机制 (设定贷款上限、每日利息、禁止无限借款)
 * 5. 生活图鉴 (Almanac) 记录与永久持久化
 */

import {
  StoreLevelState,
  SpecializationId,
  RegularCustomerProfile,
  RegularCustomerStory,
  AutoRestockConfig,
  StoreLoanState,
  LifeAlmanacState,
  Ingredient,
  LanLanBehavior,
} from '../../types/game';
import {
  STORE_LEVEL_MILESTONES,
  REGULAR_CUSTOMER_STORIES,
  LevelMilestoneConfig,
} from '../config/growthData';

/**
 * 经营经验值增加与升级判定
 */
export function addStoreExp(
  growth: StoreLevelState,
  expToAdd: number
): {
  nextGrowth: StoreLevelState;
  didLevelUp: boolean;
  unlockedMilestone?: LevelMilestoneConfig;
} {
  let currentExp = growth.currentExp + expToAdd;
  let level = growth.level;
  let expToNextLevel = growth.expToNextLevel;
  let didLevelUp = false;
  let unlockedMilestone: LevelMilestoneConfig | undefined;

  // 检查是否升级 (最高 Lv.5)
  while (level < 5) {
    const nextMilestone = STORE_LEVEL_MILESTONES.find((m) => m.level === level + 1);
    if (!nextMilestone) break;

    if (currentExp >= nextMilestone.requiredExp) {
      level += 1;
      didLevelUp = true;
      unlockedMilestone = nextMilestone;
      const futureMilestone = STORE_LEVEL_MILESTONES.find((m) => m.level === level + 1);
      expToNextLevel = futureMilestone ? futureMilestone.requiredExp : currentExp;
    } else {
      break;
    }
  }

  return {
    nextGrowth: {
      ...growth,
      level,
      currentExp,
      expToNextLevel,
    },
    didLevelUp,
    unlockedMilestone,
  };
}

/**
 * 激活经营专长
 */
export function activateSpecialization(
  growth: StoreLevelState,
  specId: SpecializationId
): {
  success: boolean;
  nextGrowth: StoreLevelState;
  error?: string;
} {
  if (growth.selectedSpecializations.includes(specId)) {
    return { success: false, nextGrowth: growth, error: '该专长已经激活' };
  }

  return {
    success: true,
    nextGrowth: {
      ...growth,
      selectedSpecializations: [...growth.selectedSpecializations, specId],
    },
  };
}

/**
 * 熟客到店与好感羁绊推进
 */
export function recordRegularCustomerVisit(
  regularCustomers: Record<string, RegularCustomerProfile>,
  customerId: string,
  orderDelivered: boolean,
  satisfactionScore: number,
  currentDay: number
): {
  nextRegulars: Record<string, RegularCustomerProfile>;
  storyUnlocked?: RegularCustomerStory;
  souvenirEarned?: string;
} {
  const profile = regularCustomers[customerId];
  if (!profile) {
    return { nextRegulars: regularCustomers };
  }

  let affinityExp = profile.affinityExp;
  let affinityLevel = profile.affinityLevel;
  let storyUnlocked: RegularCustomerStory | undefined;
  let souvenirEarned: string | undefined;

  if (orderDelivered) {
    // 成功交付出餐 +15 羁绊经验
    affinityExp += 15;
    // 满意度 90+ 额外 +10 惊喜经验
    if (satisfactionScore >= 90) {
      affinityExp += 10;
    }

    // 检查升阶 (满 100 EXP 升一阶，最高 Lv.4)
    if (affinityExp >= 100 && affinityLevel < 4) {
      affinityLevel += 1;
      affinityExp -= 100;

      // 检查是否解锁新故事
      const storyPool = REGULAR_CUSTOMER_STORIES[customerId] || [];
      const story = storyPool.find(
        (s) => s.requiredAffinityLevel === affinityLevel && !profile.unlockedStoryIds.includes(s.id)
      );

      if (story) {
        storyUnlocked = { ...story, unlockedAtDay: currentDay };
      }

      // 到达 Lv.3 赠予特别纪念物
      if (affinityLevel === 3) {
        const souvenirMap: Record<string, string> = {
          regular_student_xiaolin: '手折千纸鹤招财猫',
          regular_critic_mr_wang: '绝版初版签名小说',
          regular_programmer_ahao: '客制化极客机械轴挂坠',
          regular_designer_momo: '《兰兰的一百种睡姿》手绘明信片',
        };
        souvenirEarned = souvenirMap[customerId];
      }
    }
  }

  const updatedProfile: RegularCustomerProfile = {
    ...profile,
    visitsCount: profile.visitsCount + 1,
    affinityLevel,
    affinityExp,
    unlockedStoryIds: storyUnlocked
      ? [...profile.unlockedStoryIds, storyUnlocked.id]
      : profile.unlockedStoryIds,
    souvenirReceived: souvenirEarned || profile.souvenirReceived,
  };

  return {
    nextRegulars: {
      ...regularCustomers,
      [customerId]: updatedProfile,
    },
    storyUnlocked,
    souvenirEarned,
  };
}

/**
 * 自动补货执行核心逻辑
 * 遵守：
 * 1. 不超过库存上限
 * 2. 不超过每日采购预算
 * 3. 不超过单次采购上限
 * 4. 现金不足时停止并提示
 * 5. 绝不自动借款
 */
export interface AutoRestockExecutionResult {
  newCash: number;
  newInventory: Record<string, number>;
  totalSpent: number;
  itemsPurchased: { ingredientId: string; name: string; quantity: number; cost: number }[];
  stoppedDueToCash: boolean;
  stoppedDueToBudget: boolean;
  message: string;
}

export function executeAutoRestock(
  config: AutoRestockConfig,
  currentCash: number,
  currentInventory: Record<string, number>,
  ingredientsDb: Record<string, Ingredient>,
  hasSupplyChainDiscount: boolean = false
): AutoRestockExecutionResult {
  if (!config.enabled) {
    return {
      newCash: currentCash,
      newInventory: currentInventory,
      totalSpent: 0,
      itemsPurchased: [],
      stoppedDueToCash: false,
      stoppedDueToBudget: false,
      message: '自动补货功能未开启',
    };
  }

  let runningCash = currentCash;
  const runningInventory = { ...currentInventory };
  let remainingBudget = config.dailyBudget;
  let totalSpent = 0;
  const itemsPurchased: { ingredientId: string; name: string; quantity: number; cost: number }[] = [];
  let stoppedDueToCash = false;
  let stoppedDueToBudget = false;

  const discountRate = hasSupplyChainDiscount ? 0.9 : 1.0;

  for (const [id, rule] of Object.entries(config.rules)) {
    if (!rule.enabled) continue;

    const ing = ingredientsDb[id];
    if (!ing) continue;

    const curStock = runningInventory[id] || 0;
    // 低于最低库存阈值触发
    if (curStock < rule.minThreshold) {
      const needed = rule.targetStock - curStock;
      const spaceInStock = ing.maxStock - curStock;
      let toBuy = Math.min(needed, rule.maxBatchQty, spaceInStock);

      if (toBuy <= 0) continue;

      const unitCost = ing.costPrice * discountRate;
      let costForThis = toBuy * unitCost;

      // 预算约束校验
      if (costForThis > remainingBudget) {
        toBuy = Math.floor(remainingBudget / unitCost);
        stoppedDueToBudget = true;
      }

      // 可用现金约束校验 (绝不透支/绝不自动借款)
      if (toBuy * unitCost > runningCash) {
        toBuy = Math.floor(runningCash / unitCost);
        stoppedDueToCash = true;
      }

      if (toBuy > 0) {
        const finalCost = Math.round(toBuy * unitCost * 100) / 100;
        runningCash = Math.round((runningCash - finalCost) * 100) / 100;
        remainingBudget = Math.round((remainingBudget - finalCost) * 100) / 100;
        runningInventory[id] = curStock + toBuy;
        totalSpent = Math.round((totalSpent + finalCost) * 100) / 100;

        itemsPurchased.push({
          ingredientId: id,
          name: ing.name,
          quantity: toBuy,
          cost: finalCost,
        });
      }
    }
  }

  let message = '';
  if (itemsPurchased.length > 0) {
    const summaryList = itemsPurchased.map((p) => `${p.name}×${p.quantity}`).join('、');
    message = `自动补货完成：采购了 ${summaryList}，共支出 ¥${totalSpent.toFixed(2)}`;
    if (stoppedDueToBudget) {
      message += ' (部分原料受每日预算限制未补满)';
    }
    if (stoppedDueToCash) {
      message += ' (现金不足已自动截断，保护经营安全)';
    }
  } else {
    message = '库存充足，未触发自动补货。';
  }

  return {
    newCash: runningCash,
    newInventory: runningInventory,
    totalSpent,
    itemsPurchased,
    stoppedDueToCash,
    stoppedDueToBudget,
    message,
  };
}

/**
 * 经营健康度与财务危机评估
 */
export function assessStoreFinancialHealth(
  cash: number,
  lastDayProfit: number = 0,
  dailyFixedCost: number = 15
): {
  status: 'HEALTHY' | 'TIGHT' | 'CRISIS';
  title: string;
  advice: string[];
} {
  if (cash < dailyFixedCost * 2 || (cash < 50 && lastDayProfit < 0)) {
    return {
      status: 'CRISIS',
      title: '经营危机警报：流动资金告急！',
      advice: [
        '现有现金极少，可能难以支付明日固定经营成本 (¥15.00)。',
        '建议紧急下架未备料或低毛利餐品，暂停原料采购。',
        '可前往“财务与自救”申请应急救助借款（最高 ¥300），渡过难关。',
      ],
    };
  }

  if (cash < 100) {
    return {
      status: 'TIGHT',
      title: '资金偏紧提示：注意现金流周转',
      advice: [
        '当前资金不足百元，采购前请核算单份原料销售转化。',
        '建议优先销售毛利高、耗时短的经典咖啡与火腿三明治。',
      ],
    };
  }

  return {
    status: 'HEALTHY',
    title: '财务状况良好',
    advice: ['资金充裕，可适度投资购置升级设备或丰富装潢环境。'],
  };
}

/**
 * 申请应急经营救助贷款 (设明确限额，禁止无限借款)
 */
export function applyEmergencyLoan(
  loanState: StoreLoanState,
  cash: number,
  amount: number,
  currentDay: number
): {
  success: boolean;
  nextLoan: StoreLoanState;
  newCash: number;
  error?: string;
} {
  if (loanState.hasActiveLoan) {
    return {
      success: false,
      nextLoan: loanState,
      newCash: cash,
      error: '您当前已有一笔生效中的救助贷款，须全额结清后方可再次申请！',
    };
  }

  const sanitizedAmount = Math.max(50, Math.min(300, amount));

  return {
    success: true,
    nextLoan: {
      hasActiveLoan: true,
      principal: sanitizedAmount,
      dailyInterestRate: 0.03, // 每日 3% 息
      accumulatedInterest: 0,
      borrowedDay: currentDay,
    },
    newCash: Math.round((cash + sanitizedAmount) * 100) / 100,
  };
}

/**
 * 偿还应急经营借款
 */
export function repayEmergencyLoan(
  loanState: StoreLoanState,
  cash: number
): {
  success: boolean;
  nextLoan: StoreLoanState;
  newCash: number;
  totalPaid: number;
  error?: string;
} {
  if (!loanState.hasActiveLoan) {
    return {
      success: false,
      nextLoan: loanState,
      newCash: cash,
      totalPaid: 0,
      error: '当前暂无待偿还的借款。',
    };
  }

  const totalOwed = Math.round((loanState.principal + loanState.accumulatedInterest) * 100) / 100;
  if (cash < totalOwed) {
    return {
      success: false,
      nextLoan: loanState,
      newCash: cash,
      totalPaid: 0,
      error: `还款资金不足！应还本息合计 ¥${totalOwed.toFixed(2)}，当前可用现金不足。`,
    };
  }

  return {
    success: true,
    nextLoan: {
      hasActiveLoan: false,
      principal: 0,
      dailyInterestRate: 0.03,
      accumulatedInterest: 0,
      borrowedDay: 0,
    },
    newCash: Math.round((cash - totalOwed) * 100) / 100,
    totalPaid: totalOwed,
  };
}

/**
 * 每日打烊结算时累计贷款利息
 */
export function accrueLoanDailyInterest(loanState: StoreLoanState): StoreLoanState {
  if (!loanState.hasActiveLoan) return loanState;
  const dayInterest = Math.round(loanState.principal * loanState.dailyInterestRate * 100) / 100;
  return {
    ...loanState,
    accumulatedInterest: Math.round((loanState.accumulatedInterest + dayInterest) * 100) / 100,
  };
}

/**
 * 生活图鉴解锁记录器
 */
export function recordAlmanacCollectible(
  almanac: LifeAlmanacState,
  category: 'NAIL' | 'GOOSE' | 'ANIME' | 'LANLAN' | 'STORY' | 'FURNITURE',
  itemId: string
): LifeAlmanacState {
  const updated = { ...almanac };

  if (category === 'NAIL' && !updated.unlockedNailShowcases.includes(itemId)) {
    updated.unlockedNailShowcases = [...updated.unlockedNailShowcases, itemId];
  } else if (category === 'GOOSE' && !updated.unlockedGooseMemories.includes(itemId)) {
    updated.unlockedGooseMemories = [...updated.unlockedGooseMemories, itemId];
  } else if (category === 'ANIME' && !updated.unlockedAnimeMoments.includes(itemId)) {
    updated.unlockedAnimeMoments = [...updated.unlockedAnimeMoments, itemId];
  } else if (category === 'LANLAN') {
    const beh = itemId as LanLanBehavior;
    if (!updated.unlockedLanLanBehaviors.includes(beh)) {
      updated.unlockedLanLanBehaviors = [...updated.unlockedLanLanBehaviors, beh];
    }
  } else if (category === 'STORY' && !updated.unlockedCustomerStoryIds.includes(itemId)) {
    updated.unlockedCustomerStoryIds = [...updated.unlockedCustomerStoryIds, itemId];
  } else if (category === 'FURNITURE' && !updated.unlockedFurnitureIds.includes(itemId)) {
    updated.unlockedFurnitureIds = [...updated.unlockedFurnitureIds, itemId];
  }

  return updated;
}
