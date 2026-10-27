/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》首版经营闭环数据配置
 * 包含六类商品、对应原材料规格、设备台与初始经营状态
 */

import {
  Ingredient,
  MenuItem,
  EquipmentItem,
  GameSaveData,
  CURRENT_SAVE_VERSION,
  FixedCostBreakdown,
} from '../../types/game';
import { DEFAULT_INITIAL_PLACED_FURNITURE } from '../engine/layoutEngine';
import { createDefaultDouGeLifeState } from './douGeLifeData';
import { createDefaultLanLanBehaviorState } from './lanlanData';
import {
  createDefaultGrowthState,
  createDefaultRegularCustomers,
  createDefaultAutoRestockConfig,
  createDefaultLoanState,
  createDefaultAlmanacState,
} from './growthData';
import { generateDailyWeather } from '../engine/weatherEngine';

// 每日固定经营杂费明细 (商铺房租水电 + 豆哥日常支出 + 兰兰猫粮猫砂生活保障)
export const DEFAULT_FIXED_COST_BREAKDOWN: FixedCostBreakdown = {
  rent: 32.0,        // 商用门面租金与物业管费
  utilities: 16.0,   // 商用水电燃气与千兆光纤宽带
  dougeLiving: 14.0, // 豆哥工作餐与日常生活津贴
  catFood: 10.0,     // 兰兰纯肉主食罐头与营养冻干
  catLitter: 6.0,    // 兰兰豆腐除臭猫砂与眼耳清洁
  storeHygiene: 4.0, // 店面日常消杀与绿植养护
  total: 82.0,
};

// 每日固定经营杂费总额
export const DAILY_FIXED_OPERATING_COST = DEFAULT_FIXED_COST_BREAKDOWN.total;

// 原材料库 (配置采购单价、采购单位、库存上限、制作消耗)
export const INITIAL_INGREDIENTS: Record<string, Ingredient> = {
  coffee_beans: {
    id: 'coffee_beans',
    name: '精选咖啡豆',
    unit: '份',
    costPrice: 3.5,
    maxStock: 40,
    description: '中深烘焙埃塞俄比亚咖啡豆，磨粉散发坚果与焦糖香。',
  },
  tea_leaves: {
    id: 'tea_leaves',
    name: '特选茉莉茶叶',
    unit: '包',
    costPrice: 2.5,
    maxStock: 40,
    description: '鲜灵清芬的七窨伏花茉莉，茶汤黄绿明亮。',
  },
  sandwich_set: {
    id: 'sandwich_set',
    name: '火腿蛋全麦配料组',
    unit: '份',
    costPrice: 6.0,
    maxStock: 30,
    description: '全麦吐司切片、低脂火腿片、新鲜鸡蛋与清脆生菜。',
  },
  noodles_set: {
    id: 'noodles_set',
    name: '劲道面饼与辣酱包',
    unit: '份',
    costPrice: 4.5,
    maxStock: 35,
    description: '特浓超辣火鸡面调料与粗圆拉面面饼，附带炒芝麻海苔碎。',
  },
  rice_set: {
    id: 'rice_set',
    name: '香米与土鸡蛋配料',
    unit: '份',
    costPrice: 5.5,
    maxStock: 30,
    description: '冷饭颗粒分明、农家土鸡蛋、香葱与秘制特调酱油。',
  },
  seafood_set: {
    id: 'seafood_set',
    name: '深海鲜虾金枪鱼生鲜',
    unit: '份',
    costPrice: 9.0,
    maxStock: 25,
    description: '无抗生素白虾仁、油浸金枪鱼块与进口油醋罗马生菜。',
  },
  cat_treat_fish: {
    id: 'cat_treat_fish',
    name: '深海小银鱼冻干',
    unit: '条',
    costPrice: 2.0,
    maxStock: 30,
    description: '兰兰最爱的无添加冻干小鱼干，咬起来咔嚓咔嚓。',
  },
};

// 六大核心在售商品配置
export const INITIAL_MENU_ITEMS: Record<string, MenuItem> = {
  classic_coffee: {
    id: 'classic_coffee',
    name: '豆哥经典手冲咖啡',
    category: 'COFFEE',
    basePrice: 18.0,
    minPrice: 10.0,
    maxPrice: 35.0,
    requiredIngredients: [{ ingredientId: 'coffee_beans', amount: 1 }],
    prepTimeSeconds: 4.0,
    requiredEquipmentId: 'manual_dripper',
    demandTags: ['提神', '饮品', '苦甘', '书友常点'],
    unlockLevel: 1,
    description: '现磨现冲，注水如画，散发着安宁的书卷香。',
  },
  jasmine_tea: {
    id: 'jasmine_tea',
    name: '初夏茉莉清香茶',
    category: 'TEA',
    basePrice: 16.0,
    minPrice: 8.0,
    maxPrice: 30.0,
    requiredIngredients: [{ ingredientId: 'tea_leaves', amount: 1 }],
    prepTimeSeconds: 3.5,
    requiredEquipmentId: 'tea_pot',
    demandTags: ['清淡', '慢读', '解腻', '温润'],
    unlockLevel: 1,
    description: '透明玻璃茶具中茶叶舒展，澄澈温和，回甘悠长。',
  },
  ham_egg_sandwich: {
    id: 'ham_egg_sandwich',
    name: '全麦火腿蛋三明治',
    category: 'SANDWICH',
    basePrice: 22.0,
    minPrice: 14.0,
    maxPrice: 40.0,
    requiredIngredients: [{ ingredientId: 'sandwich_set', amount: 1 }],
    prepTimeSeconds: 5.0,
    requiredEquipmentId: 'basic_prep_table',
    demandTags: ['轻食', '饱腹', '快手', '读者最爱'],
    unlockLevel: 1,
    description: '酥脆金黄的吐司夹着香气腾腾的荷包蛋，元气满满。',
  },
  buldak_spicy_noodles: {
    id: 'buldak_spicy_noodles',
    name: '深夜招牌火鸡面',
    category: 'NOODLES',
    basePrice: 20.0,
    minPrice: 12.0,
    maxPrice: 36.0,
    requiredIngredients: [{ ingredientId: 'noodles_set', amount: 1 }],
    prepTimeSeconds: 6.0,
    requiredEquipmentId: 'electric_cooker',
    demandTags: ['重口', '解压', '夜宵', '青年热捧'],
    unlockLevel: 1,
    description: '拌匀后红亮油润，辣味直冲脑门，读书疲惫时瞬间醒脑。',
  },
  douge_fried_rice: {
    id: 'douge_fried_rice',
    name: '豆哥秘制黄金炒饭',
    category: 'FRIED_RICE',
    basePrice: 26.0,
    minPrice: 16.0,
    maxPrice: 48.0,
    requiredIngredients: [{ ingredientId: 'rice_set', amount: 1 }],
    prepTimeSeconds: 7.0,
    requiredEquipmentId: 'saute_stove',
    demandTags: ['正餐', '热食', '饱腹', '老少皆宜'],
    unlockLevel: 1,
    description: '金黄蛋液均匀裹满每一粒米饭，锅气十足，粒粒分明。',
  },
  seafood_salad: {
    id: 'seafood_salad',
    name: '鲜虾金枪鱼轻食沙拉',
    category: 'SALAD',
    basePrice: 32.0,
    minPrice: 20.0,
    maxPrice: 58.0,
    requiredIngredients: [{ ingredientId: 'seafood_set', amount: 1 }],
    prepTimeSeconds: 5.5,
    requiredEquipmentId: 'cold_prep_counter',
    demandTags: ['健康', '低卡', '高端', '精致轻奢'],
    unlockLevel: 1,
    description: '紧致白虾搭配大块金枪鱼与脆爽罗马生菜，清爽饱满。',
  },
};

// 基础与可购置设备配置
export const INITIAL_EQUIPMENT: Record<string, EquipmentItem> = {
  manual_dripper: {
    id: 'manual_dripper',
    name: '复古细口手冲壶',
    category: 'BREWING',
    tier: 1,
    purchaseCost: 0, // 初始自带
    dailyMaintenanceCost: 1.0,
    speedBonus: 0,
    reputationBonus: 5,
    description: '细长鹅颈水流平稳，豆哥最趁手的起家工具。制作咖啡必备。',
  },
  tea_pot: {
    id: 'tea_pot',
    name: '青瓷慢煮茶壶',
    category: 'BREWING',
    tier: 1,
    purchaseCost: 0, // 初始自带
    dailyMaintenanceCost: 1.0,
    speedBonus: 0,
    reputationBonus: 5,
    description: '温润青瓷保温良好，慢出茶香。制作茶饮必备。',
  },
  basic_prep_table: {
    id: 'basic_prep_table',
    name: '简易轻食料理台',
    category: 'PREP',
    tier: 1,
    purchaseCost: 0, // 初始自带
    dailyMaintenanceCost: 1.5,
    speedBonus: 0,
    reputationBonus: 5,
    description: '不锈钢案板与面包切刀，干净利索。制作三明治必备。',
  },
  electric_cooker: {
    id: 'electric_cooker',
    name: '快煮多功能电热锅',
    category: 'COOKING',
    tier: 1,
    purchaseCost: 120.0,
    dailyMaintenanceCost: 2.0,
    speedBonus: 0.1,
    reputationBonus: 15,
    description: '急速升温沸水，火候均匀。解锁并制作【火鸡面】必备。',
  },
  saute_stove: {
    id: 'saute_stove',
    name: '铸铁煎炒多功能炉',
    category: 'COOKING',
    tier: 1,
    purchaseCost: 220.0,
    dailyMaintenanceCost: 2.5,
    speedBonus: 0.15,
    reputationBonus: 20,
    description: '强劲大火力，锁住炒饭香气。解锁并制作【炒饭】必备。',
  },
  cold_prep_counter: {
    id: 'cold_prep_counter',
    name: '低温保鲜冷藏料理台',
    category: 'PREP',
    tier: 1,
    purchaseCost: 320.0,
    dailyMaintenanceCost: 3.5,
    speedBonus: 0.15,
    reputationBonus: 25,
    description: '恒温保鲜海鲜生鲜果蔬。解锁并制作【海鲜沙拉】必备。',
  },
};

// 三大基础顾客类型原型配置
export const CUSTOMER_ARCHETYPES: Record<import('../../types/game').CustomerType, import('../../types/game').CustomerArchetype> = {
  PRICE_SENSITIVE: {
    id: 'price_sensitive',
    name: '价格敏感型',
    type: 'PRICE_SENSITIVE',
    avatarSeed: 'student_saver',
    preferredProductIds: ['ham_egg_sandwich', 'classic_coffee', 'buldak_spicy_noodles'],
    priceSensitivity: 1.6, // 超出基准价极易嫌贵，但遇到折扣或平价非常满意
    basePatienceSeconds: 18, // 耐心中等
    environmentWeight: 0.15,
    tipProbability: 0.08,
    description: '关注高性价比与实惠优惠，遇到平价餐品会非常开心并给予好评。',
  },
  QUALITY_SEEKER: {
    id: 'quality_seeker',
    name: '品质追求型',
    type: 'QUALITY_SEEKER',
    avatarSeed: 'gourmet_critic',
    preferredProductIds: ['seafood_salad', 'douge_fried_rice', 'classic_coffee'],
    priceSensitivity: 0.7, // 愿意为好品质支付高价
    basePatienceSeconds: 13, // 耐心较低，不耐烦长时间排队
    environmentWeight: 0.25,
    tipProbability: 0.45,
    description: '追求食材新鲜度、制作工艺与出餐速度，满意时会大方留下丰厚小费。',
  },
  CASUAL_READER: {
    id: 'casual_reader',
    name: '阅读休闲型',
    type: 'CASUAL_READER',
    avatarSeed: 'cozy_reader',
    preferredProductIds: ['jasmine_tea', 'classic_coffee', 'ham_egg_sandwich'],
    priceSensitivity: 1.0,
    basePatienceSeconds: 32, // 耐心极长
    environmentWeight: 0.45, // 极度看重猫咪互动、安静阅读氛围
    tipProbability: 0.50,
    description: '喜欢在书咖看书、摸猫消磨时光，耐心充裕，猫咪心情好时极大概率给小费。',
  },
};

// 预设知名常客库 (按顾客类型分类，扩充至24位各具特色的顾客)
export const NAMED_CUSTOMERS: { name: string; type: import('../../types/game').CustomerType; avatarSeed: string }[] = [
  // 1. 价格敏感型 (关注性价比与出餐速度)
  { name: '备考大学生·小静', type: 'PRICE_SENSITIVE', avatarSeed: 'student_1' },
  { name: '省钱实习生·阿泽', type: 'PRICE_SENSITIVE', avatarSeed: 'intern_1' },
  { name: '考研学霸·哲哲', type: 'PRICE_SENSITIVE', avatarSeed: 'study_1' },
  { name: '兼职骑手·强子', type: 'PRICE_SENSITIVE', avatarSeed: 'courier_1' },
  { name: '精打细算·林同学', type: 'PRICE_SENSITIVE', avatarSeed: 'student_2' },
  { name: '早八打卡族·小凯', type: 'PRICE_SENSITIVE', avatarSeed: 'commuter_1' },
  { name: '二手书店店员·阿荣', type: 'PRICE_SENSITIVE', avatarSeed: 'clerk_1' },
  { name: '夜校进修生·晓涵', type: 'PRICE_SENSITIVE', avatarSeed: 'night_student' },

  // 2. 品质追求型 (追求高风味、新鲜度与专业度，多留小费)
  { name: '美食探店博主·周周', type: 'QUALITY_SEEKER', avatarSeed: 'critic_1' },
  { name: '独立设计师·苏苏', type: 'QUALITY_SEEKER', avatarSeed: 'designer_1' },
  { name: '咖啡品鉴达人·老何', type: 'QUALITY_SEEKER', avatarSeed: 'barista_fan' },
  { name: '建筑事务所·顾总', type: 'QUALITY_SEEKER', avatarSeed: 'architect_1' },
  { name: '古典乐大提琴手·安娜', type: 'QUALITY_SEEKER', avatarSeed: 'musician_1' },
  { name: '西点烘焙师·可可', type: 'QUALITY_SEEKER', avatarSeed: 'pastry_chef' },
  { name: '健身私教·雷蒙', type: 'QUALITY_SEEKER', avatarSeed: 'trainer_1' },
  { name: '资深香薰调香师·岚姐', type: 'QUALITY_SEEKER', avatarSeed: 'perfumer_1' },

  // 3. 阅读休闲型 (享受安静、看书看猫、高耐心)
  { name: '自由撰稿人·阿澈', type: 'CASUAL_READER', avatarSeed: 'writer_1' },
  { name: '绘本插画师·米米', type: 'CASUAL_READER', avatarSeed: 'artist_1' },
  { name: '常客宋阿姨', type: 'CASUAL_READER', avatarSeed: 'auntie_1' },
  { name: '植物系博主·小绿', type: 'CASUAL_READER', avatarSeed: 'botanist_1' },
  { name: '退休历史特级教师·严老', type: 'CASUAL_READER', avatarSeed: 'teacher_elder' },
  { name: '猫咪摄影师·阿麦', type: 'CASUAL_READER', avatarSeed: 'photographer_1' },
  { name: '天文爱好者·星辰', type: 'CASUAL_READER', avatarSeed: 'astronomer_1' },
  { name: '穿戴甲闺蜜同好·诺诺', type: 'CASUAL_READER', avatarSeed: 'nail_friend_1' },
];

// 创建开业初始数据状态
export function createInitialGameState(): GameSaveData {
  return {
    version: CURRENT_SAVE_VERSION,
    saveTimestamp: Date.now(),
    storeName: '豆哥的猫咪书咖',
    currentDay: 1,
    dailyPhase: 'MORNING_BRIEFING', // 始于晨间简报
    cash: 300.0, // 初始启动现金 300 元
    reputation: 60, // 初始声誉
    
    // 默认自定价格（等于各商品建议售价）
    customPricing: {
      classic_coffee: 18.0,
      jasmine_tea: 16.0,
      ham_egg_sandwich: 22.0,
      buldak_spicy_noodles: 20.0,
      douge_fried_rice: 26.0,
      seafood_salad: 32.0,
    },
    // 默认在售状态：有初始设备的默认在售，需要高端设备的初始停售直到购买设备
    menuOnSale: {
      classic_coffee: true,
      jasmine_tea: true,
      ham_egg_sandwich: true,
      buldak_spicy_noodles: false,
      douge_fried_rice: false,
      seafood_salad: false,
    },
    // 玩家临时暂停接单的商品列表 (默认空)
    pausedProducts: [],

    douGe: {
      name: '豆哥',
      energy: 100,
      maxEnergy: 100,
      mood: 95,
      baristaSkill: 1,
      hospitalitySkill: 1,
      currentAction: 'IDLE',
      life: createDefaultDouGeLifeState(),
    },
    lanLan: {
      name: '兰兰',
      breed: '英国短毛猫 (蓝猫)',
      isPurring: true,
      behavior: createDefaultLanLanBehaviorState(),
      satiety: 85,
      mood: 90,
      energy: 90,
      bondLevel: 1,
      bondExp: 10,
      favoriteSpot: 'SOFA_CUSHION',
      isSleeping: true,
      lastFedTimestamp: Date.now() - 3600000,
      lastPattedTimestamp: Date.now() - 1800000,
    },

    // 初始原料库存 (包含手冲咖啡、茶饮与三明治的启动原料)
    inventory: {
      coffee_beans: 8,
      tea_leaves: 8,
      sandwich_set: 6,
      noodles_set: 0,
      rice_set: 0,
      seafood_set: 0,
      cat_treat_fish: 5,
    },

    unlockedProducts: ['classic_coffee', 'jasmine_tea', 'ham_egg_sandwich', 'buldak_spicy_noodles', 'douge_fried_rice', 'seafood_salad'],
    ownedEquipment: ['manual_dripper', 'tea_pot', 'basic_prep_table'],
    ownedBooks: ['cat_sociology', 'how_to_read_a_book', 'walden'],

    placedFurniture: [...DEFAULT_INITIAL_PLACED_FURNITURE],
    storedFurniture: [],

    transactionHistory: [
      {
        id: 'init_capital',
        day: 1,
        type: 'INCOME',
        category: 'PRODUCT_SALE',
        amount: 300.0,
        note: '书咖开店启动营运资金',
        timestamp: Date.now(),
      },
    ],
    dailyReports: [],

    // 长线成长、熟客与自动化系统
    growth: createDefaultGrowthState(),
    regularCustomers: createDefaultRegularCustomers(),
    autoRestock: createDefaultAutoRestockConfig(),
    loan: createDefaultLoanState(),
    almanac: createDefaultAlmanacState(),

    // 动态天气与白噪声配置
    weather: generateDailyWeather(1),
    ambience: {
      enabled: false,
      currentType: 'BIRD_SUNNY',
      volume: 0.35,
      autoSyncWeather: true,
    },

    // 随机事件系统状态
    pendingRandomEvent: null,
    resolvedEvents: [],
    lastEventDay: 0,

    settings: {
      soundMuted: false,
      autoSaveIntervalMinutes: 1,
    },
  };
}
