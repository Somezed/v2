/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 蓝猫兰兰 (Lanlan) 自主行为配置与性格台词库
 * 核心性格：
 * 1. 喜欢睡懒觉 (深度睡眠与舒服打呼噜)
 * 2. 没人理会时，有时主动靠近豆哥蹭蹭裤腿或脚边坐下
 * 3. 不喜欢被抱 (泥鳅般滑脱跳开，拒绝强迫抱抱)
 * 4. 偶尔突然跑一小段 (跑酷冲刺)，然后停下来观察四周
 * 5. 喜欢玩毛球 (爪子拍击、追球跑动，玩后自得离开)
 * 6. 纯粹陪伴自主生活，不设强制日常喂食/清洁/打卡惩罚
 */

import { LanLanAutonomousState, LanLanBehavior, YarnBallEntity } from '../../types/game';

// 初始默认自主行为状态工厂
export function createDefaultLanLanBehaviorState(): LanLanAutonomousState {
  return {
    currentBehavior: 'SLEEPING',
    behaviorDurationSeconds: 22,
    behaviorElapsedSeconds: 0,
    position: { x: 3, y: 3 }, // 初始位于书咖温暖中央偏侧
    facing: 'RIGHT',
    targetPosition: null,
    lastInteractionTimestamp: Date.now(),
    consecutiveHugAttempts: 0,
    dialogueBubble: '呼噜噜……雷打不动的大懒觉时间 zZ',
    bubbleExpiresTimestamp: Date.now() + 6000,
    yarnBall: {
      id: 'yarn_default_1',
      x: 4,
      y: 4,
      lastBattedTimestamp: 0,
      playCount: 0,
      isMoving: false,
    },
    isNearDouGe: false,
    dailySleepingMinutes: 45,
  };
}

// 行为状态持续时长配置 (秒，保持自然节奏，禁止快速高频闪烁)
export const BEHAVIOR_DURATIONS: Record<LanLanBehavior, { min: number; max: number }> = {
  SLEEPING: { min: 18, max: 32 },      // 睡懒觉持续 18-32 秒
  STRETCHING: { min: 3, max: 5 },      // 伸懒腰 3-5 秒
  RESTING: { min: 10, max: 20 },       // 揣手手发呆 10-20 秒
  WALKING: { min: 6, max: 12 },        // 踱步巡视 6-12 秒
  ZOOMING: { min: 2.5, max: 4.5 },     // 突然跑酷短跑 2.5-4.5 秒
  OBSERVING: { min: 5, max: 9 },       // 停下观察好奇看 5-9 秒
  APPROACHING: { min: 10, max: 18 },   // 主动靠近蹭豆哥 10-18 秒
  PLAYING_YARN: { min: 7, max: 14 },   // 玩毛球 7-14 秒
  REFUSING_HUG: { min: 3, max: 4.5 },  // 拒绝被抱傲娇滑脱 3-4.5 秒
};

// 兰兰九种行为的生动性格手绘气泡台词库
export const LANLAN_BEHAVIOR_BUBBLES: Record<LanLanBehavior, string[]> = {
  SLEEPING: [
    '呼噜噜……雷打不动的大懒觉时间 zZ',
    '日光晒得蓝灰色毛毛暖融融的，翻个身继续睡~',
    'Zzz…做梦好像抓到了一只超大飞蛾',
    '揣着前爪睡得香甜，发出拖拉机般的呼噜声',
    '雷打不动，天塌下来也是睡觉最大 zZ',
  ],
  STRETCHING: [
    '伸个长——长——的懒腰！舒展猫筋骨~',
    '前爪下压，翘起小屁股拉伸后背，舒服！',
    '嗷呜~ 打了个大大的猫咪哈欠',
    '抖了抖毛茸茸的圆耳朵，准备清醒一下',
  ],
  RESTING: [
    '大圆脸揣手手，安详暗中观察客人们',
    '舒服地半眯着铜琥珀色大眼，尾巴尖轻慢微摇',
    '静静坐在垫子上：今天也是合格的招财蓝猫',
    '听着书咖里翻书的声音，好惬意呀',
  ],
  WALKING: [
    '踩着轻柔肉垫，优雅踱步巡视书咖领地',
    '漫步看看今天哪位读者书翻得最认真~',
    '巡视到书架旁，用腮帮子蹭了蹭温润桌角',
    '迈着轻快猫步，在桌椅空隙间悠闲穿行',
  ],
  ZOOMING: [
    '嗖——！突然起飞！毫无预兆跑酷！',
    '小猫雷达接收信号！短距离狂奔冲刺！',
    '一阵蓝灰色小旋风掠过书咖地面！',
    '小尾巴竖得笔直，飞快冲向前方！',
  ],
  OBSERVING: [
    '刹车！停下……刚才那边好像有动静？👀',
    '回头张望四周：假装刚才什么都没发生，我很优雅',
    '圆圆腮帮子歪了歪，好奇打量桌上的咖啡杯',
    '蹲坐下来，铜琥珀大眼滴溜溜转动',
  ],
  APPROACHING: [
    '豆哥在忙？迈着小步凑过去蹭蹭裤腿~',
    '好久没人理我啦，主动到豆哥脚边贴贴坐下',
    '用毛茸茸的圆脑袋拱拱豆哥的手腕，呼噜噜~',
    '主动靠过来蹭蹭：我就在旁边陪你一会儿，不用管我',
    '轻轻蹭了蹭吧台边缘，仰头看了豆哥一眼',
  ],
  PLAYING_YARN: [
    '发现毛球！小爪子啪啪快速拍打！',
    '毛球滚远了，小猫立刻轻巧追扑上去！',
    '左右开弓拍打毛球，毛线在爪下骨碌碌滚！',
    '玩得正起劲！毛球被拍得跳了起来~',
  ],
  REFUSING_HUG: [
    '蓝猫是流动的！像泥鳅一样从怀里滑走啦~',
    '喵呜！粉嫩肉垫抵住抗议：摸摸可以，抱抱不行！',
    '身手敏捷地跳回地面，甩甩尾巴：才不要被抱！',
    '傲娇后退一步：保持独立大猫的威严，休想束缚我！',
    '轻轻扭动一下滑落脚边：抗拒强行抱抱~',
  ],
};

// 连续尝试强迫抱抱时的特殊猫咪性格台词
export const REPEATED_HUG_REFUSAL_BUBBLES = [
    '才不要连续被抱！一溜烟躲开两步远~',
    '小猫抗议：严正声明，不可以强迫小猫咪！',
    '喵呜！身手矫健地跑开观察你：摸摸可以，抱抱不行！',
    '敏捷闪避：本蓝猫可不是那么容易抓到的！',
];

// 摸摸下巴时的治愈回应
export const PETTING_BUBBLES = [
  '舒服地闭上眼睛，发出沉醉满足的呼噜噜~ ❤️',
  '下巴被挠得好舒服，呼噜声像小马达一样响亮~',
  '微微仰起大圆脸享受抚摸，尾巴轻轻晃了晃',
  '咪呜~ 蹭了蹭你的手心，很安心的感觉',
];
