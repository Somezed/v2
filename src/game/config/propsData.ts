/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 书咖道具与珍藏品扩展库 (PropsData)
 * 提升道具数量与收集难度分级：
 * 包含：专业咖啡经营器具、兰兰猫咪玩物与美食、扩充至18款的穿戴甲、动漫短剧周边
 */

export type PropRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type PropCategory = 'BARISTA_TOOL' | 'CAT_TOY' | 'PRESS_ON_NAIL' | 'ANIME_DECOR';

export interface GamePropItem {
  id: string;
  name: string;
  category: PropCategory;
  rarity: PropRarity;
  description: string;
  flavorText: string;
  icon: string;
  // 收集难度与解锁条件
  unlockRequirement: {
    minStoreLevel?: number;
    requiredInspiration?: number;
    requiredCash?: number;
    requiredDeliveredOrders?: number;
    requiredRegularAffinity?: { regularId: string; minLevel: number };
    specialConditionDesc: string;
  };
  // 实际经营或生活增益
  effectDesc: string;
}

// 1. 专业咖啡师与茶饮经营器具 (8件)
export const BARISTA_TOOLS: GamePropItem[] = [
  {
    id: 'tool_walnut_grinder',
    name: '复古胡桃木手摇研磨机',
    category: 'BARISTA_TOOL',
    rarity: 'COMMON',
    description: '实木机身搭配高硬度精密镀钛磨芯，研磨颗粒均匀，保留丰富咖啡花果芳香。',
    flavorText: '“每次手摇听着咔嗒清脆的碎豆声，整间书咖就醒过来了。”',
    icon: '⚙️',
    unlockRequirement: {
      minStoreLevel: 1,
      requiredCash: 45,
      specialConditionDesc: '书咖开业即可购买购置',
    },
    effectDesc: '制作咖啡时出餐基础满意度 +2 分',
  },
  {
    id: 'tool_gooseneck_kettle',
    name: '天鹅颈智能恒温手冲壶',
    category: 'BARISTA_TOOL',
    rarity: 'RARE',
    description: '特制90度下出水鹅颈细嘴，水流垂直稳定，精准定点注水控流。',
    flavorText: '“92度细流缓缓穿过粉层，冲出来的耶加雪菲香气能飘满整个阅读角。”',
    icon: '🫖',
    unlockRequirement: {
      minStoreLevel: 2,
      requiredInspiration: 25,
      requiredDeliveredOrders: 15,
      specialConditionDesc: '需达到 Lv.2 且累计成功交付 15 单',
    },
    effectDesc: '手冲咖啡制作时间缩短 10%',
  },
  {
    id: 'tool_brass_tamper',
    name: '重力恒压黄铜压粉锤',
    category: 'BARISTA_TOOL',
    rarity: 'RARE',
    description: '整块高密度黄铜车削而成，30磅自适应水平恒压回弹，杜绝粉饼通道效应。',
    flavorText: '“压下去手感沉稳清脆，萃取出的咖啡油脂厚得像一层天鹅绒。”',
    icon: '🔨',
    unlockRequirement: {
      minStoreLevel: 2,
      requiredCash: 95,
      requiredDeliveredOrders: 20,
      specialConditionDesc: '需累计出餐 20 单并支付 ¥95 采购费',
    },
    effectDesc: '意式咖啡类顾客给小费几率提升 15%',
  },
  {
    id: 'tool_origami_dripper',
    name: '景德镇手工白瓷折纸滤杯',
    category: 'BARISTA_TOOL',
    rarity: 'RARE',
    description: '二十条纵向立体导流棱，肋骨间距经过流体动力学计算，下水通畅不积涩。',
    flavorText: '“白瓷温润透光，即使不冲咖啡，摆在吧台也是一件赏心悦目的手作美物。”',
    icon: '☕',
    unlockRequirement: {
      minStoreLevel: 3,
      requiredInspiration: 35,
      specialConditionDesc: '需经营等级达到 Lv.3 并积累 35 点灵感',
    },
    effectDesc: '阅读型顾客对饮品的品质评价大幅提升',
  },
  {
    id: 'tool_latte_pitcher',
    name: '斜口聚拢特氟龙拉花奶缸',
    category: 'BARISTA_TOOL',
    rarity: 'EPIC',
    description: '专为精细羽毛与郁金香拉花打造的鹰嘴导流槽，奶泡绵密如丝缎。',
    flavorText: '“豆哥今天给常客画了一只歪头蓝猫拉花，客人拍照发了小红书！”',
    icon: '🥛',
    unlockRequirement: {
      minStoreLevel: 3,
      requiredRegularAffinity: { regularId: 'regular_lin', minLevel: 2 },
      specialConditionDesc: '需与常客小林达到 Lv.2 熟客关系后获赠推荐',
    },
    effectDesc: '咖啡出餐时有 30% 概率触发【惊艳拉花】获得双倍小费',
  },
  {
    id: 'tool_bamboo_whisk',
    name: '百本立极细紫竹茶筅',
    category: 'BARISTA_TOOL',
    rarity: 'EPIC',
    description: '老紫竹手工劈丝成百根弯卷筅穗，击打茶汤能瞬间泛起如翡翠般的云朵浮沫。',
    flavorText: '“老师傅亲手制作的茶筅，点茶时手腕轻柔，茶香温润四溢。”',
    icon: '🍵',
    unlockRequirement: {
      minStoreLevel: 4,
      requiredRegularAffinity: { regularId: 'regular_wang', minLevel: 3 },
      specialConditionDesc: '需与老王达到 Lv.3 默契熟客关系解锁专属赠礼',
    },
    effectDesc: '茶饮制作时间缩短 15%，品质追求型顾客满意度 +8',
  },
  {
    id: 'tool_silver_spoon',
    name: '纯银手工雕花猫爪搅拌匙',
    category: 'BARISTA_TOOL',
    rarity: 'EPIC',
    description: '手柄末端手工雕琢一只立体小肉垫，匙身刻有《豆哥的猫咪书咖》限量编号。',
    flavorText: '“搅拌方糖时轻撞瓷杯的叮当声，是下午三点最悦耳的书咖旋律。”',
    icon: '🥄',
    unlockRequirement: {
      minStoreLevel: 4,
      requiredInspiration: 50,
      specialConditionDesc: '需消耗 50 点书咖灵感并获得 50 份顾客五星好评',
    },
    effectDesc: '全店每日经营声誉增长速度额外 +20%',
  },
  {
    id: 'tool_wooden_menu_board',
    name: '传家宝·黑胡桃实木雕花招牌',
    category: 'BARISTA_TOOL',
    rarity: 'LEGENDARY',
    description: '由整块北美黑胡桃原木手工打磨，镶嵌黄铜猫咪浮雕徽章，见证书咖从破旧角落到城市明珠。',
    flavorText: '“岁月流转，客来客往。只要推开这扇门，永远有一杯热咖啡和呼噜噜的蓝猫在等你。”',
    icon: '🏆',
    unlockRequirement: {
      minStoreLevel: 5,
      requiredInspiration: 100,
      requiredDeliveredOrders: 60,
      specialConditionDesc: '经营等级满级 Lv.5 且历史总出餐超过 60 单',
    },
    effectDesc: '全店所有商品售价接受上限放宽 20%，顾客极少嫌贵',
  },
];

// 2. 蓝猫兰兰专属爱物与玩具道具 (6件)
export const CAT_PROPS: GamePropItem[] = [
  {
    id: 'cat_catnip_mouse',
    name: '纯天然特级薄荷小木鼠',
    category: 'CAT_TOY',
    rarity: 'COMMON',
    description: '纯棉麻布缝制，内填高山有机猫薄荷叶，散发让猫咪瞬间上头的清冷草本香气。',
    flavorText: '“兰兰抱着小木鼠在羊毛地毯上疯狂蹬后腿，平时的高冷仪态荡然无存。”',
    icon: '🐭',
    unlockRequirement: {
      minStoreLevel: 1,
      requiredCash: 25,
      specialConditionDesc: '书咖开店即可在猫咪区购置',
    },
    effectDesc: '兰兰在店内玩耍概率提升，呼噜声更加响亮',
  },
  {
    id: 'cat_feather_wand',
    name: '鸵鸟羽毛弹性伸缩逗猫棒',
    category: 'CAT_TOY',
    rarity: 'RARE',
    description: '天然蓬松鸵鸟绒羽，轻微晃动宛如掠过林间的飞鸟，激发蓝猫敏捷的捕猎本能。',
    flavorText: '“哪怕正在打瞌睡，只要空中羽毛轻轻一晃，两只琥珀大眼睛立刻瞪得圆溜溜！”',
    icon: '🪶',
    unlockRequirement: {
      minStoreLevel: 2,
      requiredInspiration: 20,
      specialConditionDesc: '需达到 Lv.2 并拥有 20 点书咖灵感',
    },
    effectDesc: '互动时可主动引导兰兰跑动，解锁【短跑观察】行为图鉴',
  },
  {
    id: 'cat_tuna_treat',
    name: '深海野生金枪鱼冻干纯肉罐',
    category: 'CAT_TOY',
    rarity: 'RARE',
    description: '零下40度真空宇航级冻干锁鲜，大块纯肉酥脆清香，一口咬下去满是深海鲜美。',
    flavorText: '“罐头盖子刚揭开半寸，兰兰就已经以百米冲刺的速度瞬移到了吧台底下！”',
    icon: '🐟',
    unlockRequirement: {
      minStoreLevel: 2,
      requiredCash: 60,
      specialConditionDesc: '需累计营业 3 天以上并支付 ¥60 进货',
    },
    effectDesc: '兰兰主动亲近豆哥的概率提升 50%，陪伴加成提高',
  },
  {
    id: 'cat_wool_tunnel',
    name: '加厚隔音羊毛毡猫咪隧道',
    category: 'CAT_TOY',
    rarity: 'EPIC',
    description: '天然羊毛高温压制，透气保暖且带两个观察小天窗，是猫咪埋伏突袭的神秘基地。',
    flavorText: '“兰兰最喜欢钻进隧道里露出两只圆圆的小耳朵，暗中观察过往的每位客人。”',
    icon: '🎪',
    unlockRequirement: {
      minStoreLevel: 3,
      requiredInspiration: 45,
      specialConditionDesc: '需达到 Lv.3 并摆放至少一件猫咪专区家具',
    },
    effectDesc: '阅读型顾客在店内停留时满意度自然衰减降低 30%',
  },
  {
    id: 'cat_organic_grass',
    name: '现采水培有机大麦猫草盆',
    category: 'CAT_TOY',
    rarity: 'EPIC',
    description: '无土水培长出的翠绿嫩芽，清脆多汁富含天然植物纤维，帮助舒缓猫咪肠胃排毛。',
    flavorText: '“咔嚓咔嚓像台小割草机一样啃草尖，啃完了心满意足地伸个大懒腰。”',
    icon: '🌱',
    unlockRequirement: {
      minStoreLevel: 4,
      requiredDeliveredOrders: 35,
      specialConditionDesc: '需累计出餐 35 单且未发生重大经营危机',
    },
    effectDesc: '兰兰伸懒腰与安睡行为出现时，为全店提供治愈氛围加成',
  },
  {
    id: 'cat_rainbow_big_yarn',
    name: '传奇·手工彩虹羊绒大毛球',
    category: 'CAT_TOY',
    rarity: 'LEGENDARY',
    description: '由沫沫亲手用七色柔软羊绒缠绕制成的特大号毛球，里面缝了一枚清脆微响的小铜铃。',
    flavorText: '“兰兰对这颗大毛球爱不释手，甚至晚上睡觉都要一只爪爪搭在球面上才肯闭眼。”',
    icon: '🧶',
    unlockRequirement: {
      minStoreLevel: 5,
      requiredRegularAffinity: { regularId: 'regular_momo', minLevel: 4 },
      specialConditionDesc: '需与闺蜜沫沫达到 Lv.4 莫逆知己解锁独家赠礼',
    },
    effectDesc: '拍打毛球时全店顾客满意度实时 +5，小费概率翻倍',
  },
];

// 3. 扩充后的穿戴甲收藏库 (由10款大幅扩充至18款，并配置分级收集难度)
export const EXPANDED_PRESS_ON_NAILS = [
  // 基础款
  {
    id: 'nail_latte_paw',
    name: '雾面奶咖小猫爪',
    styleTag: '猫咪治愈',
    rarity: 'COMMON',
    description: '醇厚暖咖底色，指尖点缀白色立体微浮雕小猫肉垫，端咖啡杯时仿佛猫猫在借力。',
    dialogue: '“这个肉垫手感太逼真了！连兰兰刚才都歪着头盯着我的指尖看了半天。”',
    unlockCondition: '书咖开业自带 (经典款)',
    inspirationCost: 0,
    unlockedByDefault: true,
  },
  {
    id: 'nail_bw_checker',
    name: '极简黑白棋盘格',
    styleTag: '包豪斯几何',
    rarity: 'COMMON',
    description: '经典黑白微型棋盘格线条与哑光法式留白，翻开精装书页时极具现代书卷气息。',
    dialogue: '“黑白双色和我们书咖的手绘线条风格绝配，翻书的时候特别有质感。”',
    unlockCondition: '消耗 15 点书咖灵感解锁',
    inspirationCost: 15,
  },
  {
    id: 'nail_grape_ice',
    name: '夏日冰透青提',
    styleTag: '水光清透',
    rarity: 'COMMON',
    description: '水光微透的浅翠绿渐变，指缘有如清晨薄荷上的细碎露珠，视觉降温5度。',
    dialogue: '“夏天冲泡冷萃咖啡或者茉莉花茶时戴这一副，整个人都清凉下来了。”',
    unlockCondition: '消耗 20 点书咖灵感解锁',
    inspirationCost: 20,
  },
  {
    id: 'nail_cat_eye_silver',
    name: '星空碎银猫眼',
    styleTag: '闪耀猫眼',
    rarity: 'RARE',
    description: '深灰磁吸微光，灯光变换下折射出银白光晕，像夜空里兰兰悄悄睁开的眼睛。',
    dialogue: '“在书架背阴处稍微转动手腕，这道银线猫眼就会流动，太梦幻了！”',
    unlockCondition: 'Lv.2 解锁 + 消耗 25 点灵感',
    inspirationCost: 25,
  },
  {
    id: 'nail_retro_emboss',
    name: '复古维多利亚浮雕',
    styleTag: '复古宫廷',
    rarity: 'RARE',
    description: '象牙白底色搭配巴洛克卷草纹立体微雕，典雅克制，适合捧读古典文学。',
    dialogue: '“老王今天来喝茶时看到还夸了一句，说这花纹让他想起老洋房里的石膏线。”',
    unlockCondition: 'Lv.2 解锁 + 消耗 30 点灵感',
    inspirationCost: 30,
  },
  {
    id: 'nail_french_daisy',
    name: '法式手绘小雏菊',
    styleTag: '田园森系',
    rarity: 'RARE',
    description: '极细笔刷勾勒的鹅黄花蕊与微卷花瓣，在半透明裸粉甲面上静静盛开。',
    dialogue: '“画这朵小雏菊需要极大的耐心，就像每天早上等咖啡缓缓滴滤一样。”',
    unlockCondition: 'Lv.2 解锁 + 消耗 30 点灵感',
    inspirationCost: 30,
  },
  {
    id: 'nail_aurora_glaze',
    name: '极光偏光幻彩冰晶',
    styleTag: '赛博梦幻',
    rarity: 'EPIC',
    description: '多层纳米镀膜随着光线在浅粉与冰蓝之间变幻，像阳光斜穿过咖啡蒸汽的色彩。',
    dialogue: '“阳光打在窗台桌面上时，手指一动就能折射出一道小彩虹在墙上。”',
    unlockCondition: 'Lv.3 解锁 + 与沫沫达到 Lv.2 熟客',
    inspirationCost: 40,
  },
  {
    id: 'nail_matcha_frost',
    name: '宇治抹茶碎冰奶冻',
    styleTag: '茶歇甜品',
    rarity: 'EPIC',
    description: '微磨砂的抹茶哑光渐变，指尖点缀晶莹微透明的碎冰立体胶块，美味诱人。',
    dialogue: '“戴着这副去给客人送红豆抹茶千层，客人还以为是配套的甜品周边呢。”',
    unlockCondition: 'Lv.3 解锁 + 消耗 45 点灵感',
    inspirationCost: 45,
  },
  {
    id: 'nail_black_gold_rose',
    name: '暗夜黑金荆棘玫瑰',
    styleTag: '哥特暗黑',
    rarity: 'EPIC',
    description: '哑光曜黑底色嵌缠细金微雕玫瑰，低调神秘，在深夜火鸡面的灯光下格外吸睛。',
    dialogue: '“深夜打烊后独自结算账单时戴上它，感觉自己不是店长，而是神秘公馆的主人。”',
    unlockCondition: 'Lv.4 解锁 + 消耗 55 点灵感',
    inspirationCost: 55,
  },
  {
    id: 'nail_starry_navy',
    name: '深海星芒克莱因蓝',
    styleTag: '高级艺术',
    rarity: 'EPIC',
    description: '纯粹深邃的克莱因蓝搭配微米级碎钻星芒，与兰兰优雅的蓝灰色毛发相映成趣。',
    dialogue: '“抱兰兰的时候手指陷在它的灰毛里，这一抹克莱因蓝简直绝配！”',
    unlockCondition: 'Lv.4 解锁 + 消耗 60 点灵感',
    inspirationCost: 60,
  },
  // 传奇与特别款 (新增高难度收集)
  {
    id: 'nail_amber_cat_eye',
    name: '兰兰同款·琥珀金瞳磁吸猫眼',
    styleTag: '猫咪灵感',
    rarity: 'LEGENDARY',
    description: '根据蓝猫兰兰真实的澄澈琥珀色大眼睛特别定制，转动角度时金光凝视流动。',
    dialogue: '“天哪！这道光泽简直跟兰兰抬头看我时一模一样，太有灵气了！”',
    unlockCondition: '捕捉兰兰【好奇观察】行为 3 次 + 消耗 70 点灵感',
    inspirationCost: 70,
  },
  {
    id: 'nail_beanie_call',
    name: '店长针织帽·CALL特别联名款',
    styleTag: '日常潮流',
    rarity: 'LEGENDARY',
    description: '取自豆哥最爱的黑色针织毛线帽，大拇指绣有精致白线手写体 Call 字样。',
    dialogue: '“戴着帽子再贴上同款美甲，今天本店长就是书咖最靓的崽！”',
    unlockCondition: '连续 3 天营业满意度 ≥90 分 + 消耗 80 点灵感',
    inspirationCost: 80,
  },
  {
    id: 'nail_goose_champion',
    name: '抓大鹅通关纪念·金鹅羽翼',
    styleTag: '游戏战报',
    rarity: 'LEGENDARY',
    description: '为纪念在《抓大鹅》第2关艰苦鏖战终于通关而打造，甲面镶嵌微缩金色大鹅勋章。',
    dialogue: '“谁说大鹅不可能通关的？看我这双手！大鹅战神本神！”',
    unlockCondition: '抓大鹅累计对局 15 局以上并通关一次 + 消耗 85 点灵感',
    inspirationCost: 85,
  },
  {
    id: 'nail_vintage_manuscript',
    name: '羊皮纸古抄本羽毛笔',
    styleTag: '人文书卷',
    rarity: 'LEGENDARY',
    description: '泛黄牛皮纸肌理上亲手书写古老拉丁文微缩字句，散发深沉优雅的历史沉淀感。',
    dialogue: '“翻看大部头历史书的时候戴这一副，连空气里都飘着老图书馆的安宁。”',
    unlockCondition: '与程序员小林达到 Lv.3 熟客 + 消耗 90 点灵感',
    inspirationCost: 90,
  },
  {
    id: 'nail_sakura_rain',
    name: '春日落樱水墨微拂',
    styleTag: '东方雅韵',
    rarity: 'EPIC',
    description: '白瓷玉质渐层淡粉，指尖点缀几瓣飘落的樱花与水墨点染，轻盈温和。',
    dialogue: '“春天在窗台边摆弄这副指甲，微风吹进来的时候心都化了。”',
    unlockCondition: 'Lv.4 解锁 + 消耗 65 点灵感',
    inspirationCost: 65,
  },
  {
    id: 'nail_caramel_toffee',
    name: '海盐焦糖太妃硬糖',
    styleTag: '暖冬甜蜜',
    rarity: 'RARE',
    description: '暖橙棕色交织乳白奶霜拉花纹路，仿佛刚刚淋在热松饼上的浓稠焦糖糖浆。',
    dialogue: '“冬天煮热奶茶时最适合这副指甲，看着就觉得浑身暖洋洋的。”',
    unlockCondition: 'Lv.3 解锁 + 消耗 35 点灵感',
    inspirationCost: 35,
  },
  {
    id: 'nail_aurora_nebula',
    name: '银河极光紫夜星云',
    styleTag: '星空幻想',
    rarity: 'EPIC',
    description: '深紫蓝底色交融细微偏光星尘，随着手腕翻转折射出浩瀚星河的微弱光芒。',
    dialogue: '“关了店里大灯只留落地灯的时候，指甲上的星芒比外面的夜空还要亮。”',
    unlockCondition: 'Lv.4 解锁 + 消耗 60 点灵感',
    inspirationCost: 60,
  },
  {
    id: 'nail_douge_signature',
    name: '终极传家宝·豆哥猫咖时光印记',
    styleTag: '书咖传世',
    rarity: 'LEGENDARY',
    description: '十指串联起书咖的一整天：清晨第一缕阳光、咖啡滴漏、蓝猫打盹、夜读灯火与暖冬笑语。',
    dialogue: '“每一片指甲都是我和兰兰、还有大家一起走过的故事。这是最好的书咖时光。”',
    unlockCondition: '经营等级达到 Lv.5 满级 + 全熟客 Lv.3 以上 + 消耗 120 灵感',
    inspirationCost: 120,
  },
];
