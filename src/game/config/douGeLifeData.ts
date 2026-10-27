/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》- 豆哥日常生活系统配置数据
 * 包含：
 * 1. 10款虚构穿戴甲收藏 (纯原创手绘风格，绝不连接真实购物平台)
 * 2. 微信小游戏《抓大鹅》趣味战报、卡关轶事与陪伴互动
 * 3. 虚构动漫短剧集锦、观后感与衍生桌面周边
 * 4. 每日随笔手账初始数据
 */

import {
  PressOnNailItem,
  GooseAnecdote,
  AnimeDramaItem,
  AnimeDecorItem,
  DouGeLifeState,
} from '../../types/game';

// 10款虚构穿戴甲收藏
export const PRESS_ON_NAILS: PressOnNailItem[] = [
  {
    id: 'nail_latte_paw',
    name: '雾面奶咖小猫爪',
    styleTag: '猫咪治愈',
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
    description: '经典黑白微型棋盘格线条与哑光法式留白，翻开精装书页时极具现代书卷气息。',
    dialogue: '“黑白双色和我们书咖的手绘线条风格绝配，翻书的时候特别有质感。”',
    unlockCondition: '消耗 15 点书咖灵感解锁',
    inspirationCost: 15,
  },
  {
    id: 'nail_grape_ice',
    name: '夏日冰透青提',
    styleTag: '水光清透',
    description: '水光微透的浅翠绿渐变，指缘有如清晨薄荷上的细碎露珠，视觉降温5度。',
    dialogue: '“夏天冲泡冷萃咖啡或者茉莉花茶时戴这一副，整个人都清凉下来了。”',
    unlockCondition: '消耗 20 点书咖灵感解锁',
    inspirationCost: 20,
  },
  {
    id: 'nail_cat_eye_silver',
    name: '星空碎银猫眼',
    styleTag: '闪耀猫眼',
    description: '深灰磁吸微光，灯光变换下折射出银白光晕，像夜空里兰兰悄悄睁开的眼睛。',
    dialogue: '“在书架背阴处稍微转动手腕，这道银线猫眼就会流动，太梦幻了！”',
    unlockCondition: '消耗 25 点书咖灵感解锁',
    inspirationCost: 25,
  },
  {
    id: 'nail_vintage_camellia',
    name: '复古山茶花浮雕',
    styleTag: '复古立体',
    description: '典雅象牙白微雕花瓣配以复古磨砂底，端庄温润，像老旧书籍里的干花书签。',
    dialogue: '“花瓣边缘做得很精致，洗杯子时一定要小心轻放，不能刮到浮雕。”',
    unlockCondition: '消耗 30 点书咖灵感解锁',
    inspirationCost: 30,
  },
  {
    id: 'nail_french_daisy',
    name: '法式手绘小雏菊',
    styleTag: '优雅小花',
    description: '微透肉粉底色，大拇指与无名指手绘嫩黄芯小雏菊，充满春日阳光的慵懒感。',
    dialogue: '“今天有位常客点单时特意夸这朵小雏菊可爱，心情瞬间明媚！”',
    unlockCondition: '消耗 25 点书咖灵感解锁',
    inspirationCost: 25,
  },
  {
    id: 'nail_aurora_blush',
    name: '水光腮红极光',
    styleTag: '腮红微醺',
    description: '指心淡淡的蜜桃粉晕染向外扩散，覆以极光水光顶油，通透元气。',
    dialogue: '“果冻胶一定要对准烤热压足30秒，这样戴一整天给顾客出餐也不会掉。”',
    unlockCondition: '消耗 20 点书咖灵感解锁',
    inspirationCost: 20,
  },
  {
    id: 'nail_sunset_twilight',
    name: '落日晚霞渐变',
    styleTag: '日暮暖色',
    description: '由暖金暖橙缓缓过渡到温润暮紫，像傍晚打烊前透过落地窗洒进来的金色霞光。',
    dialogue: '“看着指尖的落日颜色，就会想起每天傍晚书咖安静下来的温馨时光。”',
    unlockCondition: '消耗 35 点书咖灵感解锁',
    inspirationCost: 35,
  },
  {
    id: 'nail_amber_smudge',
    name: '焦糖琥珀晕染',
    styleTag: '浓郁秋韵',
    description: '金棕焦糖色与乳白拿铁色交织晕染，像浓缩咖啡倒入燕麦奶时散开的美丽纹路。',
    dialogue: '“这个色系太适合秋冬了，配上我的暖棕色毛衣和手冲壶，店长氛围拉满。”',
    unlockCondition: '消耗 30 点书咖灵感解锁',
    inspirationCost: 30,
  },
  {
    id: 'nail_chilly_wave',
    name: '清冷波浪银丝',
    styleTag: '极简流动',
    description: '纯净冰灰底色上游走着手工勾勒的不规则金属波浪银线，极具艺术设计感。',
    dialogue: '“银线是不规则流动纹理，每一枚都不重样，很有手作银饰的随性帅气。”',
    unlockCondition: '消耗 40 点书咖灵感解锁',
    inspirationCost: 40,
  },
];

// 抓大鹅趣事与战报配置
export const GOOSE_ANECDOTES: GooseAnecdote[] = [
  {
    id: 'goose_stuck_level2',
    title: '第2关的量子力学',
    content: '第1关是幼儿园教学，第2关直接跨入量子力学！豆哥连战8局，格子总是卡在最后两个空格。',
    dougeQuote: '“我就不信了！明明桌上只剩两个大姜丝和一个大葱，怎么凑不出一套？！”',
    gooseType: '呆头大白鹅',
    outcomeType: 'STUCK_ON_LEVEL_2',
  },
  {
    id: 'goose_almost_cleared',
    title: '差一只大白鹅的遗憾',
    content: '倒计时还剩3秒，满屏只剩最后一只戴领结的大白鹅被压在最底层，道具刷新全用完了。',
    dougeQuote: '“啊啊啊！就差最后半秒！那只大白鹅还在冲我耀武扬威地叫了一声‘嘎！’”',
    gooseType: '绅士领结鹅',
    outcomeType: 'ALMOST_WON',
  },
  {
    id: 'goose_cat_assist',
    title: '兰兰神之一爪',
    content: '豆哥正犹豫该点哪个物品，兰兰跳上吧台尾巴扫过屏幕，神奇地触发了连消！',
    dougeQuote: '“兰兰！你才是真正的消消乐大师吧？！今天给你加两个冻干小鱼干！”',
    gooseType: '猫耳抱枕鹅',
    outcomeType: 'CAT_ASSISTED',
  },
  {
    id: 'goose_rage_quit_chill',
    title: '战略性休战',
    content: '连续第15次卡关后，豆哥深吸一口气，端起手冲咖啡：“抓大鹅要讲究缘分，不急。”',
    dougeQuote: '“大鹅先在农场养着，等我把店里的咖啡豆磨完，晚上再来收网！”',
    gooseType: '铁锅大烤鹅',
    outcomeType: 'RAGE_QUIT_PAUSE',
  },
  {
    id: 'goose_epic_victory',
    title: '奇迹！大白鹅被捕获！',
    content: '凭借冷静的计算与精准的记忆翻牌，豆哥终于清空了全部障碍，抓到了金色大鹅机甲！',
    dougeQuote: '“赢了！我终于通关了！快发个朋友圈告诉大家，今天豆哥也是大鹅驯服者了！”',
    gooseType: '机甲战神鹅',
    outcomeType: 'GOOSE_VICTORY',
  },
  {
    id: 'goose_cafe_crossover',
    title: '咖啡师特别鹅出没',
    content: '小游戏里限时刷新出了一只戴着围裙的小鹅，长得跟豆哥本店长颇有几分神似。',
    dougeQuote: '“这只鹅手里的咖啡壶怎么跟我的一模一样？决定了，抓到了就放在展柜里！”',
    gooseType: '咖啡师见习鹅',
    outcomeType: 'ALMOST_WON',
  },
];

// 虚构动漫短剧配置 (6部治愈、幽默原创短剧，杜绝外部侵权)
export const ANIME_SHORT_DRAMAS: AnimeDramaItem[] = [
  {
    id: 'drama_cat_barista',
    title: '《关于我家猫猫比我更会冲咖啡这件事》',
    genreTags: ['萌宠', '日常搞笑', '治愈'],
    rating: 9.8,
    episodes: '全12集 · 每集2分钟泡面番',
    synopsis: '讲述一只看似慵懒普通的蓝猫，私底下其实是退休星际咖啡大师，趁店长睡着后在吧台大显身手的搞笑温馨故事。',
    dougeReview: '“兰兰，你老实交代，半夜是不是也在吧台偷偷练习耶加雪菲的92度水温定点注水？”',
    decorRewardId: 'decor_cat_barista',
  },
  {
    id: 'drama_relax_boss',
    title: '《转生成为书咖店长的我只想摸鱼》',
    genreTags: ['异世界', '慢节奏', '反卷轻喜剧'],
    rating: 9.6,
    episodes: '全16集 · 每集3分钟',
    synopsis: '主角只想在书咖角落看看书、逗逗猫，结果店里莫名其妙成了城里所有人向往的心灵庇护所。',
    dougeReview: '“看这部剧太有共鸣了！开书咖的初衷就是给忙碌的人们留一盏温和的灯。”',
    decorRewardId: 'decor_cafe_keychain',
  },
  {
    id: 'drama_goose_hero',
    title: '《大鹅勇者的异世界大乱斗》',
    genreTags: ['热血搞笑', '恶搞沙雕', '萌系战力'],
    rating: 9.3,
    episodes: '全8集 · 每集1.5分钟',
    synopsis: '一只手持平底锅的脾气暴躁大白鹅，一路嘎嘎乱叫征服各种怪兽，最终登顶美食界巅峰。',
    dougeReview: '“这只大鹅的眼神，跟我手机里《抓大鹅》最后卡死我的那只简直如出一辙！”',
    decorRewardId: 'decor_goose_hero',
  },
  {
    id: 'drama_midnight_noodles',
    title: '《深夜火鸡面与社恐魔法师》',
    genreTags: ['奇幻美食', '暖心治愈'],
    rating: 9.7,
    episodes: '全10集 · 每集2.5分钟',
    synopsis: '在城市深巷的小书咖里，一碗热气腾腾、撒满芝麻海苔碎的特制火鸡面，治愈了孤独的年轻魔法学者。',
    dougeReview: '“看饿了！今晚打烊结算后，我必须在厨房也给自己煮一包招牌火鸡面加蛋。”',
    decorRewardId: 'decor_fire_noodle_magnet',
  },
  {
    id: 'drama_coffee_wish',
    title: '《咖啡心愿便利店》',
    genreTags: ['都市奇迹', '抒情温馨'],
    rating: 9.5,
    episodes: '全10集 · 每集3分钟',
    synopsis: '只要喝下一杯倾注心意的定制手冲咖啡，就能在翻开书籍的那一刻，解开心底尘封已久的结。',
    dougeReview: '“书和咖啡真的有安抚人心的魔力。希望我们书咖也能带给大家这种小小的确幸。”',
  },
  {
    id: 'drama_bookshelf_patrol',
    title: '《猫咪巡逻队：书架大冒险》',
    genreTags: ['童话绘本风', '深夜微缩世界'],
    rating: 9.4,
    episodes: '全12集 · 每集2分钟',
    synopsis: '书店关门熄灯后，书架深处苏醒的折纸小动物与驻店猫咪展开的奇幻守夜巡查。',
    dougeReview: '“怪不得偶尔早上开门时，总觉得某本格林童话被轻轻移开了两厘米呢。”',
  },
];

// 动漫衍生收藏桌面周边
export const ANIME_DECORS: AnimeDecorItem[] = [
  {
    id: 'decor_cat_barista',
    name: '星际咖啡师猫猫立牌',
    category: 'STAND',
    description: '身穿小围裙、头戴厨师帽的蓝猫亚克力摇摇立牌，轻碰一下就会开心地摇摆。',
    fromDramaTitle: '《关于我家猫猫比我更会冲咖啡这件事》',
  },
  {
    id: 'decor_goose_hero',
    name: '大鹅勇者铁锅手办',
    category: 'FIGURE',
    description: '昂首挺胸、举着不粘锅的大白鹅Q版微雕，放在吧台特别有气势（专治卡关）。',
    fromDramaTitle: '《大鹅勇者的异世界大乱斗》',
  },
  {
    id: 'decor_fire_noodle_magnet',
    name: '魔法火鸡面微缩冰箱贴',
    category: 'MAGNET',
    description: '精致立体的迷你拉面碗模型，红油与溏心蛋细节满满，附带磁吸底座。',
    fromDramaTitle: '《深夜火鸡面与社恐魔法师》',
  },
  {
    id: 'decor_cafe_keychain',
    name: '书咖微缩暖灯钥匙扣',
    category: 'KEYCHAIN',
    description: '小小的木质书架与手冲壶造型，按一下开关会亮起暖黄色微光。',
    fromDramaTitle: '《转生成为书咖店长的我只想摸鱼》',
  },
];

// 豆哥的生活日常事件池 (自然低频、完全可选可跳过、无惩罚)
export interface DouGeLifeEventConfig {
  id: string;
  category: 'NAILS' | 'GOOSE' | 'ANIME' | 'CHILL';
  title: string;
  preview: string;
  detail: string;
  actionText: string;
  inspirationReward: number;
  moodBonus: number;
}

export const DOUGE_LIFE_EVENTS_POOL: DouGeLifeEventConfig[] = [
  {
    id: 'event_nails_browse',
    category: 'NAILS',
    title: '豆哥的穿戴甲开箱时刻',
    preview: '豆哥在休息角拆开了一个精致的小快递盒...',
    detail: '“哇！新到的这一套极简棋盘格穿戴甲弧度刚好贴合我的甲床！果冻胶稍微加热一下贴上去超牢固，等会儿给客人冲咖啡抬手一定很好看～”',
    actionText: '欣赏豆哥的新指尖',
    inspirationReward: 10,
    moodBonus: 8,
  },
  {
    id: 'event_goose_level2_struggle',
    category: 'GOOSE',
    title: '微信小游戏《抓大鹅》鏖战',
    preview: '豆哥趴在吧台一角，手指飞快地在屏幕上点击...',
    detail: '“又是第2关！就剩两个大西瓜和一串香蕉了，怎么总是差一步啊啊啊！兰兰，快借你的猫爪给我带来一点好运！”',
    actionText: '给豆哥递杯咖啡打气',
    inspirationReward: 8,
    moodBonus: 5,
  },
  {
    id: 'event_anime_binge',
    category: 'ANIME',
    title: '短剧连播：一口气刷完一季！',
    preview: '豆哥戴上降噪耳机，聚精会神地看着手机短剧...',
    detail: '“《关于我家猫猫比我更会冲咖啡这件事》最后这集太温馨了！星际咖啡师猫猫为了店长烤了一整盘小鱼干曲奇，我也想给兰兰做一份专属猫饭！”',
    actionText: '聊聊观后感',
    inspirationReward: 12,
    moodBonus: 10,
  },
  {
    id: 'event_chill_balcony',
    category: 'CHILL',
    title: '阳光斑驳的偷闲下午',
    preview: '豆哥靠在书架旁边的懒人沙发上，兰兰轻轻蜷在他的膝盖上打呼噜...',
    detail: '“阳光刚好照在地板的木纹上。泡一杯微甜的热红茶，听着兰兰呼噜呼噜的声音，这就是我梦寐以求的书咖生活吧。”',
    actionText: '安静陪伴',
    inspirationReward: 10,
    moodBonus: 12,
  },
];

// 创建豆哥生活初始聚合状态
export function createDefaultDouGeLifeState(): DouGeLifeState {
  return {
    ownedNailIds: ['nail_latte_paw'],
    activeNailId: 'nail_latte_paw',
    inspirationPoints: 25, // 初始赠送少量小确幸灵感点
    gooseAttempts: 12,
    gooseClearedLevels: 1, // 大多数人卡在第2关
    unlockedGooseAnecdotes: ['goose_stuck_level2', 'goose_cat_assist'],
    watchedDramaIds: ['drama_cat_barista'],
    ownedDecorIds: ['decor_cat_barista'],
    dailyDiaries: [
      {
        id: 'init_diary_1',
        day: 1,
        category: 'NAILS',
        title: '戴着小猫爪穿戴甲开业啦',
        content: '今天书咖第一天开店！特意贴上了最喜欢的雾面奶咖小猫爪穿戴甲，大拇指的白色肉垫软糯糯的，端咖啡给客人时收获了好几声“好可爱”的赞叹！',
        timestamp: Date.now() - 86400000,
        moodBonus: 5,
      },
      {
        id: 'init_diary_2',
        day: 1,
        category: 'GOOSE',
        title: '抓大鹅第2关又制裁我了',
        content: '下午没有客人的空隙开了两局《抓大鹅》，第1关5秒过，第2关直接满盘大鹅乱飞。兰兰在旁边伸了个懒腰，好像在嘲笑我的手速。明天一定要破局！',
        timestamp: Date.now() - 43200000,
        moodBonus: 3,
      },
    ],
  };
}
