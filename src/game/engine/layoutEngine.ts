/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》店铺空间布局与网格装修引擎
 * 核心逻辑：
 * 1. 2D 瓷砖网格系统 (8列 × 6行)
 * 2. 占地碰撞与越界校验、旋转矩阵变换 (0 / 90 / 180 / 270)
 * 3. 出入口连通性与通路阻挡校验 (BFS 寻路防堵死)
 * 4. 实际经营数值换算：座位容量、设备激活、阅读舒适度与猫咪偏好点
 */

import {
  FurnitureItem,
  PlacedFurniture,
  FunctionalZone,
} from '../../types/game';

// 网格规格定义
export const GRID_COLS = 8;
export const GRID_ROWS = 6;
// 店铺出入口位置（左侧门）
export const ENTRANCE_TILE = { x: 0, y: 2 };

// 完整的家具元数据配置库 (六大功能区)
export const FURNITURE_CATALOG: Record<string, FurnitureItem> = {
  // 1. 前台与点单区
  wood_order_counter: {
    id: 'wood_order_counter',
    name: '温润原木点单收银台',
    category: 'COUNTER',
    zone: 'ORDER_COUNTER',
    width: 2,
    height: 1,
    purchaseCost: 0,
    sellPrice: 0,
    canSell: false,
    description: '豆哥接待顾客、点单收银的核心柜台，摆着手绘菜单与零钱罐。',
  },

  // 2. 饮品制作区
  pour_over_bar: {
    id: 'pour_over_bar',
    name: '手冲与慢煮青瓷工作台',
    category: 'BEVERAGE',
    zone: 'BEVERAGE_STATION',
    width: 2,
    height: 1,
    purchaseCost: 0,
    sellPrice: 0,
    canSell: false,
    speedBonus: 0.1,
    associatedEquipmentId: 'manual_dripper',
    description: '集成手冲壶与青瓷茶壶，摆上即激活【咖啡】与【茶饮】制作。',
  },

  // 3. 简餐制作区
  snack_prep_counter: {
    id: 'snack_prep_counter',
    name: '不锈钢轻食料理台',
    category: 'KITCHEN',
    zone: 'KITCHEN_STATION',
    width: 2,
    height: 1,
    purchaseCost: 0,
    sellPrice: 0,
    canSell: false,
    speedBonus: 0.1,
    associatedEquipmentId: 'basic_prep_table',
    description: '整洁的切配台面，摆放即激活【全麦三明治】制作能力。',
  },
  electric_cooker_station: {
    id: 'electric_cooker_station',
    name: '多功能快煮电热台',
    category: 'KITCHEN',
    zone: 'KITCHEN_STATION',
    width: 2,
    height: 1,
    purchaseCost: 120.0,
    sellPrice: 85.0,
    canSell: true,
    speedBonus: 0.15,
    associatedEquipmentId: 'electric_cooker',
    description: '急速沸腾电热炉，摆放即激活【深夜火鸡面】并提供 15% 提速。',
  },
  saute_stove_station: {
    id: 'saute_stove_station',
    name: '铸铁煎炒多功能灶台',
    category: 'KITCHEN',
    zone: 'KITCHEN_STATION',
    width: 2,
    height: 1,
    purchaseCost: 220.0,
    sellPrice: 155.0,
    canSell: true,
    speedBonus: 0.15,
    associatedEquipmentId: 'saute_stove',
    description: '强劲大火力煎炒灶，摆放即激活【黄金炒饭】并提供 15% 提速。',
  },
  cold_prep_counter_station: {
    id: 'cold_prep_counter_station',
    name: '低温保鲜冷藏料理中岛',
    category: 'KITCHEN',
    zone: 'KITCHEN_STATION',
    width: 2,
    height: 1,
    purchaseCost: 320.0,
    sellPrice: 225.0,
    canSell: true,
    speedBonus: 0.2,
    associatedEquipmentId: 'cold_prep_counter',
    description: '恒温保鲜果蔬海鲜，摆放即激活【鲜虾海鲜沙拉】并提供 20% 提速。',
  },

  // 4. 阅读客座区 (直接影响店内接待容量与阅读型顾客体验)
  oak_double_table: {
    id: 'oak_double_table',
    name: '白橡木双人阅读方桌',
    category: 'SEATING',
    zone: 'READING_AREA',
    width: 2,
    height: 1,
    purchaseCost: 65.0,
    sellPrice: 45.0,
    canSell: true,
    seatCapacity: 2,
    readingSatisfactionBonus: 6,
    description: '两把舒适实木靠椅，可同时容纳 2 位顾客入座阅读与用餐。',
  },
  cozy_single_sofa: {
    id: 'cozy_single_sofa',
    name: '布艺单人深陷抱枕沙发',
    category: 'SEATING',
    zone: 'READING_AREA',
    width: 1,
    height: 1,
    purchaseCost: 45.0,
    sellPrice: 30.0,
    canSell: true,
    seatCapacity: 1,
    readingSatisfactionBonus: 10,
    description: '极柔软的包容感，深受阅读休闲型读者青睐 (+10 满意度)。',
  },
  window_counter_seats: {
    id: 'window_counter_seats',
    name: '阳光双人吧台高脚桌',
    category: 'SEATING',
    zone: 'READING_AREA',
    width: 2,
    height: 1,
    purchaseCost: 80.0,
    sellPrice: 55.0,
    canSell: true,
    seatCapacity: 2,
    readingSatisfactionBonus: 8,
    description: '采光通透，适合看书看风景，容纳 2 位顾客。',
  },

  // 5. 书架区 (增加藏书吸引力与阅读加成)
  tall_pine_bookshelf: {
    id: 'tall_pine_bookshelf',
    name: '暖光白松落地大书架',
    category: 'BOOKSHELF',
    zone: 'BOOKSHELF_AREA',
    width: 2,
    height: 1,
    purchaseCost: 75.0,
    sellPrice: 50.0,
    canSell: true,
    readingSatisfactionBonus: 12,
    description: '摆满文学、画册与哲学书籍，阅读型顾客入座时满意度大幅提升。',
  },
  low_comic_bookcase: {
    id: 'low_comic_bookcase',
    name: '矮柜展示绘本书架',
    category: 'BOOKSHELF',
    zone: 'BOOKSHELF_AREA',
    width: 1,
    height: 1,
    purchaseCost: 40.0,
    sellPrice: 28.0,
    canSell: true,
    readingSatisfactionBonus: 7,
    description: '封面朝外展示手绘连环画与猫咪绘本，温馨惬意。',
  },

  // 6. 猫咪活动区 (影响兰兰的打盹与巡视路线)
  sisal_cat_tree: {
    id: 'sisal_cat_tree',
    name: '剑麻缠绕四层猫爬架',
    category: 'CAT_ZONE',
    zone: 'CAT_ZONE',
    width: 1,
    height: 1,
    purchaseCost: 85.0,
    sellPrice: 55.0,
    canSell: true,
    catAttraction: 30,
    description: '兰兰巡视全书咖的至高点，常趴在顶层俯瞰读者打呼噜。',
  },
  soft_fluffy_cat_bed: {
    id: 'soft_fluffy_cat_bed',
    name: '羊羔绒软蓬蓬猫窝',
    category: 'CAT_ZONE',
    zone: 'CAT_ZONE',
    width: 1,
    height: 1,
    purchaseCost: 35.0,
    sellPrice: 22.0,
    canSell: true,
    catAttraction: 20,
    description: '暖烘烘的深陷式小窝，兰兰最爱在此踩奶打瞌睡。',
  },
  yarn_scratching_mat: {
    id: 'yarn_scratching_mat',
    name: '天然麻绳猫抓垫与毛球',
    category: 'CAT_ZONE',
    zone: 'CAT_ZONE',
    width: 1,
    height: 1,
    purchaseCost: 25.0,
    sellPrice: 15.0,
    canSell: true,
    catAttraction: 15,
    description: '耐抓耐磨的小抓垫，挂着一团轻晃的毛线球。',
  },
};

/**
 * 初始开业默认家具摆放方案
 */
export const DEFAULT_INITIAL_PLACED_FURNITURE: PlacedFurniture[] = [
  // 前台点单吧台 (x: 1, y: 1, 占地 2x1)
  { instanceId: 'inst_counter_1', furnitureId: 'wood_order_counter', x: 1, y: 1, rotation: 0 },
  // 手冲与茶饮制作台 (x: 3, y: 1, 占地 2x1)
  { instanceId: 'inst_bev_1', furnitureId: 'pour_over_bar', x: 3, y: 1, rotation: 0 },
  // 简餐料理台 (x: 5, y: 1, 占地 2x1)
  { instanceId: 'inst_snack_1', furnitureId: 'snack_prep_counter', x: 5, y: 1, rotation: 0 },

  // 双人阅读木桌 A (x: 2, y: 4, 占地 2x1, 2座)
  { instanceId: 'inst_table_1', furnitureId: 'oak_double_table', x: 2, y: 4, rotation: 0 },
  // 双人阅读木桌 B (x: 5, y: 4, 占地 2x1, 2座)
  { instanceId: 'inst_table_2', furnitureId: 'oak_double_table', x: 5, y: 4, rotation: 0 },

  // 落地大书架 (x: 7, y: 1, 占地 1x2，通过旋转变为 1列×2行)
  { instanceId: 'inst_shelf_1', furnitureId: 'tall_pine_bookshelf', x: 7, y: 1, rotation: 90 },

  // 猫爬架 (x: 7, y: 4, 占地 1x1)
  { instanceId: 'inst_cat_1', furnitureId: 'sisal_cat_tree', x: 7, y: 4, rotation: 0 },
];

/**
 * 计算旋转后的实际占地宽高 (0/180度保持原尺寸，90/270度长宽互换)
 */
export function getRotatedDimensions(
  furniture: FurnitureItem,
  rotation: 0 | 90 | 180 | 270
): { w: number; h: number } {
  if (rotation === 90 || rotation === 270) {
    return { w: furniture.height, h: furniture.width };
  }
  return { w: furniture.width, h: furniture.height };
}

/**
 * 校验家具摆放合法性 (纯函数)
 * 校验规则：
 * 1. 越界检查 (必须完全在 8×6 网格内)
 * 2. 大门禁占 (不得压住出入口 tile: 0, 2)
 * 3. 空间重叠 (不得与已有其他家具冲突)
 * 4. 寻路通道检查 (出入口必须可通过 BFS 访问到前台吧台和至少一个座位，禁止堵死全屋)
 */
export function validatePlacement(params: {
  furnitureId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  placedFurniture: PlacedFurniture[];
  ignoreInstanceId?: string; // 移动已有家具时忽略自身
}): { valid: boolean; error?: string } {
  const { furnitureId, x, y, rotation, placedFurniture, ignoreInstanceId } = params;
  const item = FURNITURE_CATALOG[furnitureId];
  if (!item) {
    return { valid: false, error: '未找到该家具数据' };
  }

  const { w, h } = getRotatedDimensions(item, rotation);

  // 1. 边界检查
  if (x < 0 || y < 0 || x + w > GRID_COLS || y + h > GRID_ROWS) {
    return { valid: false, error: `摆放超出店铺边界 (占地 ${w}×${h} 格)` };
  }

  // 2. 出入口禁占检查
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      if (x + dx === ENTRANCE_TILE.x && y + dy === ENTRANCE_TILE.y) {
        return { valid: false, error: '不能遮挡书咖出入大门！' };
      }
    }
  }

  // 3. 碰撞重叠检查
  // 构建当前被占用的格子矩阵
  const occupiedGrid: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array(GRID_COLS).fill(false)
  );

  for (const placed of placedFurniture) {
    if (ignoreInstanceId && placed.instanceId === ignoreInstanceId) continue;
    const existingItem = FURNITURE_CATALOG[placed.furnitureId];
    if (!existingItem) continue;
    const dims = getRotatedDimensions(existingItem, placed.rotation);
    for (let dx = 0; dx < dims.w; dx++) {
      for (let dy = 0; dy < dims.h; dy++) {
        const px = placed.x + dx;
        const py = placed.y + dy;
        if (px >= 0 && px < GRID_COLS && py >= 0 && py < GRID_ROWS) {
          occupiedGrid[py][px] = true;
        }
      }
    }
  }

  // 检查新家具所占格子是否被占用
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      const px = x + dx;
      const py = y + dy;
      if (occupiedGrid[py][px]) {
        return { valid: false, error: '该位置已有其他家具摆放，无法重叠' };
      }
    }
  }

  // 4. 通道连通性检查 (BFS 寻路)
  // 模拟将该家具放入网格
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      occupiedGrid[y + dy][x + dx] = true;
    }
  }

  // 从大门 ENTRANCE_TILE (0, 2) 发起 BFS
  const visited: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array(GRID_COLS).fill(false)
  );
  const queue: { x: number; y: number }[] = [{ x: ENTRANCE_TILE.x, y: ENTRANCE_TILE.y }];
  visited[ENTRANCE_TILE.y][ENTRANCE_TILE.x] = true;

  let reachableFreeTiles = 0;
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    reachableFreeTiles++;

    for (const dir of directions) {
      const nx = cur.x + dir.dx;
      const ny = cur.y + dir.dy;
      if (
        nx >= 0 &&
        nx < GRID_COLS &&
        ny >= 0 &&
        ny < GRID_ROWS &&
        !visited[ny][nx] &&
        !occupiedGrid[ny][nx]
      ) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    }
  }

  // 如果从大门可通行的有效连通空格少于 8 格，说明把室内通道完全堵死了
  if (reachableFreeTiles < 8) {
    return { valid: false, error: '不能堵死店内行走通道！出入口与室内必须保持畅通。' };
  }

  return { valid: true };
}

/**
 * 汇总计算当前摆放布局对经营系统的实际加成指标
 */
export function calculateStoreLayoutMetrics(placedFurniture: PlacedFurniture[]): {
  totalSeatCapacity: number;
  activeEquipmentIds: string[];
  totalReadingBonus: number;
  totalSpeedBonus: number;
  catSpots: { x: number; y: number; name: string }[];
} {
  let totalSeatCapacity = 0;
  const activeEquipmentSet = new Set<string>();
  let totalReadingBonus = 0;
  let totalSpeedBonus = 0;
  const catSpots: { x: number; y: number; name: string }[] = [];

  for (const placed of placedFurniture) {
    const item = FURNITURE_CATALOG[placed.furnitureId];
    if (!item) continue;

    if (item.seatCapacity) {
      totalSeatCapacity += item.seatCapacity;
    }
    if (item.associatedEquipmentId) {
      activeEquipmentSet.add(item.associatedEquipmentId);
    }
    if (item.readingSatisfactionBonus) {
      totalReadingBonus += item.readingSatisfactionBonus;
    }
    if (item.speedBonus) {
      totalSpeedBonus += item.speedBonus;
    }
    if (item.category === 'CAT_ZONE') {
      catSpots.push({ x: placed.x, y: placed.y, name: item.name });
    }
  }

  return {
    // 最少保留 2 个站立临时位，保障基础营业
    totalSeatCapacity: Math.max(2, totalSeatCapacity),
    activeEquipmentIds: Array.from(activeEquipmentSet),
    totalReadingBonus,
    totalSpeedBonus,
    catSpots,
  };
}

/**
 * 购买家具并置入玩家仓库背包
 */
export function buyFurnitureToStorage(
  furnitureId: string,
  currentCash: number,
  storedFurniture: string[]
): {
  success: boolean;
  newCash: number;
  newStoredFurniture: string[];
  cost: number;
  error?: string;
} {
  const item = FURNITURE_CATALOG[furnitureId];
  if (!item) {
    return { success: false, newCash: currentCash, newStoredFurniture: storedFurniture, cost: 0, error: '家具不存在' };
  }

  if (currentCash < item.purchaseCost) {
    return {
      success: false,
      newCash: currentCash,
      newStoredFurniture: storedFurniture,
      cost: item.purchaseCost,
      error: `资金不足！购买【${item.name}】需支付 ¥${item.purchaseCost.toFixed(2)}，当前现金 ¥${currentCash.toFixed(2)}`,
    };
  }

  return {
    success: true,
    newCash: Math.round((currentCash - item.purchaseCost) * 100) / 100,
    newStoredFurniture: [...storedFurniture, furnitureId],
    cost: item.purchaseCost,
  };
}

/**
 * 出售仓库中的家具回收资金
 */
export function sellFurnitureFromStorage(
  furnitureId: string,
  currentCash: number,
  storedFurniture: string[]
): {
  success: boolean;
  newCash: number;
  newStoredFurniture: string[];
  refund: number;
  error?: string;
} {
  const item = FURNITURE_CATALOG[furnitureId];
  if (!item || !item.canSell) {
    return { success: false, newCash: currentCash, newStoredFurniture: storedFurniture, refund: 0, error: '该基础家具为非卖品' };
  }

  const idx = storedFurniture.indexOf(furnitureId);
  if (idx === -1) {
    return { success: false, newCash: currentCash, newStoredFurniture: storedFurniture, refund: 0, error: '仓库中未找到该家具' };
  }

  const updatedStorage = [...storedFurniture];
  updatedStorage.splice(idx, 1);
  const refund = item.sellPrice;
  const newCash = Math.round((currentCash + refund) * 100) / 100;

  return {
    success: true,
    newCash,
    newStoredFurniture: updatedStorage,
    refund,
  };
}
