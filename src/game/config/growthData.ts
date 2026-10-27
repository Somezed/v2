/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》长线成长、熟客与自动化数据配置
 * 包含：
 * 1. 经营等级路线与升级解锁内容
 * 2. 4位核心熟客档案、故事线与纪念物
 * 3. 经营专长配置库
 * 4. 自动补货默认策略工厂
 * 5. 应急贷款规则
 * 6. 生活图鉴初始工厂
 */

import {
  StoreLevelState,
  SpecializationId,
  RegularCustomerProfile,
  RegularCustomerStory,
  AutoRestockConfig,
  StoreLoanState,
  LifeAlmanacState,
} from '../../types/game';
import { INITIAL_INGREDIENTS } from './initialData';

// 经营等级升级阈值与里程碑配置
export interface LevelMilestoneConfig {
  level: number;
  title: string;
  requiredExp: number;
  unlockNote: string;
  unlockedFeatures: string[];
}

export const STORE_LEVEL_MILESTONES: LevelMilestoneConfig[] = [
  {
    level: 1,
    title: '初试啼声 · 起步书咖',
    requiredExp: 0,
    unlockNote: '基础手冲咖啡、青瓷茶饮与三明治制作能力。',
    unlockedFeatures: ['基础手动采购', '基础菜单自定价', '三类基础顾客'],
  },
  {
    level: 2,
    title: '街角暖光 · 温馨小聚',
    requiredExp: 120,
    unlockNote: '解锁【深夜火鸡面】、新顾客【考研学生小林】与【麻绳猫抓垫】。',
    unlockedFeatures: ['熟客羁绊系统', '火鸡面餐品', '麻绳猫抓垫', '初级经营专长'],
  },
  {
    level: 3,
    title: '书香浸润 · 漫步时光',
    requiredExp: 350,
    unlockNote: '解锁【智能自动补货系统】、【黄金炒饭】与熟客【退休老教师老王】。',
    unlockedFeatures: ['智能自动补货', '黄金炒饭餐品', '羊羔绒软蓬蓬猫窝', '中级经营专长'],
  },
  {
    level: 4,
    title: '喵声细语 · 灵感猫咖',
    requiredExp: 750,
    unlockNote: '解锁【鲜虾海鲜沙拉】、【剑麻四层猫爬架】与熟客【程序员阿豪】。',
    unlockedFeatures: ['海鲜沙拉餐品', '高级冷藏料理台', '剑麻四层猫爬架', '高级经营专长'],
  },
  {
    level: 5,
    title: '城市绿洲 · 梦想书咖',
    requiredExp: 1300,
    unlockNote: '解锁熟客【插画师沫沫】、秘密特调配方与全图鉴大师徽章。',
    unlockedFeatures: ['秘密特调饮品', '全图鉴殿堂级装潢', '熟客深度故事集'],
  },
];

// 四大经营专长定义 (升级时自由点选)
export interface SpecializationConfig {
  id: SpecializationId;
  name: string;
  icon: string;
  requiredLevel: number;
  description: string;
}

export const SPECIALIZATIONS_CATALOG: Record<SpecializationId, SpecializationConfig> = {
  COFFEE_ARTISAN: {
    id: 'COFFEE_ARTISAN',
    name: '咖啡匠心',
    icon: '☕',
    requiredLevel: 2,
    description: '钻研豆子风味与水温。所有咖啡与茶饮类出餐交付时满意度额外 +5 分。',
  },
  HOSPITALITY_WARMTH: {
    id: 'HOSPITALITY_WARMTH',
    name: '亲和待客',
    icon: '🤝',
    requiredLevel: 2,
    description: '温和笑容让顾客如沐春风。所有顾客的基础等待耐心额外延长 3 秒。',
  },
  SUPPLY_CHAIN_SAVVY: {
    id: 'SUPPLY_CHAIN_SAVVY',
    name: '精益供应链',
    icon: '📦',
    requiredLevel: 3,
    description: '与农场建立了长期订购协议。所有原料采购开销享 9 折（节省 10% 成本）。',
  },
  HEALING_VIBES: {
    id: 'HEALING_VIBES',
    name: '猫咪治愈场',
    icon: '🐾',
    requiredLevel: 3,
    description: '书咖氛围温馨治愈。兰兰打呼噜或玩毛球时，顾客留下小费的概率翻倍。',
  },
};

// 四位核心熟客的专属故事线库
export const REGULAR_CUSTOMER_STORIES: Record<string, RegularCustomerStory[]> = {
  regular_student_xiaolin: [
    {
      id: 'story_xiaolin_1',
      requiredAffinityLevel: 1,
      title: '初遇书咖的一束光',
      content: '小林是个备考法硕的大学生，第一次进店时被厚重的法条压得喘不过气。豆哥递上的微温三明治和安静靠窗的角落，让她找到了备考期间唯一的避风港。',
      rewardNote: '熟客羁绊达成，小林来电概率提升',
    },
    {
      id: 'story_xiaolin_2',
      requiredAffinityLevel: 2,
      title: '凌晨的红笔与热手冲',
      content: '模拟考成绩不理想的那天傍晚，小林趴在桌角小声抽泣。豆哥默默递上一杯手冲咖啡和手绘猫爪小饼干，轻声说：“慢一点没关系，步子稳就好”。',
      rewardNote: '小林进店必点手冲或三明治',
    },
    {
      id: 'story_xiaolin_3',
      requiredAffinityLevel: 3,
      title: '拟录取捷报与手折千纸鹤',
      content: '春天的清晨，小林一路小跑冲进书咖，眼里闪着泪光递来成绩单——初试第一！她将亲手折了很久的“千纸鹤招财猫”送给了书咖。',
      rewardNote: '获赠纪念物【手折千纸鹤招财猫】',
    },
  ],
  regular_critic_mr_wang: [
    {
      id: 'story_mr_wang_1',
      requiredAffinityLevel: 1,
      title: '严苛的退休老学者',
      content: '老王是一位研究现代文学数十载的退休老教授，第一次进店就皱着眉头指出了书架上一本诗集的排版错处。但他对青瓷慢煮的茉莉花茶温度却暗暗颔首。',
      rewardNote: '老王成为书咖常客',
    },
    {
      id: 'story_mr_wang_2',
      requiredAffinityLevel: 2,
      title: '兰兰的破冰一跃',
      content: '平常不苟言笑的老王正在灯下批注文章，兰兰竟毫无征兆跳上桌子，把脑袋硬塞进老王手心里蹭了蹭。老王愣住三秒，布满老茧的手温柔地顺了顺猫背。',
      rewardNote: '老王进店小费率大幅提升',
    },
    {
      id: 'story_mr_wang_3',
      requiredAffinityLevel: 3,
      title: '三十年前的绝版签名书',
      content: '老王将自己珍藏了三十年的绝版小说第一版签名本捐赠给了书咖：“好书在库房会落灰，放在豆哥的书架上，才算活着。”',
      rewardNote: '获赠纪念物【绝版初版签名小说】',
    },
  ],
  regular_programmer_ahao: [
    {
      id: 'story_ahao_1',
      requiredAffinityLevel: 1,
      title: '被火鸡面唤醒的夜归人',
      content: '阿豪是大厂负责底层架构的程序员，深夜带着满身疲惫和冷汗推开店门。一碗热气腾腾、辣得直呼过瘾的火鸡面，瞬间击碎了连日加班的麻木。',
      rewardNote: '阿豪解锁深夜常客身份',
    },
    {
      id: 'story_ahao_2',
      requiredAffinityLevel: 2,
      title: '猫肉垫的神奇缩进',
      content: '阿豪正在抓耳挠腮找一个死锁 BUG，兰兰踱步踩过回车键，光标跳到了关键行。阿豪定睛一看，惊呼：“神了！猫咪玄学调试法！”',
      rewardNote: '阿豪每次到店必定给兰兰带小鱼干',
    },
    {
      id: 'story_ahao_3',
      requiredAffinityLevel: 3,
      title: '极客专属的机械轴挂坠',
      content: '项目顺利上线后，阿豪送给豆哥一个亲手组装的客制化金属机械轴解压挂件：“听到清脆的咔哒声，烦恼就全消了！”',
      rewardNote: '获赠纪念物【客制化极客机械轴挂坠】',
    },
  ],
  regular_designer_momo: [
    {
      id: 'story_momo_1',
      requiredAffinityLevel: 1,
      title: '速写本里的书咖光影',
      content: '自由插画师沫沫随身携带小速写本，最喜欢点一份清爽的海鲜沙拉坐在落地窗前。她的画笔轻盈勾勒出豆哥倒手冲时的专注侧影。',
      rewardNote: '沫沫成为书咖常客',
    },
    {
      id: 'story_momo_2',
      requiredAffinityLevel: 2,
      title: '穿戴甲同好的灵感碰撞',
      content: '沫沫偶然瞥见豆哥指尖新贴的晕染穿戴甲，两人相视一笑，兴奋地讨论起抖音手作穿戴甲的猫眼磁吸工艺，足足聊了半小时。',
      rewardNote: '豆哥生活灵感额外 +20',
    },
    {
      id: 'story_momo_3',
      requiredAffinityLevel: 3,
      title: '《兰兰的一百种睡姿》明信片',
      content: '沫沫送给书咖一整套她手绘的水彩明信片《兰兰的一百种睡姿》，画面上的蓝猫憨态可掬，引得每位读者都忍不住驻足端详。',
      rewardNote: '获赠纪念物【《兰兰的一百种睡姿》手绘明信片】',
    },
  ],
};

// 初始熟客基础数据
export function createDefaultRegularCustomers(): Record<string, RegularCustomerProfile> {
  return {
    regular_student_xiaolin: {
      id: 'regular_student_xiaolin',
      name: '小林',
      title: '法硕备考学生',
      archetype: 'PRICE_SENSITIVE',
      avatarSeed: 'xiaolin_glasses',
      visitsCount: 1,
      affinityLevel: 1,
      affinityExp: 20,
      favoriteProductId: 'ham_egg_sandwich',
      greetingDialogue: '豆哥好！今天自习室占不到位，幸好书咖还有安静角落~',
      specialOrderDialogue: '豆哥，今天法条背得头晕脑胀，能做一份多烘烤一会儿的焦香三明治吗？',
      hasSpecialOrderPending: false,
      unlockedStoryIds: ['story_xiaolin_1'],
    },
    regular_critic_mr_wang: {
      id: 'regular_critic_mr_wang',
      name: '老王',
      title: '退休文学教授',
      archetype: 'CASUAL_READER',
      avatarSeed: 'mr_wang_tweed',
      visitsCount: 1,
      affinityLevel: 1,
      affinityExp: 15,
      favoriteProductId: 'jasmine_tea',
      greetingDialogue: '下午好，豆哥。窗边的位子还空着吧？还是老样子，慢煮茉莉。',
      specialOrderDialogue: '今天翻到一篇旧序，想配上一壶水温恰好 88 度的青瓷慢煮茶。',
      hasSpecialOrderPending: false,
      unlockedStoryIds: ['story_mr_wang_1'],
    },
    regular_programmer_ahao: {
      id: 'regular_programmer_ahao',
      name: '阿豪',
      title: '大厂架构程序员',
      archetype: 'QUALITY_SEEKER',
      avatarSeed: 'ahao_hoodie',
      visitsCount: 0,
      affinityLevel: 1,
      affinityExp: 0,
      favoriteProductId: 'buldak_spicy_noodles',
      greetingDialogue: '呼……刚发完版本，快给我来碗最提神的火鸡面和特浓咖啡！',
      unlockedStoryIds: [],
    },
    regular_designer_momo: {
      id: 'regular_designer_momo',
      name: '沫沫',
      title: '自由水彩插画师',
      archetype: 'QUALITY_SEEKER',
      avatarSeed: 'momo_beret',
      visitsCount: 0,
      affinityLevel: 1,
      affinityExp: 0,
      favoriteProductId: 'seafood_salad',
      greetingDialogue: '嗨豆哥！今天阳光特别通透，兰兰趴在哪个窝里呀？我要画它！',
      unlockedStoryIds: [],
    },
  };
}

// 自动补货初始默认规则配置工厂
export function createDefaultAutoRestockConfig(): AutoRestockConfig {
  const rules: AutoRestockConfig['rules'] = {};
  for (const [id, ing] of Object.entries(INITIAL_INGREDIENTS)) {
    rules[id] = {
      ingredientId: id,
      enabled: false, // 默认保持关闭，待玩家主动启用
      minThreshold: 3,  // 低于 3 份触发
      targetStock: Math.min(10, ing.maxStock), // 补足至 10 份
      maxBatchQty: 5,  // 单次最多采购 5 份
    };
  }

  return {
    enabled: false,
    dailyBudget: 100.0, // 每日上限 100 元
    rules,
  };
}

// 初始经营等级与经验模型工厂
export function createDefaultGrowthState(): StoreLevelState {
  return {
    level: 1,
    currentExp: 25,
    expToNextLevel: 120,
    totalOrdersDelivered: 0,
    selectedSpecializations: [],
  };
}

// 初始应急贷款模型工厂
export function createDefaultLoanState(): StoreLoanState {
  return {
    hasActiveLoan: false,
    principal: 0,
    dailyInterestRate: 0.03, // 每日 3% 利息
    accumulatedInterest: 0,
    borrowedDay: 0,
  };
}

// 初始生活图鉴总集模型工厂
export function createDefaultAlmanacState(): LifeAlmanacState {
  return {
    unlockedNailShowcases: ['nail_naked_cat_eye'], // 初始佩戴款
    unlockedGooseMemories: [],
    unlockedAnimeMoments: [],
    unlockedLanLanBehaviors: ['SLEEPING', 'RESTING'], // 初始观察到的行为
    unlockedCustomerStoryIds: ['story_xiaolin_1', 'story_mr_wang_1'],
    unlockedFurnitureIds: [
      'wood_order_counter',
      'pour_over_bar',
      'snack_prep_counter',
      'oak_double_table',
    ],
    unlockedPropIds: ['tool_walnut_grinder', 'cat_catnip_mouse'],
  };
}
