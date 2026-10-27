/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》顾客画像、订单全生命周期与排队调度核心引擎
 * 纯函数逻辑层：
 * 1. 三种顾客类型生成与偏好匹配
 * 2. 订单状态流转 (下单 -> 排队等待设备 -> 正在制作 -> 出餐交付/取消/超时流失)
 * 3. 设备独占排队机制 (先来先服务与设备能力约束)
 * 4. 玩家操作：插队优先、取消未开工订单、缺料推荐替代、暂停接单
 * 5. 动态满意度与小费算法
 */

import {
  CustomerType,
  CustomerArchetype,
  ActiveCustomerOrder,
  OrderStatus,
  MenuItem,
  Ingredient,
  EquipmentItem,
  LanLanState,
} from '../../types/game';
import {
  CUSTOMER_ARCHETYPES,
  NAMED_CUSTOMERS,
  INITIAL_MENU_ITEMS,
  INITIAL_INGREDIENTS,
  INITIAL_EQUIPMENT,
} from '../config/initialData';
import {
  checkIngredientsAvailable,
  deductIngredients,
  calculateProductUnitCost,
} from './economy';

/**
 * 评估顾客点单意向与商品选择
 */
export function generateIncomingCustomerOrder(params: {
  menuOnSale: Record<string, boolean>;
  customPricing: Record<string, number>;
  ownedEquipment: string[];
  pausedProducts: string[];
  inventory: Record<string, number>;
  currentTick: number;
  weatherPreferenceCategory?: import('../../types/game').ProductCategory;
  weatherPatienceBonus?: number;
}): { order?: ActiveCustomerOrder; rejectedReason?: 'PRICE_TOO_HIGH' | 'PAUSED' | 'NO_ITEMS_ON_SALE' } {
  // 1. 随机选定常客与顾客类型
  const customerMeta = NAMED_CUSTOMERS[Math.floor(Math.random() * NAMED_CUSTOMERS.length)];
  const archetype = CUSTOMER_ARCHETYPES[customerMeta.type];

  // 2. 筛选当前已开启在售、且店内具备所需设备的商品
  const availableItems = Object.values(INITIAL_MENU_ITEMS).filter((item) => {
    const onSale = params.menuOnSale[item.id] ?? false;
    const hasEq = params.ownedEquipment.includes(item.requiredEquipmentId);
    return onSale && hasEq;
  });

  if (availableItems.length === 0) {
    return { rejectedReason: 'NO_ITEMS_ON_SALE' };
  }

  // 3. 优先选择：若有天气偏好餐品且在售，有 45% 概率受到天气启发点单
  let chosenProduct: MenuItem;
  const weatherMatchingItems = params.weatherPreferenceCategory
    ? availableItems.filter((i) => i.category === params.weatherPreferenceCategory)
    : [];

  if (weatherMatchingItems.length > 0 && Math.random() < 0.45) {
    chosenProduct = weatherMatchingItems[Math.floor(Math.random() * weatherMatchingItems.length)];
  } else {
    // 否则按顾客常态偏好
    const preferredAvailable = availableItems.filter((i) => archetype.preferredProductIds.includes(i.id));
    chosenProduct = preferredAvailable.length > 0
      ? preferredAvailable[Math.floor(Math.random() * preferredAvailable.length)]
      : availableItems[Math.floor(Math.random() * availableItems.length)];
  }

  // 4. 检查是否被玩家临时暂停接单
  if (params.pausedProducts.includes(chosenProduct.id)) {
    return { rejectedReason: 'PAUSED' };
  }

  // 5. 结合顾客价格敏感度检验售价
  const customPrice = params.customPricing[chosenProduct.id] ?? chosenProduct.basePrice;
  const priceRatio = customPrice / chosenProduct.basePrice;
  
  // 价格敏感型对溢价更严苛
  let acceptanceProbability = 1.0;
  if (priceRatio > 1.0) {
    // 超过原价时，意愿衰减 = 1 - (priceRatio - 1) * sensitivity
    acceptanceProbability = Math.max(0.05, 1.0 - (priceRatio - 1.0) * archetype.priceSensitivity * 2.2);
  }

  if (Math.random() > acceptanceProbability) {
    return { rejectedReason: 'PRICE_TOO_HIGH' };
  }

  const unitCost = calculateProductUnitCost(chosenProduct, INITIAL_INGREDIENTS);
  const totalPatience = Math.max(10, archetype.basePatienceSeconds + (params.weatherPatienceBonus || 0));

  // 6. 构造初始订单 (状态为刚下单 ORDER_PLACED)
  const order: ActiveCustomerOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    customer: {
      name: customerMeta.name,
      type: customerMeta.type,
      avatarSeed: customerMeta.avatarSeed,
    },
    productId: chosenProduct.id,
    productName: chosenProduct.name,
    quantity: 1,
    createdAtTick: params.currentTick,
    prepDurationSeconds: chosenProduct.prepTimeSeconds,
    status: 'ORDER_PLACED',
    waitTimeElapsedSeconds: 0,
    requiredEquipmentId: chosenProduct.requiredEquipmentId,
    patienceMaxSeconds: totalPatience,
    patienceRemainingSeconds: totalPatience,
    price: customPrice,
    unitCost,
    cookProgress: 0,
    tip: 0,
    satisfactionScore: 100,
  };

  return { order };
}

/**
 * 顾客等待与满意度动态核算 (纯函数)
 */
export function calculateOrderSatisfaction(params: {
  order: ActiveCustomerOrder;
  lanLan: LanLanState;
  delivered: boolean;
}): { score: number; tip: number } {
  const { order, lanLan, delivered } = params;
  const archetype = CUSTOMER_ARCHETYPES[order.customer.type];

  if (!delivered) {
    return { score: 20, tip: 0 };
  }

  let score = 100;

  // 1. 等待时间影响：以剩余耐心百分比衡量
  const patienceRatio = order.patienceRemainingSeconds / order.patienceMaxSeconds;
  if (patienceRatio >= 0.6) {
    // 迅速出餐，满意度加成
    score += 5;
  } else if (patienceRatio >= 0.25) {
    // 正常等待
    score -= Math.round((1 - patienceRatio) * 15);
  } else {
    // 严重拖延，扣分
    score -= 30;
  }

  // 2. 价格公道程度影响
  const menuItem = INITIAL_MENU_ITEMS[order.productId];
  if (menuItem) {
    const priceRatio = order.price / menuItem.basePrice;
    if (priceRatio <= 0.85) {
      score += 10; // 超值好评
    } else if (priceRatio > 1.15) {
      score -= Math.round((priceRatio - 1.15) * 20 * archetype.priceSensitivity);
    }
  }

  // 3. 猫咪陪伴与环境加成 (阅读休闲型特别看重)
  if ((lanLan.mood ?? 85) >= 80) {
    score += Math.round(15 * archetype.environmentWeight);
  }

  score = Math.max(10, Math.min(100, score));

  // 4. 小费判定
  let tip = 0;
  if (score >= 80 && Math.random() < archetype.tipProbability) {
    // 猫咪呼噜时小费更高
    const tipRate = lanLan.isPurring ? 0.15 : 0.10;
    tip = Math.max(1, Math.round(order.price * tipRate * 10) / 10);
  }

  return { score, tip };
}

/**
 * 订单排队推进一个时间片段 (Tick)
 * 核心调度：
 * - 正在制作 (IN_PROGRESS) 的订单独占对应设备，持续增加制作进度，直至交付；
 * - 等待中 (WAITING_BREW / ORDER_PLACED) 的订单按队列顺序抢占空闲设备；
 * - 等待中订单的耐心持续衰减，归零时顾客生气离店 (ABANDONED_PATIENCE)；
 * - 缺料订单标记为 OUT_OF_STOCK 供玩家决策或流失。
 */
export function tickOrderQueue(params: {
  orders: ActiveCustomerOrder[];
  deltaSeconds: number;
  ownedEquipment: string[];
  equipmentDb: Record<string, EquipmentItem>;
  inventory: Record<string, number>;
  lanLan: LanLanState;
  speedMultiplier: number;
}): {
  updatedOrders: ActiveCustomerOrder[];
  deliveredOrders: ActiveCustomerOrder[];
  lostTimeoutOrders: ActiveCustomerOrder[];
  updatedInventory: Record<string, number>;
} {
  const {
    orders,
    deltaSeconds,
    ownedEquipment,
    equipmentDb,
    lanLan,
    speedMultiplier,
  } = params;

  let currentInventory = { ...params.inventory };
  const deliveredOrders: ActiveCustomerOrder[] = [];
  const lostTimeoutOrders: ActiveCustomerOrder[] = [];

  // 1. 统计当前已被正在制作 (IN_PROGRESS) 的订单占用的设备集合
  const busyEquipment = new Set<string>();
  for (const ord of orders) {
    if (ord.status === 'IN_PROGRESS') {
      busyEquipment.add(ord.requiredEquipmentId);
    }
  }

  // 2. 逐一遍历订单
  const nextOrders: ActiveCustomerOrder[] = [];

  for (let i = 0; i < orders.length; i++) {
    const order = { ...orders[i] };

    // --- 状态分支 A: 正在制作中 (IN_PROGRESS) ---
    if (order.status === 'IN_PROGRESS') {
      const eq = equipmentDb[order.requiredEquipmentId];
      const eqSpeedBonus = (eq && ownedEquipment.includes(eq.id)) ? eq.speedBonus : 0;
      const effectiveSpeed = (1 + eqSpeedBonus) * speedMultiplier;

      // 制作进度递增 (基于原始秒数)
      const progressDelta = (deltaSeconds / Math.max(1, order.prepDurationSeconds)) * 100 * effectiveSpeed;
      order.cookProgress = Math.min(100, order.cookProgress + progressDelta);

      if (order.cookProgress >= 100) {
        // 制作完成交付！
        order.status = 'SERVED';
        order.finalOutcome = 'DELIVERED';
        const { score, tip } = calculateOrderSatisfaction({ order, lanLan, delivered: true });
        order.satisfactionScore = score;
        order.tip = tip;

        deliveredOrders.push(order);
        // 释放该设备
        busyEquipment.delete(order.requiredEquipmentId);
        // 不再放入待处理 nextOrders
        continue;
      }

      nextOrders.push(order);
      continue;
    }

    // --- 状态分支 B: 等待中 (ORDER_PLACED 或 WAITING_BREW) ---
    if (order.status === 'ORDER_PLACED' || order.status === 'WAITING_BREW') {
      order.waitTimeElapsedSeconds += deltaSeconds;
      order.patienceRemainingSeconds = Math.max(0, order.patienceRemainingSeconds - deltaSeconds);

      // 检查耐心是否已耗尽 (超时流失)
      if (order.patienceRemainingSeconds <= 0) {
        order.status = 'ABANDONED_PATIENCE';
        order.finalOutcome = 'LOST_TIMEOUT';
        order.satisfactionScore = 15;
        lostTimeoutOrders.push(order);
        continue;
      }

      // 检查所需设备当前是否空闲
      const isEquipmentAvailable = !busyEquipment.has(order.requiredEquipmentId);

      if (isEquipmentAvailable) {
        // 尝试检查与锁定原料库存
        const menuItem = INITIAL_MENU_ITEMS[order.productId];
        if (menuItem) {
          const deductRes = deductIngredients(menuItem, currentInventory, order.quantity);
          if (deductRes.success) {
            // 原料扣减成功，正式上锅开工！
            currentInventory = deductRes.newInventory;
            order.status = 'IN_PROGRESS';
            busyEquipment.add(order.requiredEquipmentId);
            nextOrders.push(order);
            continue;
          } else {
            // 原料不足，转为缺货状态 (供玩家替代或流失)
            order.status = 'OUT_OF_STOCK';
            order.finalOutcome = 'LOST_OUT_OF_STOCK';
            nextOrders.push(order);
            continue;
          }
        }
      }

      // 设备被前面的订单占用，继续留在排队轮候
      order.status = 'WAITING_BREW';
      nextOrders.push(order);
      continue;
    }

    // 其他状态订单保留 (如 OUT_OF_STOCK 供玩家交互替代)
    nextOrders.push(order);
  }

  return {
    updatedOrders: nextOrders,
    deliveredOrders,
    lostTimeoutOrders,
    updatedInventory: currentInventory,
  };
}

/**
 * 玩家操作：将指定等待中的订单优先插队至队列前端
 * 规则：不能打断正在制作中 (IN_PROGRESS) 的订单！
 */
export function prioritizeOrder(
  orders: ActiveCustomerOrder[],
  orderId: string
): { success: boolean; newOrders: ActiveCustomerOrder[]; error?: string } {
  const targetIndex = orders.findIndex((o) => o.id === orderId);
  if (targetIndex === -1) {
    return { success: false, newOrders: orders, error: '未找到指定订单' };
  }

  const targetOrder = orders[targetIndex];
  if (targetOrder.status === 'IN_PROGRESS') {
    return { success: false, newOrders: orders, error: '该订单已在烹饪制作中，无法调整顺序' };
  }

  // 找到第一个非 IN_PROGRESS 的插入位置
  let firstWaitingIndex = 0;
  while (firstWaitingIndex < orders.length && orders[firstWaitingIndex].status === 'IN_PROGRESS') {
    firstWaitingIndex++;
  }

  if (targetIndex === firstWaitingIndex) {
    return { success: true, newOrders: orders }; // 已经在等待队列首位
  }

  const copy = [...orders];
  copy.splice(targetIndex, 1);
  copy.splice(firstWaitingIndex, 0, targetOrder);

  return {
    success: true,
    newOrders: copy,
  };
}

/**
 * 玩家操作：主动取消等待中的订单
 * 规则：已经开工制作中不可随意取消；取消后不产生销售收入，已锁定的原料如果未消耗则安全返还。
 */
export function cancelWaitingOrder(
  orders: ActiveCustomerOrder[],
  orderId: string
): { success: boolean; newOrders: ActiveCustomerOrder[]; cancelledOrder?: ActiveCustomerOrder; error?: string } {
  const targetIndex = orders.findIndex((o) => o.id === orderId);
  if (targetIndex === -1) {
    return { success: false, newOrders: orders, error: '订单不存在' };
  }

  const target = orders[targetIndex];
  if (target.status === 'IN_PROGRESS') {
    return { success: false, newOrders: orders, error: '正在制作的餐品不可随意取消打断' };
  }

  target.status = 'CANCELLED';
  target.finalOutcome = 'CANCELLED_BY_PLAYER';

  const copy = orders.filter((o) => o.id !== orderId);
  return {
    success: true,
    newOrders: copy,
    cancelledOrder: target,
  };
}

/**
 * 玩家操作：为缺货订单推荐替代餐品
 * 规则：顾客根据自身类型评估是否接受替代。若接受，替换订单商品；若不接受，提示离开。
 */
export function suggestAlternativeProduct(params: {
  orders: ActiveCustomerOrder[];
  orderId: string;
  alternativeProductId: string;
  inventory: Record<string, number>;
  customPricing: Record<string, number>;
}): {
  success: boolean;
  newOrders: ActiveCustomerOrder[];
  accepted: boolean;
  message: string;
} {
  const { orders, orderId, alternativeProductId, inventory, customPricing } = params;
  const targetIndex = orders.findIndex((o) => o.id === orderId);
  if (targetIndex === -1) {
    return { success: false, newOrders: orders, accepted: false, message: '未找到订单' };
  }

  const targetOrder = orders[targetIndex];
  const altItem = INITIAL_MENU_ITEMS[alternativeProductId];
  if (!altItem) {
    return { success: false, newOrders: orders, accepted: false, message: '替代商品不存在' };
  }

  // 检查替代商品是否有库存
  const stockCheck = checkIngredientsAvailable(altItem, inventory, 1);
  if (!stockCheck.canMake) {
    return { success: false, newOrders: orders, accepted: false, message: `替代商品【${altItem.name}】原料同样不足` };
  }

  // 顾客根据偏好决定是否接受替代
  const archetype = CUSTOMER_ARCHETYPES[targetOrder.customer.type];
  const isPreferred = archetype.preferredProductIds.includes(altItem.id);
  // 阅读型与品质型在好商品推荐下接受率高，价格型如果价格不高也愿意接受
  const acceptChance = isPreferred ? 0.90 : 0.65;

  if (Math.random() <= acceptChance) {
    // 顾客接受替代！
    const newPrice = customPricing[altItem.id] ?? altItem.basePrice;
    const newCost = calculateProductUnitCost(altItem, INITIAL_INGREDIENTS);

    const updatedOrder: ActiveCustomerOrder = {
      ...targetOrder,
      alternativeOfferedFrom: targetOrder.productName,
      productId: altItem.id,
      productName: altItem.name,
      prepDurationSeconds: altItem.prepTimeSeconds,
      requiredEquipmentId: altItem.requiredEquipmentId,
      price: newPrice,
      unitCost: newCost,
      status: 'WAITING_BREW',
      // 适度补充一点顾客耐心（因店长主动安抚推荐）
      patienceRemainingSeconds: Math.min(targetOrder.patienceMaxSeconds, targetOrder.patienceRemainingSeconds + 5),
    };

    const copy = [...orders];
    copy[targetIndex] = updatedOrder;

    return {
      success: true,
      newOrders: copy,
      accepted: true,
      message: `顾客 ${targetOrder.customer.name} 开心接受了推荐，改点【${altItem.name}】！`,
    };
  } else {
    // 顾客不接受，直接离开
    const copy = orders.filter((o) => o.id !== orderId);
    return {
      success: true,
      newOrders: copy,
      accepted: false,
      message: `顾客 ${targetOrder.customer.name} 婉拒了替代建议，选择先离开书咖。`,
    };
  }
}

/**
 * 汇总当日顾客与订单完成率统计
 */
export function summarizeDayOrderStats(orders: ActiveCustomerOrder[]): {
  completionRate: number;
  averageSatisfaction: number;
  typeStats: Record<CustomerType, { arrived: number; served: number; avgSatisfaction: number; lost: number }>;
} {
  const typeStats: Record<CustomerType, { arrived: number; served: number; totalSat: number; lost: number }> = {
    PRICE_SENSITIVE: { arrived: 0, served: 0, totalSat: 0, lost: 0 },
    QUALITY_SEEKER: { arrived: 0, served: 0, totalSat: 0, lost: 0 },
    CASUAL_READER: { arrived: 0, served: 0, totalSat: 0, lost: 0 },
  };

  let totalDelivered = 0;
  let totalSatSum = 0;

  for (const o of orders) {
    const t = o.customer.type;
    typeStats[t].arrived++;

    if (o.status === 'SERVED' || o.finalOutcome === 'DELIVERED') {
      totalDelivered++;
      totalSatSum += o.satisfactionScore;
      typeStats[t].served++;
      typeStats[t].totalSat += o.satisfactionScore;
    } else {
      typeStats[t].lost++;
    }
  }

  const completionRate = orders.length > 0
    ? Math.round((totalDelivered / orders.length) * 1000) / 10
    : 100;

  const averageSatisfaction = totalDelivered > 0
    ? Math.round((totalSatSum / totalDelivered) * 10) / 10
    : 85;

  const resultTypeStats: Record<CustomerType, { arrived: number; served: number; avgSatisfaction: number; lost: number }> = {
    PRICE_SENSITIVE: {
      arrived: typeStats.PRICE_SENSITIVE.arrived,
      served: typeStats.PRICE_SENSITIVE.served,
      lost: typeStats.PRICE_SENSITIVE.lost,
      avgSatisfaction: typeStats.PRICE_SENSITIVE.served > 0
        ? Math.round(typeStats.PRICE_SENSITIVE.totalSat / typeStats.PRICE_SENSITIVE.served)
        : 80,
    },
    QUALITY_SEEKER: {
      arrived: typeStats.QUALITY_SEEKER.arrived,
      served: typeStats.QUALITY_SEEKER.served,
      lost: typeStats.QUALITY_SEEKER.lost,
      avgSatisfaction: typeStats.QUALITY_SEEKER.served > 0
        ? Math.round(typeStats.QUALITY_SEEKER.totalSat / typeStats.QUALITY_SEEKER.served)
        : 85,
    },
    CASUAL_READER: {
      arrived: typeStats.CASUAL_READER.arrived,
      served: typeStats.CASUAL_READER.served,
      lost: typeStats.CASUAL_READER.lost,
      avgSatisfaction: typeStats.CASUAL_READER.served > 0
        ? Math.round(typeStats.CASUAL_READER.totalSat / typeStats.CASUAL_READER.served)
        : 90,
    },
  };

  return {
    completionRate,
    averageSatisfaction,
    typeStats: resultTypeStats,
  };
}
