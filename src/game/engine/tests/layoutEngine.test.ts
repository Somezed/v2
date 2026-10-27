/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 自动化测试：空间布局与网格装修引擎
 */

import { describe, it, expect } from 'vitest';
import {
  GRID_COLS,
  GRID_ROWS,
  ENTRANCE_TILE,
  FURNITURE_CATALOG,
  DEFAULT_INITIAL_PLACED_FURNITURE,
  getRotatedDimensions,
  validatePlacement,
  calculateStoreLayoutMetrics,
  buyFurnitureToStorage,
  sellFurnitureFromStorage,
} from '../layoutEngine';
import { PlacedFurniture } from '../../../types/game';

describe('空间布局与装修引擎测试 (LayoutEngine)', () => {
  it('旋转占地尺寸计算准确 (0/90/180/270度)', () => {
    const table = FURNITURE_CATALOG['oak_double_table']; // width: 2, height: 1
    expect(getRotatedDimensions(table, 0)).toEqual({ w: 2, h: 1 });
    expect(getRotatedDimensions(table, 90)).toEqual({ w: 1, h: 2 });
    expect(getRotatedDimensions(table, 180)).toEqual({ w: 2, h: 1 });
    expect(getRotatedDimensions(table, 270)).toEqual({ w: 1, h: 2 });

    const singleSofa = FURNITURE_CATALOG['cozy_single_sofa']; // width: 1, height: 1
    expect(getRotatedDimensions(singleSofa, 90)).toEqual({ w: 1, h: 1 });
  });

  it('摆放校验：合法位置可成功放置', () => {
    const result = validatePlacement({
      furnitureId: 'cozy_single_sofa',
      x: 3,
      y: 3,
      rotation: 0,
      placedFurniture: [],
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('摆放校验：越界摆放被拦截', () => {
    // 8x6 网格，从 x=7 放置宽度为 2 的桌子会超出 (7+2=9 > 8)
    const resultX = validatePlacement({
      furnitureId: 'oak_double_table',
      x: 7,
      y: 2,
      rotation: 0,
      placedFurniture: [],
    });
    expect(resultX.valid).toBe(false);
    expect(resultX.error).toContain('超出店铺边界');

    // y 越界
    const resultY = validatePlacement({
      furnitureId: 'oak_double_table',
      x: 2,
      y: 6,
      rotation: 0,
      placedFurniture: [],
    });
    expect(resultY.valid).toBe(false);
    expect(resultY.error).toContain('超出店铺边界');
  });

  it('摆放校验：禁止遮挡书咖出入大门 (0, 2)', () => {
    const result = validatePlacement({
      furnitureId: 'cozy_single_sofa',
      x: ENTRANCE_TILE.x,
      y: ENTRANCE_TILE.y,
      rotation: 0,
      placedFurniture: [],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('不能遮挡书咖出入大门');
  });

  it('摆放校验：禁止与其他家具重叠', () => {
    const existing: PlacedFurniture[] = [
      { instanceId: 'test_1', furnitureId: 'oak_double_table', x: 2, y: 2, rotation: 0 },
    ];
    // oak_double_table 占 (2,2) 和 (3,2)
    const overlapResult = validatePlacement({
      furnitureId: 'cozy_single_sofa',
      x: 3,
      y: 2,
      rotation: 0,
      placedFurniture: existing,
    });
    expect(overlapResult.valid).toBe(false);
    expect(overlapResult.error).toContain('已有其他家具');

    // 移动自身时，通过 ignoreInstanceId 允许原位或自身重叠
    const selfMove = validatePlacement({
      furnitureId: 'oak_double_table',
      x: 2,
      y: 2,
      rotation: 90,
      placedFurniture: existing,
      ignoreInstanceId: 'test_1',
    });
    expect(selfMove.valid).toBe(true);
  });

  it('摆放校验：BFS 寻路阻挡检测，禁止堵死店内行走通道', () => {
    // 构造把大门 (0, 2) 封死的环绕家具
    // 大门在 (0, 2)，周围是 (0, 1), (1, 2), (0, 3)
    const blockingFurniture: PlacedFurniture[] = [
      { instanceId: 'b1', furnitureId: 'cozy_single_sofa', x: 0, y: 1, rotation: 0 },
      { instanceId: 'b2', furnitureId: 'cozy_single_sofa', x: 0, y: 3, rotation: 0 },
    ];
    // 尝试在 (1, 2) 摆放单人沙发，将大门彻底封死
    const blockResult = validatePlacement({
      furnitureId: 'cozy_single_sofa',
      x: 1,
      y: 2,
      rotation: 0,
      placedFurniture: blockingFurniture,
    });
    expect(blockResult.valid).toBe(false);
    expect(blockResult.error).toContain('不能堵死店内行走通道');
  });

  it('计算店铺布局经营指标：座位数、激活设备、阅读加成与猫咪偏好点', () => {
    const metrics = calculateStoreLayoutMetrics(DEFAULT_INITIAL_PLACED_FURNITURE);

    // 默认初始方案包含 2 张双人桌 (2*2 = 4 座)
    expect(metrics.totalSeatCapacity).toBe(4);

    // 默认初始包含 pour_over_bar (manual_dripper) 和 snack_prep_counter (basic_prep_table)
    expect(metrics.activeEquipmentIds).toContain('manual_dripper');
    expect(metrics.activeEquipmentIds).toContain('basic_prep_table');

    // 落地大书架和双人桌贡献阅读满意度加成
    expect(metrics.totalReadingBonus).toBeGreaterThan(0);

    // 包含猫爬架，猫咪打盹点
    expect(metrics.catSpots.length).toBeGreaterThan(0);
    expect(metrics.catSpots[0].name).toContain('猫爬架');
  });

  it('购买家具与出售家具到仓库流程', () => {
    const sofa = FURNITURE_CATALOG['cozy_single_sofa']; // cost: 45, sell: 30
    const startCash = 100.0;
    const initialStorage: string[] = [];

    // 1. 成功购买
    const buyRes = buyFurnitureToStorage('cozy_single_sofa', startCash, initialStorage);
    expect(buyRes.success).toBe(true);
    expect(buyRes.newCash).toBe(55.0);
    expect(buyRes.newStoredFurniture).toEqual(['cozy_single_sofa']);

    // 2. 资金不足购买被拒
    const poorBuy = buyFurnitureToStorage('cold_prep_counter_station', 10.0, buyRes.newStoredFurniture);
    expect(poorBuy.success).toBe(false);
    expect(poorBuy.error).toContain('资金不足');

    // 3. 成功出售仓库家具
    const sellRes = sellFurnitureFromStorage('cozy_single_sofa', buyRes.newCash, buyRes.newStoredFurniture);
    expect(sellRes.success).toBe(true);
    expect(sellRes.newCash).toBe(85.0); // 55 + 30
    expect(sellRes.newStoredFurniture).toEqual([]);

    // 4. 尝试出售非卖基础品 (如收银台) 被拒
    const nonSellable = sellFurnitureFromStorage('wood_order_counter', 100, ['wood_order_counter']);
    expect(nonSellable.success).toBe(false);
    expect(nonSellable.error).toContain('非卖品');
  });
});
