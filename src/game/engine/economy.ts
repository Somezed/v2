/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》核心经营与财务核算引擎 (首版闭环)
 * 纯函数实现，严谨遵循会计准则：
 * 1. 严格区分现金流 (Cash Flow) 与 经营损益 (P&L - COGS 已消耗成本)
 * 2. 价格需求弹性算法 (Price Elasticity of Demand)
 * 3. 库存上下限与防负库存校验
 */

import {
  MenuItem,
  Ingredient,
  EquipmentItem,
  DailyReport,
} from '../../types/game';

/**
 * 计算单款商品的单份原料成本 (COGS Unit Cost)
 */
export function calculateProductUnitCost(
  item: MenuItem,
  ingredientsDb: Record<string, Ingredient>
): number {
  let cost = 0;
  for (const req of item.requiredIngredients) {
    const ing = ingredientsDb[req.ingredientId];
    if (ing) {
      cost += ing.costPrice * req.amount;
    }
  }
  return Math.round(cost * 100) / 100;
}

/**
 * 计算商品在自定售价下的单份毛利与毛利率
 */
export function calculateProductMargin(
  item: MenuItem,
  customPrice: number,
  ingredientsDb: Record<string, Ingredient>
): { unitCost: number; grossProfit: number; grossMarginRate: number } {
  const unitCost = calculateProductUnitCost(item, ingredientsDb);
  const grossProfit = Math.round((customPrice - unitCost) * 100) / 100;
  const grossMarginRate = customPrice > 0
    ? Math.round((grossProfit / customPrice) * 1000) / 10
    : 0;

  return { unitCost, grossProfit, grossMarginRate };
}

/**
 * 价格弹性与购买意愿评估 (Price Elasticity & Willingness)
 * - 当 自定售价 <= 基准售价：顾客好感度增加，购买意愿高达 90%~98%
 * - 当 自定售价 > 基准售价：随着溢价幅度增加，购买意愿快速衰减
 * 返回：[0.0 ~ 1.0] 的购买意向概率，以及文字评价
 */
export function evaluatePurchaseWillingness(
  item: MenuItem,
  customPrice: number
): { probability: number; evaluation: 'VERY_CHEAP' | 'FAIR' | 'SLIGHTLY_EXPENSIVE' | 'OVERPRICED' } {
  const ratio = customPrice / item.basePrice;

  if (ratio <= 0.85) {
    return { probability: 0.98, evaluation: 'VERY_CHEAP' };
  } else if (ratio <= 1.05) {
    // 降至基准线附近
    const prob = 0.92 - (ratio - 0.85) * 0.4;
    return { probability: Math.max(0.8, Math.round(prob * 100) / 100), evaluation: 'FAIR' };
  } else if (ratio <= 1.25) {
    // 轻微溢价
    const prob = 0.8 - (ratio - 1.05) * 1.6; // 1.25时约为 0.48
    return { probability: Math.max(0.45, Math.round(prob * 100) / 100), evaluation: 'SLIGHTLY_EXPENSIVE' };
  } else {
    // 严重虚高
    const prob = Math.max(0.05, 0.45 - (ratio - 1.25) * 1.1);
    return { probability: Math.round(prob * 100) / 100, evaluation: 'OVERPRICED' };
  }
}

/**
 * 校验设备是否满足商品制作需求
 */
export function checkEquipmentRequirement(
  item: MenuItem,
  ownedEquipment: string[]
): { satisfied: boolean; requiredEquipmentId: string } {
  const satisfied = ownedEquipment.includes(item.requiredEquipmentId);
  return { satisfied, requiredEquipmentId: item.requiredEquipmentId };
}

/**
 * 校验原料库存是否足以制作指定数量的商品 (禁止负库存)
 */
export function checkIngredientsAvailable(
  item: MenuItem,
  currentInventory: Record<string, number>,
  count = 1
): { canMake: boolean; missing: { ingredientId: string; needed: number; available: number }[] } {
  const missing: { ingredientId: string; needed: number; available: number }[] = [];

  for (const req of item.requiredIngredients) {
    const needed = req.amount * count;
    const available = currentInventory[req.ingredientId] || 0;
    if (available < needed) {
      missing.push({
        ingredientId: req.ingredientId,
        needed,
        available,
      });
    }
  }

  return {
    canMake: missing.length === 0,
    missing,
  };
}

/**
 * 安全扣除制作消耗的原料 (纯函数)
 * 如果库存不足，绝不执行扣除，严禁产生负库存
 */
export function deductIngredients(
  item: MenuItem,
  currentInventory: Record<string, number>,
  count = 1
): { success: boolean; newInventory: Record<string, number>; error?: string } {
  const check = checkIngredientsAvailable(item, currentInventory, count);
  if (!check.canMake) {
    return {
      success: false,
      newInventory: currentInventory,
      error: `原料不足，无法制作: ${check.missing.map(m => `${m.ingredientId} (缺${m.needed - m.available})`).join(', ')}`,
    };
  }

  const updated = { ...currentInventory };
  for (const req of item.requiredIngredients) {
    const totalDeduct = req.amount * count;
    const current = updated[req.ingredientId] || 0;
    updated[req.ingredientId] = Math.max(0, current - totalDeduct);
  }

  return {
    success: true,
    newInventory: updated,
  };
}

/**
 * 原料采购核算 (含采购前预算核算、库存上限限制、现金流扣减)
 */
export function calculateProcurementCost(
  ingredientId: string,
  amount: number,
  ingredientsDb: Record<string, Ingredient>
): { totalCost: number; unitPrice: number; ingredientName: string; error?: string } {
  const ing = ingredientsDb[ingredientId];
  if (!ing) {
    return { totalCost: 0, unitPrice: 0, ingredientName: '', error: '原料不存在' };
  }
  const totalCost = Math.round(ing.costPrice * amount * 100) / 100;
  return { totalCost, unitPrice: ing.costPrice, ingredientName: ing.name };
}

/**
 * 执行原料采购操作 (纯函数)
 */
export function restockIngredient(
  ingredientId: string,
  amount: number,
  currentCash: number,
  currentInventory: Record<string, number>,
  ingredientsDb: Record<string, Ingredient>
): {
  success: boolean;
  newCash: number;
  newInventory: Record<string, number>;
  totalCost: number;
  error?: string;
} {
  if (amount <= 0 || !Number.isInteger(amount)) {
    return {
      success: false,
      newCash: currentCash,
      newInventory: currentInventory,
      totalCost: 0,
      error: '采购数量必须为正整数',
    };
  }

  const ing = ingredientsDb[ingredientId];
  if (!ing) {
    return {
      success: false,
      newCash: currentCash,
      newInventory: currentInventory,
      totalCost: 0,
      error: `未找到原料配置: ${ingredientId}`,
    };
  }

  const currentCount = currentInventory[ingredientId] || 0;
  if (currentCount + amount > ing.maxStock) {
    return {
      success: false,
      newCash: currentCash,
      newInventory: currentInventory,
      totalCost: 0,
      error: `超出仓库容量上限！当前存量 ${currentCount}，上限为 ${ing.maxStock} ${ing.unit}，最多还能进货 ${ing.maxStock - currentCount} ${ing.unit}`,
    };
  }

  const totalCost = Math.round(ing.costPrice * amount * 100) / 100;
  if (currentCash < totalCost) {
    return {
      success: false,
      newCash: currentCash,
      newInventory: currentInventory,
      totalCost,
      error: `资金不足！采购需支付 ¥${totalCost.toFixed(2)}，当前现金仅有 ¥${currentCash.toFixed(2)}`,
    };
  }

  const newInventory = {
    ...currentInventory,
    [ingredientId]: currentCount + amount,
  };
  const newCash = Math.round((currentCash - totalCost) * 100) / 100;

  return {
    success: true,
    newCash,
    newInventory,
    totalCost,
  };
}

/**
 * 购买店铺设备 (属于投资性资本支出 Capex，不计入日常经营消耗成本)
 */
export function purchaseEquipment(
  equipmentId: string,
  currentCash: number,
  ownedEquipment: string[],
  equipmentDb: Record<string, EquipmentItem>
): {
  success: boolean;
  newCash: number;
  newOwnedEquipment: string[];
  purchaseCost: number;
  error?: string;
} {
  if (ownedEquipment.includes(equipmentId)) {
    return {
      success: false,
      newCash: currentCash,
      newOwnedEquipment: ownedEquipment,
      purchaseCost: 0,
      error: '该设备已在店内安装，无需重复购买',
    };
  }

  const eq = equipmentDb[equipmentId];
  if (!eq) {
    return {
      success: false,
      newCash: currentCash,
      newOwnedEquipment: ownedEquipment,
      purchaseCost: 0,
      error: `未找到该设备配置: ${equipmentId}`,
    };
  }

  if (currentCash < eq.purchaseCost) {
    return {
      success: false,
      newCash: currentCash,
      newOwnedEquipment: ownedEquipment,
      purchaseCost: eq.purchaseCost,
      error: `资金不足以购置【${eq.name}】，售价 ¥${eq.purchaseCost.toFixed(2)}，当前余额 ¥${currentCash.toFixed(2)}`,
    };
  }

  const newCash = Math.round((currentCash - eq.purchaseCost) * 100) / 100;
  const newOwnedEquipment = [...ownedEquipment, equipmentId];

  return {
    success: true,
    newCash,
    newOwnedEquipment,
    purchaseCost: eq.purchaseCost,
  };
}

/**
 * 计算当日设备日常损耗与维护费总和
 */
export function calculateEquipmentMaintenance(
  ownedEquipment: string[],
  equipmentDb: Record<string, EquipmentItem>
): number {
  let total = 0;
  for (const id of ownedEquipment) {
    const eq = equipmentDb[id];
    if (eq) {
      total += eq.dailyMaintenanceCost;
    }
  }
  return Math.round(total * 100) / 100;
}

/**
 * 每日打烊经营结算汇总（严格符合损益与现金流双重勾稽）
 * 
 * 1. 利润表 (P&L):
 *    净利润 = 销售收入 - 已消耗原料成本(COGS) - 固定经营成本 - 设备折旧维护
 * 
 * 2. 现金流表 (Cash Flow):
 *    期末现金 = 期初现金 + 销售收入 - 采购支出 - 固定经营成本 - 设备购置支出
 */
export function compileDailySettlement(params: {
  day: number;
  openingCash: number;
  revenue: number;
  consumedIngredientCost: number; // 严谨 COGS
  procurementCashPaid: number;    // 采购支出
  fixedOperatingCost: number;     // 固定成本
  fixedCostBreakdown?: import('../../types/game').FixedCostBreakdown;
  maintenanceCost: number;        // 设备损耗
  equipmentCapexPaid: number;     // 资本性支出
  randomEventExpense?: number;    // 突发事件支出
  ordersAttempted: number;
  ordersServed: number;
  ordersLostStockOut: number;
  ordersLostHighPrice: number;
  ordersLostTimeout: number;
  ordersCancelled?: number;
  completionRate?: number;
  averageSatisfaction?: number;
  customerTypeStats?: import('../../types/game').DailyReport['customerTypeStats'];
  weather?: import('../../types/game').DailyWeatherInfo;
  triggeredEvent?: import('../../types/game').TriggeredRandomEvent;
  catHappiestMoment: string;
}): DailyReport {
  const revenue = Math.round(params.revenue * 100) / 100;
  const consumedIngredientCost = Math.round(params.consumedIngredientCost * 100) / 100;
  const fixedOperatingCost = Math.round(params.fixedOperatingCost * 100) / 100;
  const maintenanceCost = Math.round(params.maintenanceCost * 100) / 100;
  const randomEventExpense = Math.round((params.randomEventExpense || 0) * 100) / 100;

  // 损益表：经营净利润
  const netProfit = Math.round(
    (revenue - consumedIngredientCost - fixedOperatingCost - maintenanceCost - randomEventExpense) * 100
  ) / 100;

  // 现金流表：期末现金
  const closingCash = Math.round(
    (params.openingCash + revenue - params.procurementCashPaid - fixedOperatingCost - params.equipmentCapexPaid - randomEventExpense) * 100
  ) / 100;

  const completionRate = params.completionRate ?? (
    params.ordersAttempted > 0 ? Math.round((params.ordersServed / params.ordersAttempted) * 1000) / 10 : 100
  );

  const fallbackCustomerStats: import('../../types/game').DailyReport['customerTypeStats'] = {
    PRICE_SENSITIVE: { arrived: 0, served: 0, avgSatisfaction: 80, lost: 0 },
    QUALITY_SEEKER: { arrived: 0, served: 0, avgSatisfaction: 85, lost: 0 },
    CASUAL_READER: { arrived: 0, served: 0, avgSatisfaction: 90, lost: 0 },
  };

  return {
    day: params.day,
    openingCash: params.openingCash,
    closingCash,
    revenue,
    consumedIngredientCost,
    fixedOperatingCost,
    fixedCostBreakdown: params.fixedCostBreakdown,
    maintenanceCost,
    randomEventExpense,
    netProfit,
    procurementCashPaid: Math.round(params.procurementCashPaid * 100) / 100,
    equipmentCapexPaid: Math.round(params.equipmentCapexPaid * 100) / 100,
    ordersAttempted: params.ordersAttempted,
    ordersServed: params.ordersServed,
    ordersLostStockOut: params.ordersLostStockOut,
    ordersLostHighPrice: params.ordersLostHighPrice,
    ordersLostTimeout: params.ordersLostTimeout,
    ordersCancelled: params.ordersCancelled || 0,
    completionRate,
    averageSatisfaction: params.averageSatisfaction ?? 85,
    customerTypeStats: params.customerTypeStats || fallbackCustomerStats,
    weather: params.weather,
    triggeredEvent: params.triggeredEvent,
    catHappiestMoment: params.catHappiestMoment,
  };
}
