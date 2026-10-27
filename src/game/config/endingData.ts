/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》终章结局多线宇宙配置 (Ending Data & Epilogues)
 * 包含 6 种截然不同、情感丰沛的结局分支：
 * 1. 【城市文化地标 · 暖阳书咖传奇】(综合实力巅峰，治愈与繁荣并存)
 * 2. 【治愈角落 · 佛系猫咪乌托邦】(慢生活，兰兰幸福感爆棚，远离内卷)
 * 3. 【商业狂飙 · 连锁咖啡新星】(极致现金流与高周转，供应链资本神话)
 * 4. 【人情小筑 · 熟客记忆回廊】(羁绊至上，4位熟客完整温情回忆录)
 * 5. 【现实风雨 · 暂别与新生】(遭遇经营断裂破产，雨夜温暖释怀并许下新约定)
 * 6. 【隐世书痴 · 漫步时光】(藏书如海，茶香墨韵，学者与思考者的圣地)
 */

import { GameSaveData, CURRENT_SAVE_VERSION, CustomerType } from '../../types/game';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_INGREDIENTS,
  INITIAL_EQUIPMENT,
  DEFAULT_FIXED_COST_BREAKDOWN,
} from './initialData';
import { DEFAULT_INITIAL_PLACED_FURNITURE } from '../engine/layoutEngine';
import {
  createDefaultGrowthState,
  createDefaultRegularCustomers,
  createDefaultAutoRestockConfig,
  createDefaultLoanState,
  createDefaultAlmanacState,
} from './growthData';
import { createDefaultDouGeLifeState } from './douGeLifeData';
import { createDefaultLanLanBehaviorState } from './lanlanData';
import { generateDailyWeather } from '../engine/weatherEngine';

export type EndingId =
  | 'ENDING_CULTURAL_LANDMARK' // 城市文化地标
  | 'ENDING_CAT_UTOPIA'        // 佛系猫咪乌托邦
  | 'ENDING_COMMERCIAL_GIANT'  // 商业狂飙连锁新星
  | 'ENDING_REGULAR_SANCTUARY' // 熟客记忆回廊
  | 'ENDING_RAINY_FAREWELL'    // 现实风雨·暂别与新生
  | 'ENDING_LITERARY_HAVEN';   // 隐世书痴·漫步时光

export interface CustomerEpilogue {
  customerId: string;
  name: string;
  avatarSeed: string;
  role: string;
  epilogue: string;
}

export interface StoryChapter {
  title: string;
  paragraphs: string[];
  sceneTag: 'MORNING' | 'AFTERNOON' | 'DUSK' | 'NIGHT' | 'RAIN';
  doodleFocus: 'STORE' | 'LANLAN' | 'DOUGE' | 'REGULARS' | 'FAREWELL' | 'BOOKS';
}

export interface GameEndingConfig {
  id: EndingId;
  orderNumber: number;
  title: string;
  englishTitle: string;
  badge: string;
  rarity: 'SSR · 殿堂传说' | 'SR · 岁月静好' | 'SR · 商业传奇' | 'SR · 人间温情' | 'SPECIAL · 坚韧新生' | 'R · 墨韵书香';
  summary: string;
  colorTheme: {
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
  };
  conditionsSummary: string[];
  storyChapters: StoryChapter[];
  douGeMonologue: string;
  lanLanReaction: {
    quote: string;
    soundMood: 'COZY' | 'SWEET' | 'LAZY' | 'GRUMPY';
    description: string;
  };
  customerEpilogues: CustomerEpilogue[];
  commemorativePerks: {
    certificateTitle: string;
    souvenirName: string;
    souvenirDesc: string;
    unlockBonus: string;
  };
  sampleStats: {
    days: number;
    closingCash: number;
    reputation: number;
    level: number;
    ordersServed: number;
    averageSatisfaction: number;
    totalProfit: number;
    catHappiestMoment: string;
  };
  createDemoSave: () => GameSaveData;
}

export const GAME_ENDINGS_CATALOG: Record<EndingId, GameEndingConfig> = {
  ENDING_CULTURAL_LANDMARK: {
    id: 'ENDING_CULTURAL_LANDMARK',
    orderNumber: 1,
    title: '城市文化地标 · 暖阳书咖传奇',
    englishTitle: 'The Urban Cultural Landmark & Cat Oasis',
    badge: '👑 殿堂级完美真结局',
    rarity: 'SSR · 殿堂传说',
    summary: '书咖成为整座城市中最令人心安的精神灯塔，名扬全国。豆哥与兰兰用一杯咖啡、一本好书和柔软的呼噜声，治愈了数以万计疲惫的心灵。',
    colorTheme: {
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900 border-amber-400',
      border: 'border-amber-600',
      accent: 'text-amber-700',
    },
    conditionsSummary: [
      '书咖等级达到 Lv.5 (城市绿洲 · 梦想书咖)',
      '声誉累积超过 800 点',
      '流动现金储备 ≥ ¥3,500 且无逾期借款',
      '4位核心熟客羁绊全达 Lv.4 (莫逆知己)',
      '兰兰9大自主生活行为全图鉴解锁',
    ],
    storyChapters: [
      {
        title: '晨光穿透梧桐叶',
        paragraphs: [
          '不知从何时起，每天清晨八点，窄窄的小巷前便会排起温和安静的队伍。没有喧嚣与拥挤，大家手里拿着书，轻声与邻座打着招呼。',
          '木门上的铜铃被第一缕晨风拨响。豆哥穿着那件熟悉的浅粉色羽绒高领衫，推开厚重的胡桃木门，修长整洁的手指上，闪烁着精致的偏光猫眼穿戴甲。',
          '“早上好，书咖开门了。”豆哥微笑着侧身，清晨第一缕阳光恰好洒在他大圆框眼镜的镜片上。',
        ],
        sceneTag: 'MORNING',
        doodleFocus: 'STORE',
      },
      {
        title: '全城瞩目的灵魂客堂',
        paragraphs: [
          '《全国独立书店与生活美学年鉴》将小店评为年度“城市心灵疗愈地标”。但店里并未因此改变半分调性，依然保留着那几张擦得发亮的黑白条纹木桌，和手写每日特供小黑板。',
          '现磨手冲咖啡的浓醇香气在空间弥漫，虹吸壶冒着细腻的气泡。每位读者进门前都会下意识放轻脚步，生怕吵醒了横在猫爬架最高层晒肚皮的大圆脸蓝猫。',
          '兰兰伸出一只粉嫩前爪，在半空打了个大大的哈欠，琥珀色的眼睛转了一圈，又惬意地把脑袋埋进了软垫里。',
        ],
        sceneTag: 'AFTERNOON',
        doodleFocus: 'LANLAN',
      },
      {
        title: '灯火长明的暖心殿堂',
        paragraphs: [
          '夜深了，客人们依然流连忘返。小林合上刚做完笔记的判例集，老王戴着老花镜在一旁批注稿件，阿豪正敲下开源项目的最后一行代码，沫沫正给书咖的猫猫绘制第100幅插画。',
          '豆哥端出一盘刚出锅的火腿蛋三明治，分给大家作为宵夜加餐。“书店不仅仅是卖书和咖啡的地方，它是人与人之间互相取暖的篝火。”',
        ],
        sceneTag: 'NIGHT',
        doodleFocus: 'REGULARS',
      },
    ],
    douGeMonologue:
      '“当初刚接手这个小店时，手头只有两千块钱和这只胖乎乎的蓝猫。很多人说开实体书店是自讨苦吃。但我总相信，只要炉火是热的、咖啡是纯的、猫猫是快乐的，迷茫的灵魂就总会找到回家的路。谢谢大家，也谢谢你，兰兰。”',
    lanLanReaction: {
      quote: '呼噜噜噜……（舒服地把毛茸茸的大圆脸搭在豆哥手腕的穿戴甲上，发出拖拉机般的满足呼噜声）',
      soundMood: 'COZY',
      description: '兰兰蹭了蹭豆哥的围裙，翻起肚皮露出柔软的白毛，尾巴尖尖微微卷曲。',
    },
    customerEpilogues: [
      {
        customerId: 'regular_student_xiaolin',
        name: '小林',
        avatarSeed: 'xiaolin_law',
        role: '青年执业律师',
        epilogue: '小林以优异成绩通过国家统一法律职业资格考试，如今成为公益援助律师。她把书咖列为每周固定的灵感充电站。',
      },
      {
        customerId: 'regular_teacher_laowang',
        name: '老王老师',
        avatarSeed: 'teacher_wang',
        role: '退休文史教师',
        epilogue: '老王出版了30万字文史随笔《街角四十春》，新书签售首站直接选在书咖阅读角，版税收入全额捐赠给流浪动物救助会。',
      },
      {
        customerId: 'regular_coder_ahao',
        name: '程序员阿豪',
        avatarSeed: 'coder_ahao',
        role: '独立游戏制作人',
        epilogue: '阿豪辞去高压大厂工作，在书咖靠窗位完成了独立游戏《猫猫与代码世界》，并在致谢名单第一行写上了“豆哥与兰兰”。',
      },
      {
        customerId: 'regular_artist_momo',
        name: '插画师沫沫',
        avatarSeed: 'artist_momo',
        role: '畅销绘本作家',
        epilogue: '沫沫出版的绘本《蓝猫兰兰的书咖日常》狂销50万册，登顶少儿文学榜首，兰兰成为了全国小读者心目中的明星蓝猫。',
      },
    ],
    commemorativePerks: {
      certificateTitle: '【繁星满径 · 传奇店长殿堂奖状】',
      souvenirName: '纯铜鎏金店徽与全家福鎏金牌匾',
      souvenirDesc: '上面雕刻着豆哥、兰兰与四位熟客的简笔画像，挂在书咖吧台最显眼的正中。',
      unlockBonus: '永久解锁秘密饮品「星河瑰夏特调」与殿堂级专属金箔穿戴甲！',
    },
    sampleStats: {
      days: 30,
      closingCash: 5880.0,
      reputation: 920,
      level: 5,
      ordersServed: 360,
      averageSatisfaction: 96.5,
      totalProfit: 4680.0,
      catHappiestMoment: '在全场读者的注视下，霸占吧台正中呼呼大睡并被温柔抚摸300次',
    },
    createDemoSave: () => {
      const base = createDefaultGrowthState();
      base.level = 5;
      base.currentExp = 1500;
      base.selectedSpecializations = ['COFFEE_ARTISAN', 'HOSPITALITY_WARMTH', 'SUPPLY_CHAIN_SAVVY', 'HEALING_VIBES'];
      const regCust = createDefaultRegularCustomers();
      Object.keys(regCust).forEach((k) => {
        regCust[k].affinityLevel = 4;
        regCust[k].visitsCount = 28;
      });
      return {
        version: CURRENT_SAVE_VERSION,
        saveTimestamp: Date.now(),
        storeName: '豆哥的猫咪书咖 (传奇地标旗舰店)',
        currentDay: 30,
        dailyPhase: 'SETTLEMENT',
        cash: 5880.0,
        reputation: 920,
        customPricing: {
          classic_coffee: 22.0,
          jasmine_tea: 18.0,
          ham_egg_sandwich: 25.0,
          buldak_spicy_noodles: 24.0,
          douge_fried_rice: 28.0,
          seafood_salad: 35.0,
        },
        menuOnSale: {
          classic_coffee: true,
          jasmine_tea: true,
          ham_egg_sandwich: true,
          buldak_spicy_noodles: true,
          douge_fried_rice: true,
          seafood_salad: true,
        },
        pausedProducts: [],
        douGe: {
          name: '豆哥',
          energy: 100,
          maxEnergy: 100,
          mood: 100,
          baristaSkill: 5,
          hospitalitySkill: 5,
          currentAction: 'IDLE',
          life: {
            ...createDefaultDouGeLifeState(),
            activeNailId: 'nail_cat_eye',
            inspirationPoints: 680,
            gooseClearedLevels: 28,
            ownedNailIds: ['nail_cat_paw', 'nail_checkerboard', 'nail_cat_eye', 'nail_floral', 'nail_minimalist'],
          },
        },
        lanLan: {
          name: '兰兰',
          breed: '英国短毛猫 (蓝猫)',
          isPurring: true,
          behavior: {
            ...createDefaultLanLanBehaviorState(),
            currentBehavior: 'SLEEPING',
            dialogueBubble: '呼噜噜~ 全城最幸福的蓝猫就是本喵！',
          },
          satiety: 100,
          mood: 100,
          energy: 95,
          bondLevel: 5,
          bondExp: 100,
        },
        inventory: {
          coffee_beans: 25,
          tea_leaves: 25,
          sandwich_set: 20,
          noodles_set: 20,
          rice_set: 20,
          seafood_set: 20,
          cat_treat_fish: 25,
        },
        unlockedProducts: ['classic_coffee', 'jasmine_tea', 'ham_egg_sandwich', 'buldak_spicy_noodles', 'douge_fried_rice', 'seafood_salad'],
        ownedEquipment: ['manual_dripper', 'tea_pot', 'basic_prep_table', 'electric_cooker', 'teppanyaki_station', 'deluxe_refrigerator'],
        ownedBooks: ['cat_sociology', 'how_to_read_a_book', 'walden', 'coffee_mastery', 'calm_mind'],
        placedFurniture: [...DEFAULT_INITIAL_PLACED_FURNITURE],
        storedFurniture: [],
        transactionHistory: [],
        dailyReports: [],
        growth: base,
        regularCustomers: regCust,
        autoRestock: {
          ...createDefaultAutoRestockConfig(),
          enabled: true,
          dailyBudget: 200,
        },
        loan: createDefaultLoanState(),
        almanac: {
          ...createDefaultAlmanacState(),
          unlockedCustomerStoryIds: ['story_xiaolin_1', 'story_xiaolin_2', 'story_laowang_1', 'story_ahao_1', 'story_momo_1'],
        },
        weather: generateDailyWeather(30),
        settings: { soundMuted: false, autoSaveIntervalMinutes: 1 },
      };
    },
  },

  ENDING_CAT_UTOPIA: {
    id: 'ENDING_CAT_UTOPIA',
    orderNumber: 2,
    title: '治愈角落 · 佛系猫咪乌托邦',
    englishTitle: 'The Cozy Cat Utopia & Zen Sanctuary',
    badge: '🐾 治愈系慢生活结局',
    rarity: 'SR · 岁月静好',
    summary: '拒绝内卷与商业扩张，将书咖打造成全宇宙最懂猫、最惬意的慢节奏角落。兰兰幸福感爆棚，豆哥享受着追剧、做美甲与通关抓大鹅的悠然人生。',
    colorTheme: {
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900 border-emerald-400',
      border: 'border-emerald-600',
      accent: 'text-emerald-700',
    },
    conditionsSummary: [
      '平均顾客出餐满意度 ≥ 95 分',
      '兰兰心情长期保持在 90 点以上，猫玩具与猫窝设施齐备',
      '豆哥生活收集：解锁至少 4 款穿戴甲，通关抓大鹅第2关',
      '店铺无负债，日均净利润温和稳定',
    ],
    storyChapters: [
      {
        title: '猫咪才是真正的店长',
        paragraphs: [
          '店门口贴着一张豆哥手写的萌系小公告：“本店节奏极慢。猫咪若睡在椅子上，请读者自行找小马扎，不可吵醒猫猫。”',
          '兰兰趴在窗边的羊羔绒软垫上，大脑袋枕着前爪，暖融融的肚皮随着呼吸起伏。阳光把它的蓝灰毛发染上一层淡淡的金边。',
          '进店的顾客们自觉脱掉外套，说话声音像微风拂过树叶。这里没有KPI，没有催单，只有留声机里轻柔的鸟鸣白噪声。',
        ],
        sceneTag: 'AFTERNOON',
        doodleFocus: 'LANLAN',
      },
      {
        title: '豆哥的美甲与大鹅日常',
        paragraphs: [
          '吧台后，豆哥正在端详新贴的“水光清透小雏菊”穿戴甲，指尖在手机屏幕上专注轻点。',
          '“通关了！抓大鹅第二关终于过了！”豆哥小声欢呼了一声，立马抱起旁边的兰兰，用脸颊轻蹭它圆圆的腮帮子。',
          '兰兰被吵醒了，傲娇地伸了伸爪子，却还是把毛茸茸的下巴靠在豆哥的胳膊上，发出轰隆隆的舒畅马达声。',
        ],
        sceneTag: 'AFTERNOON',
        doodleFocus: 'DOUGE',
      },
      {
        title: '岁月不争，人间清欢',
        paragraphs: [
          '外面的世界人潮汹涌，大家都在焦虑地奔跑。但在豆哥的猫咪书咖，时间被拉得极长极长。',
          '不需要开成连锁大公司，赚够买猫罐头和生活小确幸的钱就刚刚好。书与猫，清茶与慢光阴，就是生活的全部真谛。',
        ],
        sceneTag: 'DUSK',
        doodleFocus: 'STORE',
      },
    ],
    douGeMonologue:
      '“开这个店最大的收获，不是赚了多少金币，而是每天能看着兰兰无忧无虑地打哈欠。人生短暂，与其在内卷里透支青春，不如和喜欢的小生灵一起，把每个寻常午后都过成一首散文诗。”',
    lanLanReaction: {
      quote: '喵呜~ 呼噜……（懒洋洋翻了个身，用肉垫拍了拍豆哥的毛衣袖子）',
      soundMood: 'LAZY',
      description: '兰兰半睁着琥珀色大圆眼，打了个软萌的小喷嚏，安心地继续睡懒觉。',
    },
    customerEpilogues: [
      {
        customerId: 'regular_coder_ahao',
        name: '程序员阿豪',
        avatarSeed: 'coder_ahao',
        role: '常驻摸鱼客',
        epilogue: '阿豪彻底治好了焦虑失眠，他说全公司最羡慕他的人，因为他每周五下午都要来这儿“向兰兰学习睡觉艺术”。',
      },
      {
        customerId: 'regular_artist_momo',
        name: '插画师沫沫',
        avatarSeed: 'artist_momo',
        role: '手账画师',
        epilogue: '沫沫在书咖画满了厚厚三本《猫猫揣手手观察图鉴》，成为社交媒体上最火爆的治愈系插画博主。',
      },
    ],
    commemorativePerks: {
      certificateTitle: '【悠然时光 · 顶级猫咖疗愈奖】',
      souvenirName: '兰兰同款软蓬蓬羊羔绒大毛球挂件',
      souvenirDesc: '摇晃起来有细微的风铃与猫呼噜震动感，握在手里手感极度柔软。',
      unlockBonus: '永久解锁「猫猫呼噜留声机」，兰兰摸摸好感倍率翻倍！',
    },
    sampleStats: {
      days: 25,
      closingCash: 2980.0,
      reputation: 680,
      level: 4,
      ordersServed: 210,
      averageSatisfaction: 98.2,
      totalProfit: 2180.0,
      catHappiestMoment: '一天累计睡够了14个小时，全天享受了四顿深海小银鱼大餐',
    },
    createDemoSave: () => {
      const base = createDefaultGrowthState();
      base.level = 4;
      base.currentExp = 900;
      base.selectedSpecializations = ['HEALING_VIBES', 'HOSPITALITY_WARMTH'];
      return {
        version: CURRENT_SAVE_VERSION,
        saveTimestamp: Date.now(),
        storeName: '豆哥的猫咪书咖 (佛系治愈小居)',
        currentDay: 25,
        dailyPhase: 'SETTLEMENT',
        cash: 2980.0,
        reputation: 680,
        customPricing: {
          classic_coffee: 20.0,
          jasmine_tea: 16.0,
          ham_egg_sandwich: 22.0,
          buldak_spicy_noodles: 20.0,
          douge_fried_rice: 26.0,
          seafood_salad: 30.0,
        },
        menuOnSale: {
          classic_coffee: true,
          jasmine_tea: true,
          ham_egg_sandwich: true,
          buldak_spicy_noodles: true,
          douge_fried_rice: false,
          seafood_salad: false,
        },
        pausedProducts: [],
        douGe: {
          name: '豆哥',
          energy: 100,
          maxEnergy: 100,
          mood: 100,
          baristaSkill: 4,
          hospitalitySkill: 5,
          currentAction: 'IDLE',
          life: {
            ...createDefaultDouGeLifeState(),
            activeNailId: 'nail_floral',
            inspirationPoints: 450,
            gooseClearedLevels: 35,
            ownedNailIds: ['nail_cat_paw', 'nail_floral', 'nail_minimalist'],
          },
        },
        lanLan: {
          name: '兰兰',
          breed: '英国短毛猫 (蓝猫)',
          isPurring: true,
          behavior: {
            ...createDefaultLanLanBehaviorState(),
            currentBehavior: 'SLEEPING',
            dialogueBubble: '呼噜噜……最喜欢阳光和豆哥的裤腿了~',
          },
          satiety: 100,
          mood: 100,
          energy: 90,
          bondLevel: 5,
          bondExp: 100,
        },
        inventory: {
          coffee_beans: 15,
          tea_leaves: 20,
          sandwich_set: 15,
          noodles_set: 10,
          rice_set: 0,
          seafood_set: 0,
          cat_treat_fish: 25,
        },
        unlockedProducts: ['classic_coffee', 'jasmine_tea', 'ham_egg_sandwich', 'buldak_spicy_noodles'],
        ownedEquipment: ['manual_dripper', 'tea_pot', 'basic_prep_table', 'electric_cooker'],
        ownedBooks: ['cat_sociology', 'how_to_read_a_book', 'walden'],
        placedFurniture: [...DEFAULT_INITIAL_PLACED_FURNITURE],
        storedFurniture: [],
        transactionHistory: [],
        dailyReports: [],
        growth: base,
        regularCustomers: createDefaultRegularCustomers(),
        autoRestock: createDefaultAutoRestockConfig(),
        loan: createDefaultLoanState(),
        almanac: createDefaultAlmanacState(),
        weather: generateDailyWeather(25),
        settings: { soundMuted: false, autoSaveIntervalMinutes: 1 },
      };
    },
  },

  ENDING_COMMERCIAL_GIANT: {
    id: 'ENDING_COMMERCIAL_GIANT',
    orderNumber: 3,
    title: '商业狂飙 · 连锁咖啡新星',
    englishTitle: 'The High-Efficiency Commercial Franchise Giant',
    badge: '📈 商业神话与资本巅峰',
    rarity: 'SR · 商业传奇',
    summary: '凭借严谨缜密的财务 P&L 控制、精益供应链协议与极速设备流水线，将一家街角小店打造成了现金流与效率的商业神话！',
    colorTheme: {
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-900 border-blue-400',
      border: 'border-blue-600',
      accent: 'text-blue-700',
    },
    conditionsSummary: [
      '账面流动资金突破 ¥8,000 元大关',
      '激活【精益供应链】专长，每日自动补货稳定运转',
      '全套现代化高速设备全部购置齐备',
      '日出餐量高效高产，缺货率控制在 5% 以内',
    ],
    storyChapters: [
      {
        title: '分秒必争的黄金吧台',
        paragraphs: [
          '这里是全城运转最高效的咖啡吧台。全自动双头意式机、双温冷藏料理台、数控炒饭电磁灶一字排开，出餐时间被压缩至惊人的秒级响应。',
          '智能自动补货系统精准根据每日天气客流预测触发订购，原料成本比同行低足足15%。哪怕是高峰期，也绝无一次缺货流失。',
          '每一分钱的现金流与损益折旧，都清晰明了地记录在豆哥的财务大屏上，连专业风投分析师看了都赞叹不已。',
        ],
        sceneTag: 'MORNING',
        doodleFocus: 'STORE',
      },
      {
        title: '投资人纷至沓来',
        paragraphs: [
          '全国知名的消费品投资基金高管亲自到店拜访，开出八位数估值的首轮加盟合作意向书。',
          '“豆哥，以你的单店模型和极致周转率，一年内可以把‘豆哥书咖’复制到全国五十座城市！”投资人激动地比划着。',
          '豆哥轻轻晃动着手里的冰美式，指尖的极简黑白棋盘美甲优雅分明。他推了推眼镜，目光落在了正踩着全自动咖啡机顶盖巡视的蓝猫兰兰身上。',
        ],
        sceneTag: 'AFTERNOON',
        doodleFocus: 'DOUGE',
      },
      {
        title: '商业巅峰亦有初心',
        paragraphs: [
          '“商业规模是工具，而不是目的。”豆哥在签约备忘录上增补了一条核心条款：“所有连锁门店，必须设立免费猫咪安睡角与读者静思区。”',
          '赚到了人生第一座金矿，豆哥做的第一件事是为全店换上了最高规格的静音空气净化系统，给兰兰定制了一整套实木进口剑麻通天柱。',
        ],
        sceneTag: 'NIGHT',
        doodleFocus: 'STORE',
      },
    ],
    douGeMonologue:
      '“开店不是做慈善，严谨的财务纪律和商业嗅觉才是让梦想长久生存的铠甲。我们赚到了真金白银，也让每一位进店的顾客享受到了高品质、快节奏的美味餐品。”',
    lanLanReaction: {
      quote: '喵嗷！（站在高高的钛合金双温冷藏柜顶上，威风凛凛地巡视整个现代化吧台）',
      soundMood: 'SWEET',
      description: '兰兰脖子上挂着闪闪发光的小金牌项圈，对全自动咖啡机的磨豆声见怪不怪。',
    },
    customerEpilogues: [
      {
        customerId: 'regular_student_xiaolin',
        name: '小林',
        avatarSeed: 'xiaolin_law',
        role: '首席法律顾问',
        epilogue: '小林所在的红圈律所正式受聘成为“豆哥咖啡餐饮管理集团”的常年法律顾问。',
      },
    ],
    commemorativePerks: {
      certificateTitle: '【商业天算 · 卓越企业家勋章】',
      souvenirName: '纯铜镀金双头手摇复古磨豆机与商业周刊封面',
      souvenirDesc: '封面头条醒目标题：“从两千元到商业奇迹：豆哥与猫咪的经营哲学”。',
      unlockBonus: '永久解锁「智能供应链至尊协议」，原料采购成本永久额外 -15%！',
    },
    sampleStats: {
      days: 28,
      closingCash: 9680.0,
      reputation: 850,
      level: 5,
      ordersServed: 450,
      averageSatisfaction: 93.0,
      totalProfit: 7680.0,
      catHappiestMoment: '在全自动恒温暖气出风口巡视金光闪闪的商业奖杯',
    },
    createDemoSave: () => {
      const base = createDefaultGrowthState();
      base.level = 5;
      base.currentExp = 1600;
      base.selectedSpecializations = ['SUPPLY_CHAIN_SAVVY', 'COFFEE_ARTISAN', 'HOSPITALITY_WARMTH'];
      return {
        version: CURRENT_SAVE_VERSION,
        saveTimestamp: Date.now(),
        storeName: '豆哥的猫咪书咖 (商业旗舰总店)',
        currentDay: 28,
        dailyPhase: 'SETTLEMENT',
        cash: 9680.0,
        reputation: 850,
        customPricing: {
          classic_coffee: 25.0,
          jasmine_tea: 20.0,
          ham_egg_sandwich: 28.0,
          buldak_spicy_noodles: 26.0,
          douge_fried_rice: 32.0,
          seafood_salad: 38.0,
        },
        menuOnSale: {
          classic_coffee: true,
          jasmine_tea: true,
          ham_egg_sandwich: true,
          buldak_spicy_noodles: true,
          douge_fried_rice: true,
          seafood_salad: true,
        },
        pausedProducts: [],
        douGe: {
          name: '豆哥',
          energy: 100,
          maxEnergy: 100,
          mood: 95,
          baristaSkill: 5,
          hospitalitySkill: 4,
          currentAction: 'IDLE',
          life: {
            ...createDefaultDouGeLifeState(),
            activeNailId: 'nail_checkerboard',
            inspirationPoints: 520,
            gooseClearedLevels: 12,
            ownedNailIds: ['nail_checkerboard', 'nail_minimalist'],
          },
        },
        lanLan: {
          name: '兰兰',
          breed: '英国短毛猫 (蓝猫)',
          isPurring: true,
          behavior: {
            ...createDefaultLanLanBehaviorState(),
            currentBehavior: 'RESTING',
            dialogueBubble: '喵嗷~ 今天的营业额又创新高啦！',
          },
          satiety: 100,
          mood: 95,
          energy: 95,
          bondLevel: 4,
          bondExp: 80,
        },
        inventory: {
          coffee_beans: 30,
          tea_leaves: 30,
          sandwich_set: 30,
          noodles_set: 30,
          rice_set: 30,
          seafood_set: 30,
          cat_treat_fish: 30,
        },
        unlockedProducts: ['classic_coffee', 'jasmine_tea', 'ham_egg_sandwich', 'buldak_spicy_noodles', 'douge_fried_rice', 'seafood_salad'],
        ownedEquipment: ['manual_dripper', 'tea_pot', 'basic_prep_table', 'electric_cooker', 'teppanyaki_station', 'deluxe_refrigerator'],
        ownedBooks: ['cat_sociology', 'how_to_read_a_book', 'walden', 'coffee_mastery'],
        placedFurniture: [...DEFAULT_INITIAL_PLACED_FURNITURE],
        storedFurniture: [],
        transactionHistory: [],
        dailyReports: [],
        growth: base,
        regularCustomers: createDefaultRegularCustomers(),
        autoRestock: {
          ...createDefaultAutoRestockConfig(),
          enabled: true,
          dailyBudget: 350,
        },
        loan: createDefaultLoanState(),
        almanac: createDefaultAlmanacState(),
        weather: generateDailyWeather(28),
        settings: { soundMuted: false, autoSaveIntervalMinutes: 1 },
      };
    },
  },

  ENDING_REGULAR_SANCTUARY: {
    id: 'ENDING_REGULAR_SANCTUARY',
    orderNumber: 4,
    title: '人情小筑 · 熟客记忆回廊',
    englishTitle: 'The Regulars’ Sanctuary & Corridor of Memories',
    badge: '💌 人间至暖温情结局',
    rarity: 'SR · 人间温情',
    summary: '不靠打折与营销，靠的是每一声亲切的问候与倾听。书咖墙上贴满了熟客的明信片、合影与感谢信，成为了异乡游子们在城市的灵魂避风港。',
    colorTheme: {
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-900 border-rose-400',
      border: 'border-rose-600',
      accent: 'text-rose-700',
    },
    conditionsSummary: [
      '熟客总到访次数超过 40 次',
      '解锁全部 4 位熟客的所有专属回忆故事',
      '获得全部熟客赠送的独家纪念信物',
      '激活【亲和待客】与【猫咪治愈场】专长',
    ],
    storyChapters: [
      {
        title: '一面写满故事的留言墙',
        paragraphs: [
          '书咖入口处的木质隔断上，原本空白的软木板如今被贴得满满当当。密密麻麻的拍立得照片记录了无数人的青春轨迹。',
          '有小林深夜苦读时揉眼睛的瞬间、老王老师戴着老花镜给青年读者解惑的特写、阿豪代码上线成功时与兰兰击掌的抓拍、沫沫手绘的各式猫猫搞怪涂鸦。',
          '每一张便签纸背后，都是一个关于坚持、释怀与重新出发的真实故事。',
        ],
        sceneTag: 'AFTERNOON',
        doodleFocus: 'REGULARS',
      },
      {
        title: '不约而同的周年惊喜',
        paragraphs: [
          '书咖开业一周年的那天傍晚，窗外飘着濛濛细雨。豆哥正准备提早打烊，门铃突然清脆地响个不停。',
          '门被推开了，小林端着定制的猫咪翻糖蛋糕，老王老师提着自己亲手熬制的花果茶，阿豪抱着一大袋兰兰最爱的小银鱼干，沫沫展开了一幅巨大的手绘全家福挂毯。',
          '“豆哥，生日快乐！谢谢你为我们守护了这个小小的宇宙！”大家欢呼着，连兰兰也兴奋地在大家脚边绕来绕去，毛茸茸的尾巴竖得笔直。',
        ],
        sceneTag: 'NIGHT',
        doodleFocus: 'REGULARS',
      },
      {
        title: '最珍贵的财富在人心里',
        paragraphs: [
          '在这个冷冰冰的数字时代，能有一个推开门就有人叫出你的名字、递上一杯温度刚刚好的热饮、还有一只小猫愿意依偎在你膝头的地方，该是多么奢侈的幸运。',
          '豆哥擦去眼角的泪水，笑着切开蛋糕。灯火摇曳，雨声轻柔，这里盛放着全城最浓郁的温情。',
        ],
        sceneTag: 'NIGHT',
        doodleFocus: 'STORE',
      },
    ],
    douGeMonologue:
      '“我常常想，到底是我开了这家店收留了大家，还是大家在繁华城市里收留了我。看到小林眼里的光、老王老师舒展的眉头，我知道，我们做了一件比赚金币重要得多的事情。”',
    lanLanReaction: {
      quote: '喵呜~ 咕噜噜！（主动跳到小林的膝盖上团成一个毛球，让大家轮流抚摸）',
      soundMood: 'SWEET',
      description: '兰兰发出极度享受的细细叫声，琥珀色大眼睛里倒映着温馨的烛光。',
    },
    customerEpilogues: [
      {
        customerId: 'regular_student_xiaolin',
        name: '小林',
        avatarSeed: 'xiaolin_law',
        role: '老朋友',
        epilogue: '小林说：“在这座陌生的城市，是豆哥的三明治和兰兰的呼噜声陪我熬过了人生最暗的漫漫长夜。”',
      },
      {
        customerId: 'regular_teacher_laowang',
        name: '老王老师',
        avatarSeed: 'teacher_wang',
        role: '忘年交',
        epilogue: '老王老师在日记里写道：“退休后最怕被时代遗忘，而在豆哥的书咖，我找到了生活第二春的温度。”',
      },
    ],
    commemorativePerks: {
      certificateTitle: '【人间羁绊 · 城市心灵守望者奖】',
      souvenirName: '熟客手作毛线百纳织锦挂毯',
      souvenirDesc: '由四位熟客各自亲手编织了一部分，拼成了一只微笑的蓝猫与一杯热咖啡。',
      unlockBonus: '永久解锁「熟客专属感恩菜单」，所有熟客进店小费率翻倍！',
    },
    sampleStats: {
      days: 22,
      closingCash: 2450.0,
      reputation: 780,
      level: 4,
      ordersServed: 240,
      averageSatisfaction: 97.8,
      totalProfit: 1950.0,
      catHappiestMoment: '在四位熟客的大合影中稳居C位，被小林温柔亲吻了脑门小花纹',
    },
    createDemoSave: () => {
      const base = createDefaultGrowthState();
      base.level = 4;
      base.currentExp = 850;
      base.selectedSpecializations = ['HOSPITALITY_WARMTH', 'HEALING_VIBES'];
      const regCust = createDefaultRegularCustomers();
      Object.keys(regCust).forEach((k) => {
        regCust[k].affinityLevel = 4;
        regCust[k].visitsCount = 18;
      });
      return {
        version: CURRENT_SAVE_VERSION,
        saveTimestamp: Date.now(),
        storeName: '豆哥的猫咪书咖 (熟客温情小筑)',
        currentDay: 22,
        dailyPhase: 'SETTLEMENT',
        cash: 2450.0,
        reputation: 780,
        customPricing: {
          classic_coffee: 18.0,
          jasmine_tea: 15.0,
          ham_egg_sandwich: 20.0,
          buldak_spicy_noodles: 20.0,
          douge_fried_rice: 25.0,
          seafood_salad: 30.0,
        },
        menuOnSale: {
          classic_coffee: true,
          jasmine_tea: true,
          ham_egg_sandwich: true,
          buldak_spicy_noodles: true,
          douge_fried_rice: true,
          seafood_salad: false,
        },
        pausedProducts: [],
        douGe: {
          name: '豆哥',
          energy: 100,
          maxEnergy: 100,
          mood: 100,
          baristaSkill: 4,
          hospitalitySkill: 5,
          currentAction: 'IDLE',
          life: {
            ...createDefaultDouGeLifeState(),
            activeNailId: 'nail_cat_paw',
            inspirationPoints: 390,
            gooseClearedLevels: 15,
            ownedNailIds: ['nail_cat_paw', 'nail_floral'],
          },
        },
        lanLan: {
          name: '兰兰',
          breed: '英国短毛猫 (蓝猫)',
          isPurring: true,
          behavior: {
            ...createDefaultLanLanBehaviorState(),
            currentBehavior: 'APPROACHING',
            dialogueBubble: '喵呜~ 熟客朋友们都在，好开心呀！',
          },
          satiety: 100,
          mood: 100,
          energy: 90,
          bondLevel: 5,
          bondExp: 100,
        },
        inventory: {
          coffee_beans: 15,
          tea_leaves: 15,
          sandwich_set: 15,
          noodles_set: 15,
          rice_set: 10,
          seafood_set: 0,
          cat_treat_fish: 20,
        },
        unlockedProducts: ['classic_coffee', 'jasmine_tea', 'ham_egg_sandwich', 'buldak_spicy_noodles', 'douge_fried_rice'],
        ownedEquipment: ['manual_dripper', 'tea_pot', 'basic_prep_table', 'electric_cooker', 'teppanyaki_station'],
        ownedBooks: ['cat_sociology', 'how_to_read_a_book', 'walden'],
        placedFurniture: [...DEFAULT_INITIAL_PLACED_FURNITURE],
        storedFurniture: [],
        transactionHistory: [],
        dailyReports: [],
        growth: base,
        regularCustomers: regCust,
        autoRestock: createDefaultAutoRestockConfig(),
        loan: createDefaultLoanState(),
        almanac: {
          ...createDefaultAlmanacState(),
          unlockedCustomerStoryIds: ['story_xiaolin_1', 'story_xiaolin_2', 'story_laowang_1', 'story_ahao_1', 'story_momo_1'],
        },
        weather: generateDailyWeather(22),
        settings: { soundMuted: false, autoSaveIntervalMinutes: 1 },
      };
    },
  },

  ENDING_RAINY_FAREWELL: {
    id: 'ENDING_RAINY_FAREWELL',
    orderNumber: 5,
    title: '现实风雨 · 暂别与新生',
    englishTitle: 'The Rainy Farewell & Hopeful Dawn',
    badge: '🌧️ 经营破产与坚韧释怀结局',
    rarity: 'SPECIAL · 坚韧新生',
    summary: '高昂的店租、连续的暴雨与资金链断裂，让书咖被迫按下暂停键。但这不是终点，雨夜中豆哥抱着兰兰，在熟客的拥抱下，许下了春暖花开重新出发的誓言。',
    colorTheme: {
      badgeBg: 'bg-stone-200',
      badgeText: 'text-stone-800 border-stone-400',
      border: 'border-stone-700',
      accent: 'text-stone-800',
    },
    conditionsSummary: [
      '流动资金彻底告罄 (负债或现金低于安全底线)',
      '无法支付固定店租与水电折旧支出',
      '启动破产清算或自救未果',
    ],
    storyChapters: [
      {
        title: '冰冷的账单与阴雨天',
        paragraphs: [
          '外面的雨已经下了整整一周。屋檐的水滴声敲打着玻璃，门前的街道空无一人。',
          '吧台上的账本被翻得卷了边。房租催缴单、原料供货单和电费账单整齐地叠在一旁，红色的赤字无声地诉说着实体小店生存的不易。',
          '豆哥叹了口气，算完了最后一块钱。即使倾尽所有，也无法支付下个季度的昂贵租金了。',
        ],
        sceneTag: 'RAIN',
        doodleFocus: 'FAREWELL',
      },
      {
        title: '最后一个打烊的深夜',
        paragraphs: [
          '豆哥将门上的牌子轻轻翻到了“打烊”。他把剩余的咖啡豆分装成小袋，仔细擦拭着陪伴了自己许多个日夜的手冲壶。',
          '门突然被推开了，风带着雨丝涌进来。小林、老王和阿豪冒着大雨赶了过来，衣服都湿了一半。',
          '“豆哥，我们来帮你搬书。”没有指责，没有叹息，大家默默地卷起袖子，帮着把一架架书装箱。老王掏出皮夹买下了店里所有剩下的红茶，小林紧紧握住豆哥的手。',
        ],
        sceneTag: 'NIGHT',
        doodleFocus: 'REGULARS',
      },
      {
        title: '怀里的小猫与春天的约定',
        paragraphs: [
          '卷帘门轰隆一声拉下，钥匙在锁孔里转动。豆哥把兰兰裹进厚厚的粉色羽绒服里，只露出一颗毛茸茸的小圆脑袋。',
          '兰兰似乎明白了什么，伸出软乎乎的前爪，轻轻搭在豆哥红肿的眼睛上，喉咙里发出温润而坚定的呼噜声。',
          '“别怕，兰兰。”豆哥在伞下抬起头，雨水洗刷着街角的霓虹，“我们虽然输掉了一间店铺，但学到了经营的真本领，还认识了这么好的朋友。等来年开春，我们开一辆移动猫咪咖啡车，重新出发！”',
        ],
        sceneTag: 'RAIN',
        doodleFocus: 'FAREWELL',
      },
    ],
    douGeMonologue:
      '“创业绝非童话，现实的风雨偶尔会掀翻脆弱的小舟。但只要爱还在、小猫还在、信念还在，暂时的告别就不是失败，而是下一场更精彩冒险的序曲。”',
    lanLanReaction: {
      quote: '喵呜……呼噜噜（温柔地把湿漉漉的粉鼻头抵在豆哥脸颊上）',
      soundMood: 'COZY',
      description: '兰兰用额头用力蹭了蹭豆哥的脖颈，仿佛在说：“只要跟着你，哪里都是家。”',
    },
    customerEpilogues: [
      {
        customerId: 'regular_student_xiaolin',
        name: '小林',
        avatarSeed: 'xiaolin_law',
        role: '患难之交',
        epilogue: '小林帮豆哥免费审查了所有的退租与清算协议，并约定好下一家新店开业，她依然是001号会员。',
      },
      {
        customerId: 'regular_coder_ahao',
        name: '阿豪',
        avatarSeed: 'coder_ahao',
        role: '技术后援',
        epilogue: '阿豪为豆哥搭建了线上预售粉丝社群，短短几天就有数百位老读者预约了新店的重启支持券。',
      },
    ],
    commemorativePerks: {
      certificateTitle: '【逆风破浪 · 坚韧追梦人特颁奖章】',
      souvenirName: '雨夜歇业打烊纪念木质门牌',
      souvenirDesc: '门牌背面写着所有熟客的亲笔签名与寄语：“期待重逢于下个花季”。',
      unlockBonus: '下次重新开局时，初始启动资金赠送 +¥500 暖心天使复苏金！',
    },
    sampleStats: {
      days: 14,
      closingCash: -35.0,
      reputation: 340,
      level: 2,
      ordersServed: 95,
      averageSatisfaction: 86.5,
      totalProfit: -520.0,
      catHappiestMoment: '在风雨交加的夜里紧紧依偎在豆哥的大衣怀里听着心跳声',
    },
    createDemoSave: () => {
      const base = createDefaultGrowthState();
      base.level = 2;
      base.currentExp = 130;
      return {
        version: CURRENT_SAVE_VERSION,
        saveTimestamp: Date.now(),
        storeName: '豆哥的猫咪书咖 (风雨歇业篇)',
        currentDay: 14,
        dailyPhase: 'SETTLEMENT',
        cash: 12.0,
        reputation: 340,
        customPricing: {
          classic_coffee: 16.0,
          jasmine_tea: 14.0,
          ham_egg_sandwich: 20.0,
          buldak_spicy_noodles: 18.0,
          douge_fried_rice: 22.0,
          seafood_salad: 28.0,
        },
        menuOnSale: {
          classic_coffee: true,
          jasmine_tea: true,
          ham_egg_sandwich: true,
          buldak_spicy_noodles: false,
          douge_fried_rice: false,
          seafood_salad: false,
        },
        pausedProducts: [],
        douGe: {
          name: '豆哥',
          energy: 45,
          maxEnergy: 100,
          mood: 70,
          baristaSkill: 2,
          hospitalitySkill: 2,
          currentAction: 'RESTING',
          life: {
            ...createDefaultDouGeLifeState(),
            activeNailId: null,
            inspirationPoints: 60,
            gooseClearedLevels: 1,
            ownedNailIds: [],
          },
        },
        lanLan: {
          name: '兰兰',
          breed: '英国短毛猫 (蓝猫)',
          isPurring: true,
          behavior: {
            ...createDefaultLanLanBehaviorState(),
            currentBehavior: 'APPROACHING',
            dialogueBubble: '喵呜……豆哥别难过，兰兰一直陪着你。',
          },
          satiety: 80,
          mood: 85,
          energy: 85,
          bondLevel: 3,
          bondExp: 40,
        },
        inventory: {
          coffee_beans: 2,
          tea_leaves: 1,
          sandwich_set: 1,
          noodles_set: 0,
          rice_set: 0,
          seafood_set: 0,
          cat_treat_fish: 5,
        },
        unlockedProducts: ['classic_coffee', 'jasmine_tea', 'ham_egg_sandwich'],
        ownedEquipment: ['manual_dripper', 'tea_pot', 'basic_prep_table'],
        ownedBooks: ['cat_sociology', 'how_to_read_a_book'],
        placedFurniture: [...DEFAULT_INITIAL_PLACED_FURNITURE],
        storedFurniture: [],
        transactionHistory: [],
        dailyReports: [],
        growth: base,
        regularCustomers: createDefaultRegularCustomers(),
        autoRestock: createDefaultAutoRestockConfig(),
        loan: {
          hasActiveLoan: true,
          principal: 200,
          dailyInterestRate: 0.03,
          accumulatedInterest: 36,
          borrowedDay: 8,
        },
        almanac: createDefaultAlmanacState(),
        weather: {
          type: 'STORMY',
          name: '狂风暴雨',
          icon: '⛈️',
          temperature: 15,
          trafficMultiplier: 0.6,
          patienceBonusSeconds: -4,
          description: '暴雨如注，街上行人稀少。',
          recommendedAmbience: 'RAIN_SOFT',
        },
        settings: { soundMuted: false, autoSaveIntervalMinutes: 1 },
      };
    },
  },

  ENDING_LITERARY_HAVEN: {
    id: 'ENDING_LITERARY_HAVEN',
    orderNumber: 6,
    title: '隐世书痴 · 漫步时光',
    englishTitle: 'The Hermit’s Bookstore & Literary Haven',
    badge: '📚 纯粹书香学术结局',
    rarity: 'R · 墨韵书香',
    summary: '退去快节奏的喧嚣，这里成为了城市里极少数能真正让人沉下心来阅读经典的秘境。藏书四壁，纸香墨浓，静坐常思，兰兰在古籍顶层安然入眠。',
    colorTheme: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800 border-amber-300',
      border: 'border-amber-700',
      accent: 'text-amber-800',
    },
    conditionsSummary: [
      '藏书量与书架设施全满，图书阅读偏好顾客占比高',
      '茶饮与清淡简餐出单占比超 60%',
      '保持安静与高雅氛围，店内阅读满意度加成显著',
    ],
    storyChapters: [
      {
        title: '被旧书香气浸润的屋子',
        paragraphs: [
          '走进店门，迎面扑来的不是浓烈的奶香，而是杉木书架与干燥古老纸页混合出的独特清香。',
          '三面顶天立地的松木书架上，整齐码放着哲学、文学、历史与猫咪社会学的经典著作。每一本都由豆哥亲手包上了牛皮纸书皮。',
          '这里不允许任何高声喧哗与短视频外放。所有读者都默契地享受着翻动书页沙沙作响的静谧交响乐。',
        ],
        sceneTag: 'MORNING',
        doodleFocus: 'BOOKS',
      },
      {
        title: '懂书的学者与懂猫的时光',
        paragraphs: [
          '老王老师几乎把这里当成了自己的第二书斋，常常一坐就是一个下午。他手里端着澄澈的初夏茉莉茶，手边摊开的是清代地方志。',
          '兰兰最喜欢趴在老哲学书那一层的书脊上打瞌睡，长长的尾巴偶尔像书签一样垂下来，在空中慢悠悠地打个卷儿。',
          '读者们路过时，总会极轻地会心一笑，轻轻把借阅的书本放回原位。',
        ],
        sceneTag: 'AFTERNOON',
        doodleFocus: 'LANLAN',
      },
      {
        title: '繁华深处的文明庇护所',
        paragraphs: [
          '城市每天都在更新换代，电子屏幕掠夺着所有人的注意力。但豆哥的猫咪书咖，却固执地保留着两百年前人类读书的庄重与从容。',
          '文字在这里有了重量，思考在这里有了栖息之所。一盏昏黄的阅读灯，一杯温润的回甘茶，就是对这个匆忙世界最温柔的反抗。',
        ],
        sceneTag: 'DUSK',
        doodleFocus: 'STORE',
      },
    ],
    douGeMonologue:
      '“在这个人人都追求‘三秒抓住眼球’的速食时代，我们想守住那些需要花三小时、三十天去细细咀嚼的思想。只要还有一个人愿意坐下翻开书，这盏灯就会一直亮着。”',
    lanLanReaction: {
      quote: '呼……呼……（把下巴垫在厚厚的《瓦尔登湖》精装本上，耳朵偶尔动一下）',
      soundMood: 'LAZY',
      description: '兰兰完全习惯了书页翻动的细微沙沙声，那对它而言是世界上最好的催眠曲。',
    },
    customerEpilogues: [
      {
        customerId: 'regular_teacher_laowang',
        name: '老王老师',
        avatarSeed: 'teacher_wang',
        role: '学术知音',
        epilogue: '老王在此完成了《城市边缘的读书人》专题调研，被多所高校社会学系引用。',
      },
    ],
    commemorativePerks: {
      certificateTitle: '【卷轶浩繁 · 守书隐者典藏状】',
      souvenirName: '手工雕刻紫铜藏书票印章与百年杉木书签',
      souvenirDesc: '上面雕刻着兰兰趴在展开书卷上的精致剪影，钤印清秀端庄。',
      unlockBonus: '永久解锁「静思禅意茶席」，所有阅读型顾客满意度与耐受度大幅提高！',
    },
    sampleStats: {
      days: 26,
      closingCash: 3100.0,
      reputation: 720,
      level: 4,
      ordersServed: 220,
      averageSatisfaction: 97.0,
      totalProfit: 2300.0,
      catHappiestMoment: '在《世界哲学史》精装套书顶层享受了一个无人打扰的长觉',
    },
    createDemoSave: () => {
      const base = createDefaultGrowthState();
      base.level = 4;
      base.currentExp = 820;
      base.selectedSpecializations = ['HOSPITALITY_WARMTH'];
      return {
        version: CURRENT_SAVE_VERSION,
        saveTimestamp: Date.now(),
        storeName: '豆哥的猫咪书咖 (静墨藏书阁)',
        currentDay: 26,
        dailyPhase: 'SETTLEMENT',
        cash: 3100.0,
        reputation: 720,
        customPricing: {
          classic_coffee: 18.0,
          jasmine_tea: 16.0,
          ham_egg_sandwich: 20.0,
          buldak_spicy_noodles: 18.0,
          douge_fried_rice: 24.0,
          seafood_salad: 28.0,
        },
        menuOnSale: {
          classic_coffee: true,
          jasmine_tea: true,
          ham_egg_sandwich: true,
          buldak_spicy_noodles: false,
          douge_fried_rice: false,
          seafood_salad: false,
        },
        pausedProducts: [],
        douGe: {
          name: '豆哥',
          energy: 100,
          maxEnergy: 100,
          mood: 95,
          baristaSkill: 4,
          hospitalitySkill: 4,
          currentAction: 'IDLE',
          life: {
            ...createDefaultDouGeLifeState(),
            activeNailId: 'nail_minimalist',
            inspirationPoints: 340,
            gooseClearedLevels: 8,
            ownedNailIds: ['nail_minimalist'],
          },
        },
        lanLan: {
          name: '兰兰',
          breed: '英国短毛猫 (蓝猫)',
          isPurring: true,
          behavior: {
            ...createDefaultLanLanBehaviorState(),
            currentBehavior: 'SLEEPING',
            dialogueBubble: '呼噜噜……满屋子都是好闻的旧书香气。',
          },
          satiety: 95,
          mood: 95,
          energy: 90,
          bondLevel: 4,
          bondExp: 75,
        },
        inventory: {
          coffee_beans: 15,
          tea_leaves: 25,
          sandwich_set: 15,
          noodles_set: 5,
          rice_set: 0,
          seafood_set: 0,
          cat_treat_fish: 15,
        },
        unlockedProducts: ['classic_coffee', 'jasmine_tea', 'ham_egg_sandwich'],
        ownedEquipment: ['manual_dripper', 'tea_pot', 'basic_prep_table'],
        ownedBooks: ['cat_sociology', 'how_to_read_a_book', 'walden', 'coffee_mastery', 'calm_mind'],
        placedFurniture: [...DEFAULT_INITIAL_PLACED_FURNITURE],
        storedFurniture: [],
        transactionHistory: [],
        dailyReports: [],
        growth: base,
        regularCustomers: createDefaultRegularCustomers(),
        autoRestock: createDefaultAutoRestockConfig(),
        loan: createDefaultLoanState(),
        almanac: createDefaultAlmanacState(),
        weather: generateDailyWeather(26),
        settings: { soundMuted: false, autoSaveIntervalMinutes: 1 },
      };
    },
  },
};
