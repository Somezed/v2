/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》核心领域模型与数据契约 (首版经营闭环)
 * 严格分离：现金流 (Cash Flow) 与 经营损益表 (P&L - COGS 已消耗成本)
 */

export const CURRENT_SAVE_VERSION = 1;
export const SAVE_STORAGE_KEY = 'douge_cat_cafe_save_v1';

// 每日经营阶段流转
export type DailyPhase = 'MORNING_BRIEFING' | 'PREPARATION' | 'OPERATING' | 'SETTLEMENT';

// 六大核心商品类别
export type ProductCategory = 'COFFEE' | 'TEA' | 'SANDWICH' | 'NOODLES' | 'FRIED_RICE' | 'SALAD';

// 原材料配置与库存模型
export interface Ingredient {
  id: string;
  name: string;
  unit: string; // 采购单位 (如 "包", "盒", "份", "盒")
  costPrice: number; // 采购单价 (元)
  maxStock: number; // 库存上限
  shelfLifeDays?: number;
  description: string;
}

// 商品与食谱配方模型 (六类商品)
export interface MenuItem {
  id: string;
  name: string;
  category: ProductCategory;
  basePrice: number; // 建议基准售价
  minPrice: number;  // 最低可调整售价
  maxPrice: number;  // 最高可调整售价
  requiredIngredients: {
    ingredientId: string;
    amount: number; // 单份制作消耗量
  }[];
  prepTimeSeconds: number; // 基础制作时间 (秒)
  requiredEquipmentId: string; // 所需工作台/设备
  demandTags: string[]; // 需求特征标签，如 ['提神', '饱腹', '重口', '清淡']
  unlockLevel: number;
  description: string;
}

// 设施与厨具设备模型
export interface EquipmentItem {
  id: string;
  name: string;
  category: 'BREWING' | 'COOKING' | 'PREP' | 'CAT_FURNITURE' | 'BOOKSHELF';
  tier: number;
  purchaseCost: number; // 设备购置费 (投资性现金支出 Capex)
  dailyMaintenanceCost: number; // 每日折旧与维护费用
  speedBonus: number; // 制作加速百分比 (0.2 = +20% 制作提速)
  reputationBonus: number; // 声誉加成
  description: string;
}

// 六大店铺功能区域分类
export type FunctionalZone =
  | 'ORDER_COUNTER'      // 前台与点单区
  | 'BEVERAGE_STATION'   // 饮品制作区
  | 'KITCHEN_STATION'    // 简餐制作区
  | 'READING_AREA'       // 阅读区 (客座)
  | 'BOOKSHELF_AREA'     // 书架区
  | 'CAT_ZONE';          // 猫咪活动区

// 家具分类
export type FurnitureCategory =
  | 'COUNTER'            // 前台收银吧台
  | 'BEVERAGE'           // 手冲台、煮茶台
  | 'KITCHEN'            // 电煮锅、炒饭炉、冷藏台
  | 'SEATING'            // 双人木桌椅、吧台高脚椅、单人舒适沙发
  | 'BOOKSHELF'          // 落地书架、矮柜藏书
  | 'CAT_ZONE';          // 剑麻猫爬架、猫抓板坐垫、猫窝

// 家具元配置
export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  zone: FunctionalZone;
  width: number;         // 默认宽度（格子数）
  height: number;        // 默认高度（格子数）
  purchaseCost: number;  // 购买价格
  sellPrice: number;     // 出售回收价 (不可出售为0)
  canSell: boolean;
  // 经营实际效果
  seatCapacity?: number;               // 增加店内同时接待座位数
  speedBonus?: number;                  // 对应工作台制作加速 (0.1 = +10%)
  readingSatisfactionBonus?: number;    // 阅读型顾客满意度与耐心加成
  catAttraction?: number;               // 兰兰偏好吸引力
  associatedEquipmentId?: string;       // 关联的厨具设备 ID (放置在网格上方可激活制作功能)
  description: string;
}

// 已摆放家具实例
export interface PlacedFurniture {
  instanceId: string;
  furnitureId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}

// 三种基础顾客类型
export type CustomerType = 'PRICE_SENSITIVE' | 'QUALITY_SEEKER' | 'CASUAL_READER';

// 顾客画像配置
export interface CustomerArchetype {
  id: string;
  name: string;
  type: CustomerType;
  avatarSeed: string;
  preferredProductIds: string[];
  priceSensitivity: number; // 价格敏感乘数：>1 代表对涨价更敏感，<1 代表高价容忍
  basePatienceSeconds: number; // 基础耐心时长 (秒)
  environmentWeight: number; // 环境与猫咪好感对满意度的权重 (0-1)
  tipProbability: number; // 留小费基础概率
  description: string;
}

// 订单生命周期明确状态
export type OrderStatus =
  | 'ORDER_PLACED'          // 顾客刚下单
  | 'WAITING_BREW'          // 等待空闲设备或排队轮候
  | 'IN_PROGRESS'           // 正在制作（物理真实占用设备，不可随意打断）
  | 'SERVED'                // 完成并交付，结算收入
  | 'OUT_OF_STOCK'          // 因缺料未能制作
  | 'CANCELLED'             // 玩家在等待期主动取消
  | 'ABANDONED_PATIENCE';   // 顾客等待过久耐心耗尽愤怒离店

// 顾客订单完整记录模型
export interface ActiveCustomerOrder {
  id: string;
  customer: {
    name: string;
    type: CustomerType;
    avatarSeed: string;
  };
  productId: string;
  productName: string;
  quantity: number;
  createdAtTick: number; // 创建时间点
  prepDurationSeconds: number; // 制作时长
  status: OrderStatus;
  waitTimeElapsedSeconds: number; // 已等待时长
  requiredEquipmentId: string; // 所需设备
  patienceMaxSeconds: number;
  patienceRemainingSeconds: number;
  price: number; // 顾客支付价格
  unitCost: number; // 原料成本
  cookProgress: number; // 制作进度 (0 - 100)
  tip: number;
  satisfactionScore: number; // 最终/实时满意度 (0 - 100)
  finalOutcome?: 'DELIVERED' | 'CANCELLED_BY_PLAYER' | 'LOST_OUT_OF_STOCK' | 'LOST_TIMEOUT' | 'LOST_PRICE_REJECTED';
  alternativeOfferedFrom?: string; // 若为推荐替代餐品，记录原商品名称
}

// 固定日常经营支出详实明细
export interface FixedCostBreakdown {
  rent: number;        // 商铺店面租金与物业 (如 32.0元)
  utilities: number;   // 水电能源、燃气与宽带 (如 16.0元)
  dougeLiving: number; // 豆哥工作餐与日常生活津贴 (如 14.0元)
  catFood: number;     // 兰兰主食纯肉罐头与深海冻干 (如 10.0元)
  catLitter: number;   // 兰兰除臭环保混合猫砂与眼耳清洁 (如 6.0元)
  storeHygiene: number;// 营业日常消毒与店内绿植养护 (如 4.0元)
  total: number;       // 总计固定成本 (元/天)
}

// 天气与节假日类型
export type WeatherType = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'STORMY' | 'HOLIDAY_WEEKEND';

// 每日天气与客流影响配置
export interface DailyWeatherInfo {
  type: WeatherType;
  name: string;
  icon: string;
  temperature: number; // 摄氏度
  trafficMultiplier: number; // 客流到达率系数 (如晴天 1.15, 节假日 1.45, 暴雨 0.65)
  patienceBonusSeconds: number; // 顾客耐心调整
  preferredCategory?: ProductCategory;
  description: string;
  recommendedAmbience: AmbienceType;
}

// 背景白噪声环境音类型
export type AmbienceType = 'BIRD_SUNNY' | 'RAIN_SOFT' | 'WIND_CLOUDY' | 'CAFE_VIBES' | 'OFF';

// 白噪声播放状态配置
export interface AmbienceConfig {
  enabled: boolean;
  currentType: AmbienceType;
  volume: number; // 0.0 ~ 1.0
  autoSyncWeather: boolean; // 是否随每日天气自动匹配白噪声
}

// 兰兰情绪叫声类型
export type CatMeowMood = 'LAZY' | 'SWEET' | 'COZY' | 'GRUMPY';

// 随机经营事件分类
export type RandomEventCategory =
  | 'LANLAN_HEALTH'       // 兰兰健康/感冒/体检
  | 'WEATHER_DISASTER'    // 极端天气/防风防汛修缮
  | 'SUPPLY_CHAIN'        // 供应链短缺/加急调配
  | 'STORE_FACILITY'      // 商业空调/水电管网抢修
  | 'MUNICIPAL_INSPECTION'// 社区市容消防常态化年检更新
  | 'LANLAN_MISCHIEF';    // 兰兰半夜磨爪损耗

// 随机事件选项
export interface RandomEventChoice {
  id: string;
  label: string;
  cost: number;
  reputationChange?: number;
  description: string;
  outcomeText: string;
}

// 随机事件定义
export interface RandomEventDefinition {
  id: string;
  title: string;
  category: RandomEventCategory;
  narrative: string;
  icon: string;
  severity: 'NORMAL' | 'URGENT';
  minDay: number;
  choices: RandomEventChoice[];
}

// 触发的随机事件实例
export interface TriggeredRandomEvent {
  id: string;
  definition: RandomEventDefinition;
  day: number;
  isResolved: boolean;
  selectedChoiceId?: string;
  costPaid?: number;
  outcomeNote?: string;
  timestamp: number;
}

// 每日经营财务与顾客满意度结算快照 (严谨会计模型)
export interface DailyReport {
  day: number;
  openingCash: number; // 期初现金
  closingCash: number; // 期末现金
  
  // 利润表 (P&L) 经营成果核算
  revenue: number; // 销售总收入 (含餐品 + 小费)
  consumedIngredientCost: number; // 已消耗原料成本 (COGS, 仅计算卖出餐品所消耗的原料)
  fixedOperatingCost: number; // 固定经营费用 (房租水电、兰兰猫粮猫砂生活等)
  fixedCostBreakdown?: FixedCostBreakdown; // 固定支出各细项
  maintenanceCost: number; // 设备损耗与维护费
  randomEventExpense?: number; // 随机事件突发应急支出
  netProfit: number; // 当日经营净利润 = revenue - consumedIngredientCost - fixedOperatingCost - maintenanceCost - (randomEventExpense || 0)

  // 现金流表 (Cash Flow) 差异核对
  procurementCashPaid: number; // 当日采购原料付现总额 (未消耗的转化为库存资产，不重复计入利润扣除)
  equipmentCapexPaid: number; // 当日设备投资付现 (属于资本性支出，不重复计入日常经营成本)

  // 经营与客流指标统计
  ordersAttempted: number; // 总客流意向
  ordersServed: number; // 成功交付数
  ordersLostStockOut: number; // 因缺料遗憾流失数
  ordersLostHighPrice: number; // 因定价过高被顾客嫌贵放弃数
  ordersLostTimeout: number; // 因制作超时流失数
  ordersCancelled: number; // 玩家主动取消数
  completionRate: number; // 订单完成率百分比 (0-100)
  averageSatisfaction: number; // 平均顾客满意度 (0-100)
  customerTypeStats: Record<CustomerType, {
    arrived: number;
    served: number;
    avgSatisfaction: number;
    lost: number;
  }>;
  weather?: DailyWeatherInfo;
  triggeredEvent?: TriggeredRandomEvent;
  catHappiestMoment: string;
}

// 穿戴甲款式模型
export interface PressOnNailItem {
  id: string;
  name: string;
  styleTag: string; // 如 '猫咪治愈', '极简棋盘', '水光清透', '偏光猫眼', '复古浮雕', '优雅小花'
  description: string;
  dialogue: string; // 豆哥佩戴/打量时的独白
  unlockCondition: string; // 解锁要求描述
  inspirationCost: number; // 虚构书咖灵感点 (由营业好评获得，绝非真实货币)
  unlockedByDefault?: boolean;
}

// 抓大鹅趣事与战报模型
export interface GooseAnecdote {
  id: string;
  title: string;
  content: string;
  dougeQuote: string;
  gooseType: string;
  outcomeType: 'STUCK_ON_LEVEL_2' | 'ALMOST_WON' | 'RAGE_QUIT_PAUSE' | 'CAT_ASSISTED' | 'GOOSE_VICTORY';
}

// 动漫短剧模型
export interface AnimeDramaItem {
  id: string;
  title: string;
  genreTags: string[];
  rating: number; // 9.5
  episodes: string;
  synopsis: string;
  dougeReview: string;
  decorRewardId?: string;
}

// 动漫周边小物件
export interface AnimeDecorItem {
  id: string;
  name: string;
  category: 'FIGURE' | 'STAND' | 'MAGNET' | 'KEYCHAIN';
  description: string;
  fromDramaTitle: string;
}

// 豆哥生活手账随笔条目 (可回溯历史)
export interface DouGeDiaryEntry {
  id: string;
  day: number;
  category: 'NAILS' | 'GOOSE' | 'ANIME' | 'CHILL';
  title: string;
  content: string;
  timestamp: number;
  moodBonus: number;
}

// 豆哥日常生活系统聚合状态
export interface DouGeLifeState {
  ownedNailIds: string[];
  activeNailId: string | null; // 当前佩戴的穿戴甲
  inspirationPoints: number; // 虚构灵感点 (好评出餐积累)
  gooseAttempts: number; // 抓大鹅总对局数
  gooseClearedLevels: number; // 通关数 (大部分卡在第2关)
  unlockedGooseAnecdotes: string[]; // 已解锁的趣事ID
  watchedDramaIds: string[]; // 已看过的短剧
  ownedDecorIds: string[]; // 已收藏的周边小物
  dailyDiaries: DouGeDiaryEntry[]; // 历史手账
  lastEventTriggeredDay?: number; // 记录最近触发事件的营业日
}

// 店长豆哥动作类型
export type DouGeActionType =
  | 'IDLE'
  | 'PREPARING'
  | 'COOKING'
  | 'RESTING'
  | 'BROWSING_NAILS'
  | 'PLAYING_GOOSE'
  | 'WATCHING_ANIME';

// 店长豆哥状态
export interface DouGeState {
  name: string;
  energy: number; // 体力 (0-100)
  maxEnergy: number;
  mood: number; // 心情 (0-100)
  baristaSkill: number;
  hospitalitySkill: number;
  currentAction: DouGeActionType;
  life: DouGeLifeState;
}

// 蓝猫兰兰九种自主行为类型 (无强制喂食/清洁打卡，纯自主性格生活)
export type LanLanBehavior =
  | 'SLEEPING'       // 睡觉 (喜欢睡懒觉，卷在猫窝/猫爬架/吧台打呼噜)
  | 'STRETCHING'      // 伸懒腰 (刚睡醒，下压前爪伸展后背)
  | 'RESTING'        // 休息 (大圆脸揣手手发呆、眯眯眼)
  | 'WALKING'        // 自由走动 (踱步巡视书咖领地)
  | 'ZOOMING'        // 短距离跑动 (偶尔突然起飞短跑一段，竖起小尾巴)
  | 'OBSERVING'      // 停下观察 (警觉停下、好奇张望四周或回头看)
  | 'APPROACHING'    // 主动亲近 (长时间没人理会时，主动靠近豆哥蹭蹭裤腿或脚边坐下)
  | 'PLAYING_YARN'   // 玩毛球 (靠近毛球，小爪爪拍打，毛球位移弹跳)
  | 'REFUSING_HUG';  // 拒绝被抱 (玩家尝试抱起时，滑稽扭动滑脱或跳开，性格傲娇)

// 蓝猫兰兰可互动的毛球玩具实体
export interface YarnBallEntity {
  id: string;
  x: number;
  y: number;
  lastBattedTimestamp: number;
  playCount: number;
  isMoving?: boolean;
}

// 蓝猫兰兰自主行为聚合状态
export interface LanLanAutonomousState {
  currentBehavior: LanLanBehavior;
  behaviorDurationSeconds: number; // 当前行为预期持续秒数
  behaviorElapsedSeconds: number;  // 当前行为已持续秒数
  position: { x: number; y: number }; // 在 8x6 网格中的格子坐标
  facing: 'LEFT' | 'RIGHT';
  targetPosition: { x: number; y: number } | null;
  lastInteractionTimestamp: number; // 玩家最近主动交互时间戳 (用于判定“好久没人理会”)
  consecutiveHugAttempts: number;   // 连续尝试抱抱次数 (防连续强迫抱)
  dialogueBubble: string;           // 当前头顶气泡台词
  bubbleExpiresTimestamp: number;   // 气泡消失时间
  yarnBall: YarnBallEntity | null;  // 店内当前活动的毛球玩具
  isNearDouGe: boolean;             // 是否正贴近豆哥
  dailySleepingMinutes: number;     // 今日已睡懒觉总时长 (纯趣味统计)
}

// 蓝猫兰兰状态模型 (自主猫咪生活，无强制日常打卡/无惩罚性饥饿)
export interface LanLanState {
  name: string;
  breed: '英国短毛猫 (蓝猫)';
  isPurring: boolean;
  behavior: LanLanAutonomousState;
  
  // 保留可选字段保障老存档平滑兼容：
  satiety?: number;
  mood?: number;
  energy?: number;
  bondLevel?: number;
  bondExp?: number;
  favoriteSpot?: string;
  isSleeping?: boolean;
  lastFedTimestamp?: number;
  lastPattedTimestamp?: number;
}

// 财务流水明细记录
export interface TransactionRecord {
  id: string;
  day: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'PRODUCT_SALE' | 'TIP' | 'INGREDIENT_PROCUREMENT' | 'EQUIPMENT_CAPEX' | 'FIXED_OPERATING_COST' | 'MAINTENANCE' | 'LOAN_AID' | 'RANDOM_EVENT';
  amount: number;
  note: string;
  timestamp: number;
}

// 经营专长选项
export type SpecializationId =
  | 'COFFEE_ARTISAN'       // 咖啡香醇：咖啡与茶饮出餐满意度 +5
  | 'HOSPITALITY_WARMTH'   // 亲和待客：所有顾客基础等待耐心 +3 秒
  | 'SUPPLY_CHAIN_SAVVY'   // 供应链协议：原料采购开销享 9 折优惠
  | 'HEALING_VIBES';       // 治愈氛围：兰兰陪伴时顾客留小费概率翻倍

// 经营等级与经验系统
export interface StoreLevelState {
  level: number; // 当前等级 (Lv.1 ~ Lv.5)
  currentExp: number; // 当前等级累积经验
  expToNextLevel: number; // 升级所需经验
  totalOrdersDelivered: number; // 历史成功出餐总单数
  selectedSpecializations: SpecializationId[]; // 玩家已选择激活的经营专长
}

// 熟客回忆故事条目
export interface RegularCustomerStory {
  id: string;
  requiredAffinityLevel: number;
  title: string;
  content: string;
  unlockedAtDay?: number;
  rewardNote?: string;
}

// 熟客个人档案模型 (长线羁绊、专属偏好、故事与纪念物)
export interface RegularCustomerProfile {
  id: string;
  name: string;
  title: string;
  archetype: CustomerType;
  avatarSeed: string;
  visitsCount: number;
  affinityLevel: number; // 1: 萍水相逢, 2: 常常光顾, 3: 默契熟客, 4: 莫逆知己
  affinityExp: number; // 0 ~ 100
  favoriteProductId: string;
  greetingDialogue: string;
  specialOrderDialogue?: string;
  hasSpecialOrderPending?: boolean;
  unlockedStoryIds: string[];
  souvenirReceived?: string; // 赠送的书咖纪念物
}

// 单个原料的自动补货规则
export interface AutoRestockRule {
  ingredientId: string;
  enabled: boolean;
  minThreshold: number; // 低于此库存触发采购
  targetStock: number;  // 采购补足至目标库存
  maxBatchQty: number;  // 单次最多采购批次上限
}

// 自动补货全局配置
export interface AutoRestockConfig {
  enabled: boolean; // 是否启用自动补货总开关
  dailyBudget: number; // 每日自动补货预算上限 (元)
  rules: Record<string, AutoRestockRule>;
}

// 应急小额借款与经营危机模型 (防破产死局，设明确上限与利息)
export interface StoreLoanState {
  hasActiveLoan: boolean;
  principal: number; // 借款本金 (最高 300)
  dailyInterestRate: number; // 每日利息率 (0.03 即 3%/天)
  accumulatedInterest: number; // 累计应还利息
  borrowedDay: number;
}

// 生活图鉴总集模型 (记录全部生活轨迹与长线收藏)
export interface LifeAlmanacState {
  unlockedNailShowcases: string[]; // 穿戴甲图鉴
  unlockedGooseMemories: string[]; // 抓大鹅趣事
  unlockedAnimeMoments: string[];  // 动漫短剧与周边
  unlockedLanLanBehaviors: LanLanBehavior[]; // 兰兰9大自主行为观察图鉴
  unlockedCustomerStoryIds: string[]; // 熟客温情回忆录
  unlockedFurnitureIds: string[]; // 家具与设施图鉴
  unlockedPropIds?: string[]; // 道具与专业器具图鉴
}

// 游戏存档结构 (支持完整持久化与版本平滑迁移)
export interface GameSaveData {
  version: number;
  saveTimestamp: number;
  storeName: string;
  currentDay: number;
  dailyPhase: DailyPhase;
  cash: number; // 当前可用资金 (元)
  reputation: number; // 书咖声誉 (0-1000)
  
  // 菜单定制状态
  customPricing: Record<string, number>; // productId -> 玩家自定售价
  menuOnSale: Record<string, boolean>; // productId -> 是否在售
  pausedProducts: string[]; // 玩家临时暂停接单的商品列表

  douGe: DouGeState;
  lanLan: LanLanState;
  
  // 库存数据 (原料ID -> 当前存量)
  inventory: Record<string, number>;

  // 已解锁与已购买列表
  unlockedProducts: string[];
  ownedEquipment: string[];
  ownedBooks: string[];

  // 空间布局与家具装修状态
  placedFurniture: PlacedFurniture[]; // 当前在店内网格摆放的家具
  storedFurniture: string[];         // 收纳在仓库背包中的家具 ID 列表

  // 长线成长、熟客与自动化系统
  growth: StoreLevelState;
  regularCustomers: Record<string, RegularCustomerProfile>;
  autoRestock: AutoRestockConfig;
  loan: StoreLoanState;
  almanac: LifeAlmanacState;

  // 天气与环境白噪声
  weather?: DailyWeatherInfo;
  ambience?: AmbienceConfig;

  // 随机事件系统
  pendingRandomEvent?: TriggeredRandomEvent | null;
  resolvedEvents?: TriggeredRandomEvent[];
  lastEventDay?: number;

  // 财务历史与日报
  transactionHistory: TransactionRecord[];
  dailyReports: DailyReport[];

  settings: {
    soundMuted: boolean;
    autoSaveIntervalMinutes: number;
  };
}

// 存档校验结果
export interface SaveValidationResult {
  isValid: boolean;
  error?: string;
  migratedData?: GameSaveData;
}
