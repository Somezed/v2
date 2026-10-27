/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 自动化测试：首版经营闭环核心经济与会计核算
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProductUnitCost,
  calculateProductMargin,
  evaluatePurchaseWillingness,
  checkEquipmentRequirement,
  checkIngredientsAvailable,
  deductIngredients,
  restockIngredient,
  purchaseEquipment,
  calculateEquipmentMaintenance,
  compileDailySettlement,
} from '../economy';
import {
  INITIAL_INGREDIENTS,
  INITIAL_MENU_ITEMS,
  INITIAL_EQUIPMENT,
  DAILY_FIXED_OPERATING_COST,
} from '../../config/initialData';

describe('首版经营闭环核心核算引擎测试', () => {
  it('六类商品单份原料成本 (COGS) 与毛利精确计算', () => {
    // 经典咖啡：1 份 coffee_beans (3.5)，售价 18.0，毛利 14.5
    const coffee = INITIAL_MENU_ITEMS.classic_coffee;
    const coffeeCost = calculateProductUnitCost(coffee, INITIAL_INGREDIENTS);
    expect(coffeeCost).toBe(3.5);
    const coffeeMargin = calculateProductMargin(coffee, 18.0, INITIAL_INGREDIENTS);
    expect(coffeeMargin.grossProfit).toBe(14.5);
    expect(coffeeMargin.grossMarginRate).toBeCloseTo(80.6, 1);

    // 火鸡面：1 份 noodles_set (4.5)，售价 20.0，毛利 15.5
    const noodles = INITIAL_MENU_ITEMS.buldak_spicy_noodles;
    const noodlesCost = calculateProductUnitCost(noodles, INITIAL_INGREDIENTS);
    expect(noodlesCost).toBe(4.5);
    const noodlesMargin = calculateProductMargin(noodles, 20.0, INITIAL_INGREDIENTS);
    expect(noodlesMargin.grossProfit).toBe(15.5);

    // 鲜虾金枪鱼沙拉：1 份 seafood_set (9.0)，售价 32.0，毛利 23.0
    const salad = INITIAL_MENU_ITEMS.seafood_salad;
    const saladCost = calculateProductUnitCost(salad, INITIAL_INGREDIENTS);
    expect(saladCost).toBe(9.0);
    const saladMargin = calculateProductMargin(salad, 32.0, INITIAL_INGREDIENTS);
    expect(saladMargin.grossProfit).toBe(23.0);
  });

  it('价格弹性与购买意向：定价显著影响顾客购买意愿', () => {
    const coffee = INITIAL_MENU_ITEMS.classic_coffee; // basePrice = 18.0

    // 实惠低价 (14 元)：高购买意愿 (>95%)
    const cheapRes = evaluatePurchaseWillingness(coffee, 14.0);
    expect(cheapRes.evaluation).toBe('VERY_CHEAP');
    expect(cheapRes.probability).toBeGreaterThan(0.9);

    // 推荐公道价 (18 元)：正常稳健购买意愿
    const fairRes = evaluatePurchaseWillingness(coffee, 18.0);
    expect(fairRes.evaluation).toBe('FAIR');
    expect(fairRes.probability).toBeGreaterThan(0.75);

    // 严重溢价暴利 (35 元，接近 2 倍)：意愿断崖式下跌
    const overpriceRes = evaluatePurchaseWillingness(coffee, 35.0);
    expect(overpriceRes.evaluation).toBe('OVERPRICED');
    expect(overpriceRes.probability).toBeLessThan(0.3);
  });

  it('设备要求前置依赖校验', () => {
    const noodles = INITIAL_MENU_ITEMS.buldak_spicy_noodles; // 需要 electric_cooker
    const initialEquipment = ['manual_dripper', 'tea_pot', 'basic_prep_table'];

    // 初始没有快煮锅，无法开做
    const check1 = checkEquipmentRequirement(noodles, initialEquipment);
    expect(check1.satisfied).toBe(false);

    // 购买快煮锅后，满足制作要求
    const check2 = checkEquipmentRequirement(noodles, [...initialEquipment, 'electric_cooker']);
    expect(check2.satisfied).toBe(true);
  });

  it('严格禁止负库存与缺料制作', () => {
    const sandwich = INITIAL_MENU_ITEMS.ham_egg_sandwich;
    const inventory = { sandwich_set: 1 };

    // 制作 2 份，库存仅有 1 份，严谨拦截
    const check = checkIngredientsAvailable(sandwich, inventory, 2);
    expect(check.canMake).toBe(false);

    const deductRes = deductIngredients(sandwich, inventory, 2);
    expect(deductRes.success).toBe(false);
    expect(deductRes.newInventory.sandwich_set).toBe(1); // 原有库存不受破坏
  });

  it('采购仓库上限与透支资金拦截', () => {
    const currentCash = 50.0;
    const inventory = { coffee_beans: 35 }; // 上限 40

    // 试图进货 10 份，超出仓库上限 (35 + 10 = 45 > 40)
    const capRes = restockIngredient('coffee_beans', 10, currentCash, inventory, INITIAL_INGREDIENTS);
    expect(capRes.success).toBe(false);
    expect(capRes.error).toContain('超出仓库容量上限');

    // 试图超预算采购海鲜原料 (20 份海鲜需要 180 元 > 50 元资金)
    const overbudgetRes = restockIngredient('seafood_set', 20, currentCash, { seafood_set: 0 }, INITIAL_INGREDIENTS);
    expect(overbudgetRes.success).toBe(false);
    expect(overbudgetRes.error).toContain('资金不足');
  });

  it('会计勾稽校验：严谨区分现金流 (Cash Flow) 与 损益表已消耗成本 (COGS)', () => {
    // 场景：
    // 期初现金 300 元
    // 采购了 10 份咖啡豆花了 35 元现金 (现金支出 35 元)
    // 当日共卖出了 4 杯咖啡 (每杯售价 18 元，总收入 72 元)
    // 当日实际消耗了 4 份咖啡豆 (COGS = 4 * 3.5 = 14 元，剩下的 6 份是库存资产，绝不计入当日消耗！)
    // 固定经营成本 15 元
    // 设备维护损耗 3.5 元
    // 没有购买新设备 (Capex = 0)

    const settlement = compileDailySettlement({
      day: 1,
      openingCash: 300,
      revenue: 72,
      consumedIngredientCost: 14, // 仅消耗 14 元
      procurementCashPaid: 35,    // 采购付现 35 元
      fixedOperatingCost: 15,
      maintenanceCost: 3.5,
      equipmentCapexPaid: 0,
      ordersAttempted: 5,
      ordersServed: 4,
      ordersLostStockOut: 1,
      ordersLostHighPrice: 0,
      ordersLostTimeout: 0,
      catHappiestMoment: '兰兰在猫抓板上伸大大的懒腰',
    });

    // 损益表：经营净利润 = 72 - 14 - 15 - 3.5 = 39.5 元
    expect(settlement.netProfit).toBe(39.5);

    // 现金流表：期末现金 = 300 (期初) + 72 (收入) - 35 (采购付现) - 15 (固定杂费) = 322 元
    expect(settlement.closingCash).toBe(322);

    // 明确验证：采购支出 (35) 与 消耗成本 (14) 没有混淆与重复计算！
    expect(settlement.procurementCashPaid).not.toBe(settlement.consumedIngredientCost);
  });
});
