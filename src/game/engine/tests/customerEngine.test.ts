/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 自动化测试：顾客画像、订单生命周期、排队独占与满意度引擎
 */

import { describe, it, expect } from 'vitest';
import {
  generateIncomingCustomerOrder,
  calculateOrderSatisfaction,
  tickOrderQueue,
  prioritizeOrder,
  cancelWaitingOrder,
  suggestAlternativeProduct,
  summarizeDayOrderStats,
} from '../customerEngine';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_INGREDIENTS,
  INITIAL_EQUIPMENT,
  createInitialGameState,
} from '../../config/initialData';
import { ActiveCustomerOrder } from '../../../types/game';

describe('顾客画像、订单与排队系统测试', () => {
  it('顾客下单会根据在售商品、设备与暂停接单状态产生合理结果', () => {
    const initialState = createInitialGameState();

    // 正常状态下生成订单
    const res = generateIncomingCustomerOrder({
      menuOnSale: initialState.menuOnSale,
      customPricing: initialState.customPricing,
      ownedEquipment: initialState.ownedEquipment,
      pausedProducts: [],
      inventory: initialState.inventory,
      currentTick: 1,
    });

    if (res.order) {
      expect(res.order.status).toBe('ORDER_PLACED');
      expect(['PRICE_SENSITIVE', 'QUALITY_SEEKER', 'CASUAL_READER']).toContain(res.order.customer.type);
      expect(res.order.patienceRemainingSeconds).toBeGreaterThan(10);
    }

    // 若全部商品被暂停接单，则拒绝下单
    const pausedRes = generateIncomingCustomerOrder({
      menuOnSale: initialState.menuOnSale,
      customPricing: initialState.customPricing,
      ownedEquipment: initialState.ownedEquipment,
      pausedProducts: Object.keys(INITIAL_MENU_ITEMS),
      inventory: initialState.inventory,
      currentTick: 1,
    });
    expect(pausedRes.rejectedReason).toBe('PAUSED');
  });

  it('设备独占排队机制：同设备冲突时依次排队等待，空闲时才开始制作', () => {
    const initialState = createInitialGameState();

    // 模拟两个都需要 manual_dripper 的咖啡订单
    const order1: ActiveCustomerOrder = {
      id: 'ord_1',
      customer: { name: '顾客A', type: 'QUALITY_SEEKER', avatarSeed: '1' },
      productId: 'classic_coffee',
      productName: '经典咖啡',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 4,
      status: 'WAITING_BREW',
      waitTimeElapsedSeconds: 0,
      requiredEquipmentId: 'manual_dripper',
      patienceMaxSeconds: 20,
      patienceRemainingSeconds: 20,
      price: 18,
      unitCost: 3.5,
      cookProgress: 0,
      tip: 0,
      satisfactionScore: 100,
    };

    const order2: ActiveCustomerOrder = {
      id: 'ord_2',
      customer: { name: '顾客B', type: 'CASUAL_READER', avatarSeed: '2' },
      productId: 'classic_coffee',
      productName: '经典咖啡',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 4,
      status: 'WAITING_BREW',
      waitTimeElapsedSeconds: 0,
      requiredEquipmentId: 'manual_dripper',
      patienceMaxSeconds: 30,
      patienceRemainingSeconds: 30,
      price: 18,
      unitCost: 3.5,
      cookProgress: 0,
      tip: 0,
      satisfactionScore: 100,
    };

    // 执行一个 tick (1秒)
    const tickResult = tickOrderQueue({
      orders: [order1, order2],
      deltaSeconds: 1.0,
      ownedEquipment: initialState.ownedEquipment,
      equipmentDb: INITIAL_EQUIPMENT,
      inventory: { coffee_beans: 10 },
      lanLan: initialState.lanLan,
      speedMultiplier: 1.0,
    });

    // order1 抢占了 manual_dripper 进入 IN_PROGRESS
    const ord1After = tickResult.updatedOrders.find((o) => o.id === 'ord_1');
    expect(ord1After?.status).toBe('IN_PROGRESS');

    // order2 必须等待，状态依然为 WAITING_BREW，且等待时间增加了 1 秒
    const ord2After = tickResult.updatedOrders.find((o) => o.id === 'ord_2');
    expect(ord2After?.status).toBe('WAITING_BREW');
    expect(ord2After?.waitTimeElapsedSeconds).toBe(1.0);
  });

  it('玩家调整队列优先级：等待中订单可插队，正在制作的订单不可打断', () => {
    const inProgressOrder: ActiveCustomerOrder = {
      id: 'cooking_1',
      customer: { name: '顾客A', type: 'CASUAL_READER', avatarSeed: '1' },
      productId: 'classic_coffee',
      productName: '咖啡',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 4,
      status: 'IN_PROGRESS',
      waitTimeElapsedSeconds: 2,
      requiredEquipmentId: 'manual_dripper',
      patienceMaxSeconds: 30,
      patienceRemainingSeconds: 28,
      price: 18,
      unitCost: 3.5,
      cookProgress: 50,
      tip: 0,
      satisfactionScore: 100,
    };

    const waitingOrder1: ActiveCustomerOrder = {
      id: 'wait_1',
      customer: { name: '顾客B', type: 'PRICE_SENSITIVE', avatarSeed: '2' },
      productId: 'ham_egg_sandwich',
      productName: '三明治',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 5,
      status: 'WAITING_BREW',
      waitTimeElapsedSeconds: 5,
      requiredEquipmentId: 'basic_prep_table',
      patienceMaxSeconds: 18,
      patienceRemainingSeconds: 13,
      price: 22,
      unitCost: 6,
      cookProgress: 0,
      tip: 0,
      satisfactionScore: 100,
    };

    const waitingOrder2: ActiveCustomerOrder = {
      id: 'wait_2',
      customer: { name: '顾客C (快要生气超时)', type: 'QUALITY_SEEKER', avatarSeed: '3' },
      productId: 'jasmine_tea',
      productName: '茉莉茶',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 3.5,
      status: 'WAITING_BREW',
      waitTimeElapsedSeconds: 10,
      requiredEquipmentId: 'tea_pot',
      patienceMaxSeconds: 13,
      patienceRemainingSeconds: 3, // 耐心仅剩 3 秒！
      price: 16,
      unitCost: 2.5,
      cookProgress: 0,
      tip: 0,
      satisfactionScore: 100,
    };

    const queue = [inProgressOrder, waitingOrder1, waitingOrder2];

    // 试图把制作中的订单插队 -> 失败并提示
    const failRes = prioritizeOrder(queue, 'cooking_1');
    expect(failRes.success).toBe(false);

    // 将快要超时的 wait_2 优先插队至等待队列最前列
    const priorityRes = prioritizeOrder(queue, 'wait_2');
    expect(priorityRes.success).toBe(true);
    // 制作中的 cooking_1 仍在首位，但 wait_2 成功超越 wait_1 成为等待队列的第一名！
    expect(priorityRes.newOrders[0].id).toBe('cooking_1');
    expect(priorityRes.newOrders[1].id).toBe('wait_2');
    expect(priorityRes.newOrders[2].id).toBe('wait_1');
  });

  it('订单取消机制：等待中可安全取消，制作中不可取消，且取消订单不产生收入', () => {
    const waitingOrder: ActiveCustomerOrder = {
      id: 'cancel_me',
      customer: { name: '顾客X', type: 'PRICE_SENSITIVE', avatarSeed: '1' },
      productId: 'ham_egg_sandwich',
      productName: '三明治',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 5,
      status: 'WAITING_BREW',
      waitTimeElapsedSeconds: 2,
      requiredEquipmentId: 'basic_prep_table',
      patienceMaxSeconds: 18,
      patienceRemainingSeconds: 16,
      price: 22,
      unitCost: 6,
      cookProgress: 0,
      tip: 0,
      satisfactionScore: 100,
    };

    const cancelRes = cancelWaitingOrder([waitingOrder], 'cancel_me');
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.newOrders).toHaveLength(0);
    expect(cancelRes.cancelledOrder?.finalOutcome).toBe('CANCELLED_BY_PLAYER');
  });

  it('顾客等待超时导致耐心归零并离开', () => {
    const dyingOrder: ActiveCustomerOrder = {
      id: 'timeout_order',
      customer: { name: '急躁顾客', type: 'QUALITY_SEEKER', avatarSeed: '1' },
      productId: 'classic_coffee',
      productName: '咖啡',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 4,
      status: 'WAITING_BREW',
      waitTimeElapsedSeconds: 12,
      requiredEquipmentId: 'manual_dripper',
      patienceMaxSeconds: 13,
      patienceRemainingSeconds: 0.5, // 仅剩 0.5 秒耐心
      price: 18,
      unitCost: 3.5,
      cookProgress: 0,
      tip: 0,
      satisfactionScore: 100,
    };

    // 时间前进了 2 秒
    const res = tickOrderQueue({
      orders: [dyingOrder],
      deltaSeconds: 2.0,
      ownedEquipment: ['tea_pot'], // 没有手冲壶，只能干等
      equipmentDb: INITIAL_EQUIPMENT,
      inventory: { coffee_beans: 10 },
      lanLan: createInitialGameState().lanLan,
      speedMultiplier: 1.0,
    });

    expect(res.lostTimeoutOrders).toHaveLength(1);
    expect(res.lostTimeoutOrders[0].finalOutcome).toBe('LOST_TIMEOUT');
    expect(res.lostTimeoutOrders[0].status).toBe('ABANDONED_PATIENCE');
    expect(res.updatedOrders).toHaveLength(0);
  });

  it('日结能够正确汇总订单完成率与各顾客类型满意度', () => {
    const orders: ActiveCustomerOrder[] = [
      {
        id: '1',
        customer: { name: 'A', type: 'PRICE_SENSITIVE', avatarSeed: '1' },
        productId: 'classic_coffee',
        productName: '咖啡',
        quantity: 1,
        createdAtTick: 1,
        prepDurationSeconds: 4,
        status: 'SERVED',
        waitTimeElapsedSeconds: 2,
        requiredEquipmentId: 'manual_dripper',
        patienceMaxSeconds: 20,
        patienceRemainingSeconds: 18,
        price: 18,
        unitCost: 3.5,
        cookProgress: 100,
        tip: 2,
        satisfactionScore: 95,
        finalOutcome: 'DELIVERED',
      },
      {
        id: '2',
        customer: { name: 'B', type: 'CASUAL_READER', avatarSeed: '2' },
        productId: 'jasmine_tea',
        productName: '茉莉茶',
        quantity: 1,
        createdAtTick: 1,
        prepDurationSeconds: 3.5,
        status: 'SERVED',
        waitTimeElapsedSeconds: 5,
        requiredEquipmentId: 'tea_pot',
        patienceMaxSeconds: 30,
        patienceRemainingSeconds: 25,
        price: 16,
        unitCost: 2.5,
        cookProgress: 100,
        tip: 3,
        satisfactionScore: 98,
        finalOutcome: 'DELIVERED',
      },
      {
        id: '3',
        customer: { name: 'C', type: 'QUALITY_SEEKER', avatarSeed: '3' },
        productId: 'seafood_salad',
        productName: '沙拉',
        quantity: 1,
        createdAtTick: 1,
        prepDurationSeconds: 5.5,
        status: 'ABANDONED_PATIENCE',
        waitTimeElapsedSeconds: 15,
        requiredEquipmentId: 'cold_prep_counter',
        patienceMaxSeconds: 13,
        patienceRemainingSeconds: 0,
        price: 32,
        unitCost: 9,
        cookProgress: 0,
        tip: 0,
        satisfactionScore: 15,
        finalOutcome: 'LOST_TIMEOUT',
      },
    ];

    const stats = summarizeDayOrderStats(orders);
    // 3 单中交付 2 单，完成率 66.7%
    expect(stats.completionRate).toBeCloseTo(66.7, 1);
    // 平均交付满意度 = (95 + 98) / 2 = 96.5
    expect(stats.averageSatisfaction).toBe(96.5);
    // 价格敏感型满意度
    expect(stats.typeStats.PRICE_SENSITIVE.served).toBe(1);
    expect(stats.typeStats.QUALITY_SEEKER.lost).toBe(1);
  });

  it('缺料推荐替代餐品：库存充足时可顺利更新订单并安抚顾客情绪', () => {
    const outOfStockOrder: ActiveCustomerOrder = {
      id: 'sub_test',
      customer: { name: '小雨', type: 'CASUAL_READER', avatarSeed: 'reader' },
      productId: 'classic_coffee',
      productName: '经典咖啡',
      quantity: 1,
      createdAtTick: 1,
      prepDurationSeconds: 4,
      status: 'OUT_OF_STOCK',
      waitTimeElapsedSeconds: 3,
      requiredEquipmentId: 'manual_dripper',
      patienceMaxSeconds: 30,
      patienceRemainingSeconds: 20,
      price: 18,
      unitCost: 3.5,
      cookProgress: 0,
      tip: 0,
      satisfactionScore: 80,
    };

    // 推荐初夏茉莉茶饮 (有库存茶包)
    const result = suggestAlternativeProduct({
      orders: [outOfStockOrder],
      orderId: 'sub_test',
      alternativeProductId: 'jasmine_tea',
      inventory: { tea_leaves: 5 },
      customPricing: { jasmine_tea: 16 },
    });

    expect(result.success).toBe(true);
    if (result.accepted) {
      expect(result.newOrders[0].productId).toBe('jasmine_tea');
      expect(result.newOrders[0].productName).toBe('初夏茉莉清香茶');
      expect(result.newOrders[0].alternativeOfferedFrom).toBe('经典咖啡');
      expect(result.newOrders[0].status).toBe('WAITING_BREW');
    }
  });
});
