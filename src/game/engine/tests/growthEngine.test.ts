/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 长线成长、熟客、自动补货与风险控制系统单元测试
 * 覆盖：
 * 1. 经营等级升级与里程碑解锁 (不提供无限收入膨胀)
 * 2. 熟客好感推进、故事线解锁与纪念物赠予 (永久持久化)
 * 3. 自动补货引擎安全边界 (阈值、单次上限、每日预算、现金底线、绝不自动借款)
 * 4. 经营危机评估与应急贷款机制 (限额、利息、禁止无限借款、清偿流程)
 * 5. 生活图鉴 (Almanac) 收藏记录
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultGrowthState,
  createDefaultRegularCustomers,
  createDefaultAutoRestockConfig,
  createDefaultLoanState,
  createDefaultAlmanacState,
} from '../../config/growthData';
import {
  addStoreExp,
  activateSpecialization,
  recordRegularCustomerVisit,
  executeAutoRestock,
  assessStoreFinancialHealth,
  applyEmergencyLoan,
  repayEmergencyLoan,
  accrueLoanDailyInterest,
  recordAlmanacCollectible,
} from '../growthEngine';
import { INITIAL_INGREDIENTS } from '../../config/initialData';

describe('长线成长与经营专长系统 (Store Growth & Specializations)', () => {
  it('累积有效经验应平滑升级并解锁对应里程碑', () => {
    const growth = createDefaultGrowthState(); // Lv.1, 25 EXP
    expect(growth.level).toBe(1);

    // 增加 100 EXP -> 125 EXP (达到 Lv.2 阈值 120)
    const { nextGrowth, didLevelUp, unlockedMilestone } = addStoreExp(growth, 100);
    expect(didLevelUp).toBe(true);
    expect(nextGrowth.level).toBe(2);
    expect(unlockedMilestone?.title).toContain('街角暖光');
    expect(unlockedMilestone?.unlockedFeatures).toContain('熟客羁绊系统');
  });

  it('激活经营专长成功，且阻止重复激活同一专长', () => {
    const growth = createDefaultGrowthState();
    const res1 = activateSpecialization(growth, 'COFFEE_ARTISAN');
    expect(res1.success).toBe(true);
    expect(res1.nextGrowth.selectedSpecializations).toContain('COFFEE_ARTISAN');

    const res2 = activateSpecialization(res1.nextGrowth, 'COFFEE_ARTISAN');
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('已经激活');
  });
});

describe('熟客羁绊与故事解锁系统 (Regular Customers & Stories)', () => {
  it('多次满意出餐应提升熟客羁绊并解锁长线故事', () => {
    const regulars = createDefaultRegularCustomers();
    const xiaolin = regulars.regular_student_xiaolin;
    expect(xiaolin.affinityLevel).toBe(1);

    // 小林到店成功交付出餐，满意度 95分 (+25 EXP)
    let currentRegulars = regulars;
    // 多次光临促成升级
    for (let i = 0; i < 4; i++) {
      const res = recordRegularCustomerVisit(
        currentRegulars,
        'regular_student_xiaolin',
        true,
        95,
        1
      );
      currentRegulars = res.nextRegulars;
    }

    const updatedXiaolin = currentRegulars.regular_student_xiaolin;
    expect(updatedXiaolin.affinityLevel).toBeGreaterThanOrEqual(2);
    // 成功解锁了故事 2
    expect(updatedXiaolin.unlockedStoryIds).toContain('story_xiaolin_2');
  });

  it('达到羁绊高阶时获赠熟客专属纪念物', () => {
    const regulars = createDefaultRegularCustomers();
    let currentRegulars = regulars;

    // 连续多次满意出餐升至 Lv.3
    for (let i = 0; i < 10; i++) {
      const res = recordRegularCustomerVisit(
        currentRegulars,
        'regular_student_xiaolin',
        true,
        95,
        2
      );
      currentRegulars = res.nextRegulars;
      if (res.souvenirEarned) {
        expect(res.souvenirEarned).toBe('手折千纸鹤招财猫');
        break;
      }
    }

    expect(currentRegulars.regular_student_xiaolin.souvenirReceived).toBe('手折千纸鹤招财猫');
  });
});

describe('智能自动补货引擎 (Auto-Restock System)', () => {
  it('未开启总开关时，不执行任何采购', () => {
    const config = createDefaultAutoRestockConfig();
    config.enabled = false;
    const inventory = { coffee_beans: 1 }; // 低于3份
    const cash = 1000;

    const res = executeAutoRestock(config, cash, inventory, INITIAL_INGREDIENTS);
    expect(res.totalSpent).toBe(0);
    expect(res.newCash).toBe(1000);
    expect(res.newInventory.coffee_beans).toBe(1);
  });

  it('开启后严格遵守最低库存阈值、单次上限与目标库存', () => {
    const config = createDefaultAutoRestockConfig();
    config.enabled = true;
    config.rules.coffee_beans = {
      ingredientId: 'coffee_beans',
      enabled: true,
      minThreshold: 4,
      targetStock: 10,
      maxBatchQty: 5,
    };

    // 当前库存为 2 (低于 4)
    // 需求 10 - 2 = 8，但受单次上限限制，最多采购 5 份
    const inventory = { coffee_beans: 2 };
    const cash = 1000;

    const res = executeAutoRestock(config, cash, inventory, INITIAL_INGREDIENTS);
    expect(res.itemsPurchased.length).toBe(1);
    expect(res.itemsPurchased[0].quantity).toBe(5);
    expect(res.newInventory.coffee_beans).toBe(7);
    expect(res.totalSpent).toBe(5 * INITIAL_INGREDIENTS.coffee_beans.costPrice);
    expect(res.newCash).toBe(1000 - res.totalSpent);
  });

  it('严格遵守每日采购预算与现金安全底线，绝不产生负数与自动借款', () => {
    const config = createDefaultAutoRestockConfig();
    config.enabled = true;
    config.dailyBudget = 20.0; // 预算只有 20 元
    config.rules.coffee_beans = {
      ingredientId: 'coffee_beans',
      enabled: true,
      minThreshold: 5,
      targetStock: 10,
      maxBatchQty: 10,
    };

    // 单价 3.5元，20元最多只能买 5 份 (17.5元)
    const inventory = { coffee_beans: 0 };
    const cash = 15.0; // 现金更低，只有 15 元！最多买 4 份 (14元)

    const res = executeAutoRestock(config, cash, inventory, INITIAL_INGREDIENTS);
    expect(res.stoppedDueToCash).toBe(true);
    expect(res.itemsPurchased[0].quantity).toBe(4);
    expect(res.newCash).toBe(1.0); // 剩余 1 元，绝非负数
    expect(res.newCash).toBeGreaterThanOrEqual(0);
  });

  it('激活供应链专长时采购享受9折优惠', () => {
    const config = createDefaultAutoRestockConfig();
    config.enabled = true;
    config.rules.coffee_beans = {
      ingredientId: 'coffee_beans',
      enabled: true,
      minThreshold: 5,
      targetStock: 10,
      maxBatchQty: 2,
    };

    const inventory = { coffee_beans: 1 };
    const res = executeAutoRestock(config, 100, inventory, INITIAL_INGREDIENTS, true);
    // 2 份 * 3.5 * 0.9 = 6.3 元
    expect(res.totalSpent).toBe(6.3);
  });
});

describe('经营风险与应急借款机制 (Risk & Emergency Loan)', () => {
  it('正确评估资金健康度并发出危机预警', () => {
    expect(assessStoreFinancialHealth(300).status).toBe('HEALTHY');
    expect(assessStoreFinancialHealth(80).status).toBe('TIGHT');
    expect(assessStoreFinancialHealth(20).status).toBe('CRISIS');
  });

  it('应急借款申请限额最高 ¥300，且禁止重复借款', () => {
    const loan = createDefaultLoanState();
    const cash = 20.0;

    const res1 = applyEmergencyLoan(loan, cash, 200, 1);
    expect(res1.success).toBe(true);
    expect(res1.newCash).toBe(220.0);
    expect(res1.nextLoan.hasActiveLoan).toBe(true);
    expect(res1.nextLoan.principal).toBe(200);

    // 尝试二次借款必然被拒绝
    const res2 = applyEmergencyLoan(res1.nextLoan, res1.newCash, 100, 1);
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('全额结清后方可再次申请');
  });

  it('按日累计利息，并支持全额还款清偿', () => {
    let loan = createDefaultLoanState();
    loan = applyEmergencyLoan(loan, 0, 100, 1).nextLoan; // 借 100，每日 3% 息 = 3元/天

    loan = accrueLoanDailyInterest(loan);
    expect(loan.accumulatedInterest).toBe(3);

    // 尝试还款：现金不足 103 元应被拒绝
    const failRepay = repayEmergencyLoan(loan, 50);
    expect(failRepay.success).toBe(false);
    expect(failRepay.error).toContain('还款资金不足');

    // 现金充足时还款成功，清空债务
    const successRepay = repayEmergencyLoan(loan, 200);
    expect(successRepay.success).toBe(true);
    expect(successRepay.nextLoan.hasActiveLoan).toBe(false);
    expect(successRepay.newCash).toBe(97); // 200 - 103 = 97
  });
});

describe('生活图鉴收藏 (Life Almanac)', () => {
  it('图鉴正确登记解锁的生活条目且不重复', () => {
    let almanac = createDefaultAlmanacState();
    almanac = recordAlmanacCollectible(almanac, 'NAIL', 'nail_retro_amber');
    expect(almanac.unlockedNailShowcases).toContain('nail_retro_amber');

    // 重复记录不产生冗余副本
    const len = almanac.unlockedNailShowcases.length;
    almanac = recordAlmanacCollectible(almanac, 'NAIL', 'nail_retro_amber');
    expect(almanac.unlockedNailShowcases.length).toBe(len);
  });
});
