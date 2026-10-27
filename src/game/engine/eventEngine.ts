/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》随机经营事件引擎 (EventEngine)
 * 核心目标：
 * 1. 模拟真实经营中的突发支出 (极端天气维护、供应链波动、猫咪看病生病、设备定期大修等)
 * 2. 适度频率触发 (每3~5天适度触发，防止过于频繁产生挫败感)
 * 3. 稳健消耗已赚取金钱，倒逼玩家维持稳健的流动资金管理，提升经营策略深度
 * 4. 严谨记录现金流与财务损益
 */

import {
  GameSaveData,
  RandomEventDefinition,
  TriggeredRandomEvent,
  RandomEventChoice,
} from '../../types/game';

export const RANDOM_EVENT_CATALOG: RandomEventDefinition[] = [
  {
    id: 'LANLAN_COLD_VET',
    title: '兰兰夜间受凉软便 · 紧急宠物看诊',
    category: 'LANLAN_HEALTH',
    narrative: '昨夜气温骤降，早晨豆哥发现兰兰蜷在猫窝里打了两个喷嚏，还出现轻微软便没精打采。为了兰兰的健康，必须立即送往宠物医院进行检查和调理。',
    icon: '🩺',
    severity: 'URGENT',
    minDay: 3,
    choices: [
      {
        id: 'full_vet_care',
        label: '专科全套检查 + 进口肠胃益生菌化毛膏',
        cost: 145.0,
        reputationChange: 6,
        description: '进行便检与血常规，开具特效益生菌与医用营养膏，兰兰恢复极快且更黏人。',
        outcomeText: '医生仔细为兰兰做了检查，服下调理膏后兰兰恢复了精神，在吧台呼噜呼噜蹭着豆哥手背，顾客们纷纷称赞书咖对猫咪的呵护！',
      },
      {
        id: 'basic_vet_care',
        label: '常规门诊检查 + 基础消炎调理药',
        cost: 75.0,
        reputationChange: 2,
        description: '做基础听诊与常规肠胃药水，花费较少，需豆哥悉心看护两日。',
        outcomeText: '拿了基础肠胃调理药喂给兰兰，兰兰吃了药多睡了半天，逐渐好转恢复精神。',
      },
    ],
  },
  {
    id: 'WEATHER_AWNING_LEAK',
    title: '狂风骤雨过境 · 遮阳棚破损与窗沿加固',
    category: 'WEATHER_DISASTER',
    narrative: '昨夜暴雨连绵兼刮阵风，店门口的遮阳雨棚被吹裂了一处缝隙，部分窗角有轻微渗水痕迹。为了给顾客和图书提供干燥安全的环境，必须趁早晨开门前抢修。',
    icon: '🌧️',
    severity: 'NORMAL',
    minDay: 4,
    choices: [
      {
        id: 'premium_seal_awning',
        label: '请专业师傅加固骨架 + 换装高密防水雨棚布',
        cost: 160.0,
        reputationChange: 8,
        description: '彻底解决雨棚抗风隐患，外立面焕然一新，抗风等级大幅提升。',
        outcomeText: '维修师傅迅速更换了全新防水雨棚并密封了窗沿，雨滴敲在雨棚上发出好听的节奏声，进店避雨的书友赞不绝口。',
      },
      {
        id: 'basic_seal_tape',
        label: '自购防水修补密封胶与防风拉绳应急修补',
        cost: 70.0,
        reputationChange: 0,
        description: '豆哥亲自动手爬梯子用高粘防水胶带和防风拉绳修补，经济实惠。',
        outcomeText: '豆哥花了一个小时手动粘补完裂缝，成功止住了渗水，虽外观略显朴素但足够应付近期的阴雨。',
      },
    ],
  },
  {
    id: 'SUPPLY_FREIGHT_SURCHARGE',
    title: '上游产地物流滞留 · 原料加急空运专线',
    category: 'SUPPLY_CHAIN',
    narrative: '上游主产区连日阴雨导致货运干线公路部分受阻，下一批精选咖啡豆和优质茉莉茶叶若走普通陆运将面临断货风险。供货商来电询问是否升级为冷链空运保供。',
    icon: '🚚',
    severity: 'NORMAL',
    minDay: 3,
    choices: [
      {
        id: 'air_freight_speed',
        label: '支付专线加急空运费 · 确保原料零断档且新鲜度拉满',
        cost: 110.0,
        reputationChange: 5,
        description: '加急空运今日直达店面，原料新鲜度达到顶级，出餐风味纯正。',
        outcomeText: '下午加急航空件准时送达书咖，新拆封的埃塞俄比亚咖啡豆散发着浓郁果木焦糖香，吧台香气扑鼻！',
      },
      {
        id: 'emergency_local_swap',
        label: '从邻近精品烘焙工作室按零售溢价临时调拨一小批',
        cost: 65.0,
        reputationChange: 1,
        description: '仅就近调拨 2 天用量应急，成本相对受控。',
        outcomeText: '豆哥骑车从隔街朋友的烘焙工作室借调了两小包新鲜咖啡豆，解了燃眉之急。',
      },
    ],
  },
  {
    id: 'AC_COMPRESSOR_REPAIR',
    title: '商用空调压缩机异响 · 滤网与冷媒维护',
    category: 'STORE_FACILITY',
    narrative: '店内中央空调与后厨排烟换气设备传出沉闷的嗡嗡异响，制冷和换气效率明显下降。正值营业旺季，若空气不流通不仅影响客人阅读，兰兰也会觉得闷热。',
    icon: '❄️',
    severity: 'NORMAL',
    minDay: 5,
    choices: [
      {
        id: 'official_hvac_overhaul',
        label: '联系原厂售后深度清洗除菌 + 充注环保冷媒',
        cost: 135.0,
        reputationChange: 5,
        description: '全面清洗室内机翅片，消除异味异响，室内空气清新如森林。',
        outcomeText: '清洗保养后的空调运转平稳安静，微风轻柔，整个书咖空气清新宜人，兰兰惬意地躺在风口下伸懒腰。',
      },
      {
        id: 'simple_filter_wash',
        label: '请街角家电师傅做管路排气与基础风机润滑',
        cost: 60.0,
        reputationChange: 0,
        description: '基础调试排气，消除了大噪音，花费经济。',
        outcomeText: '师傅上门加了润滑油脂并清理了积灰，机器噪音恢复正常。',
      },
    ],
  },
  {
    id: 'FIRE_SAFETY_RENEWAL',
    title: '街区市容消防例行年检 · 应急设备更新',
    category: 'MUNICIPAL_INSPECTION',
    narrative: '街道安监部门组织商业网点消防与卫生常态化巡检，通知指出书咖后厨的两具干粉灭火器已到换药年限，且建议增配紫外线消毒灯以保障餐饮安全。',
    icon: '🧯',
    severity: 'NORMAL',
    minDay: 6,
    choices: [
      {
        id: 'full_safety_upgrade',
        label: '换配新型水系环保灭火器 + 医用级紫外线空气消毒灯',
        cost: 125.0,
        reputationChange: 7,
        description: '不仅顺利通过合规检查，更树立了安全模范书店形象。',
        outcomeText: '安监工作人员复检时高度赞赏书咖的规范意识，并在店门口贴上了【安全文明经营示范店】绿色标识！',
      },
      {
        id: 'basic_safety_refill',
        label: '仅对旧灭火器进行原厂加压换药与基础台账备案',
        cost: 55.0,
        reputationChange: 1,
        description: '满足最基础的合规底线，支出最小化。',
        outcomeText: '完成了灭火器常规换药检验，获得了年检合格单。',
      },
    ],
  },
  {
    id: 'WATER_PIPE_CO_REPAIR',
    title: '老街总水阀接口微渗 · 邻里共担管道抢修',
    category: 'STORE_FACILITY',
    narrative: '书咖所在的历史文化街区总供水支管接头处出现轻微返水，自来水公司工人排查后确认需对公共埋地管道进行开挖密封加固，费用由联排三家商户均摊。',
    icon: '🔧',
    severity: 'NORMAL',
    minDay: 5,
    choices: [
      {
        id: 'high_spec_pipe_replace',
        label: '均摊更换不锈钢加厚耐腐蚀波纹管 · 彻底杜绝后患',
        cost: 95.0,
        reputationChange: 4,
        description: '高质量材料保修十年，街坊邻里关系十分融洽。',
        outcomeText: '管道抢修在两小时内迅速完工，水压充足且清澈，隔壁老掌柜还给豆哥送来一篮新鲜橘子致谢！',
      },
      {
        id: 'quick_patch_band',
        label: '均摊加装防漏高压铸铁抱箍应急修复',
        cost: 45.0,
        reputationChange: 0,
        description: '花费最低的应急抢修方案。',
        outcomeText: '抱箍固定完毕后水管不再渗水，水流恢复如常。',
      },
    ],
  },
  {
    id: 'LANLAN_SCRATCH_DAMAGE',
    title: '兰兰深夜跑酷磨爪 · 吧台立面与麻绳翻新',
    category: 'LANLAN_MISCHIEF',
    narrative: '今早进门，豆哥发现前台吧台转角的木护板上多了几道整整齐齐的猫抓痕——原来是兰兰半夜追逐小飞虫时在此大肆磨爪。被抓毛糙的木头若不处理可能会扎到顾客。',
    icon: '🐾',
    severity: 'NORMAL',
    minDay: 4,
    choices: [
      {
        id: 'premium_sisal_armor',
        label: '订购厚实天然无硫剑麻绳与复古防抓皮革角包',
        cost: 75.0,
        reputationChange: 5,
        description: '将木角改造成高级质感的猫咪专属磨爪柱，实用且风格雅致。',
        outcomeText: '改装后的剑麻转角深得兰兰欢心，兰兰立刻抱住吧台柱子开心地伸爪蹭蹭，反而成为了店内一道独特的猫咖风景线！',
      },
      {
        id: 'wood_wax_polish',
        label: '自购木蜡油砂纸打磨修复平整',
        cost: 35.0,
        reputationChange: 1,
        description: '简单打磨上蜡恢复光滑，花费低廉。',
        outcomeText: '豆哥用细砂纸打磨光滑并涂上天然木蜡油，吧台角恢复了平整光滑。',
      },
    ],
  },
];

/**
 * 检查今日晨间是否触发随机事件
 * 规则：
 * 1. 开店前 2 天不触发，让新手熟悉经营节奏
 * 2. 距离上次事件至少间隔 3 天 (cooldown)
 * 3. 玩家现金至少留有 ¥90 (避免直接破产无法自救)
 * 4. 适度概率 (~28%)
 */
export function evaluateDailyRandomEvent(gameState: GameSaveData): TriggeredRandomEvent | null {
  const currentDay = gameState.currentDay;
  if (currentDay < 3) return null;

  const lastEventDay = gameState.lastEventDay ?? 0;
  if (currentDay - lastEventDay < 3) return null;

  // 必须保有一定资金才触发扣费事件
  if (gameState.cash < 90) return null;

  // 适度触发概率 (28%)
  const seed = (currentDay * 7919 + 65537) % 10000;
  const rand = seed / 10000;
  if (rand > 0.28) return null;

  // 筛选满足条件的事件
  const eligible = RANDOM_EVENT_CATALOG.filter((e) => e.minDay <= currentDay);
  if (eligible.length === 0) return null;

  const pickedIndex = Math.floor(rand * eligible.length * 10) % eligible.length;
  const def = eligible[pickedIndex];

  return {
    id: `evt_${currentDay}_${def.id}_${Date.now()}`,
    definition: def,
    day: currentDay,
    isResolved: false,
    timestamp: Date.now(),
  };
}

/**
 * 结算并解决该随机事件，扣减现金、更新声誉、记录财务交易
 */
export function resolveRandomEventChoice(
  gameState: GameSaveData,
  event: TriggeredRandomEvent,
  choiceId: string
): { nextState: GameSaveData; choice: RandomEventChoice } {
  const choice = event.definition.choices.find((c) => c.id === choiceId) || event.definition.choices[0];
  const cost = Math.min(gameState.cash, choice.cost); // 最多扣到0元
  const newCash = Math.round((gameState.cash - cost) * 100) / 100;
  const newReputation = Math.min(1000, Math.max(0, gameState.reputation + (choice.reputationChange || 0)));

  const resolvedEvent: TriggeredRandomEvent = {
    ...event,
    isResolved: true,
    selectedChoiceId: choice.id,
    costPaid: cost,
    outcomeNote: choice.outcomeText,
  };

  const newTx = {
    id: `tx_evt_${Date.now()}`,
    day: gameState.currentDay,
    type: 'EXPENSE' as const,
    category: 'RANDOM_EVENT' as const,
    amount: cost,
    note: `【随机事件】${event.definition.title}: ${choice.label}`,
    timestamp: Date.now(),
  };

  const nextState: GameSaveData = {
    ...gameState,
    cash: newCash,
    reputation: newReputation,
    lastEventDay: gameState.currentDay,
    pendingRandomEvent: null,
    resolvedEvents: [...(gameState.resolvedEvents || []), resolvedEvent],
    transactionHistory: [newTx, ...(gameState.transactionHistory || []).slice(0, 19)],
  };

  return { nextState, choice };
}
