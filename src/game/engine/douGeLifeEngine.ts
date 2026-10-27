/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》- 豆哥日常生活系统计算与逻辑引擎 (Life Engine)
 * 职责：
 * 1. 穿戴甲解锁与佩戴管理 (纯虚构灵感点，绝不连接外部真实支付)
 * 2. 微信小游戏《抓大鹅》模拟、卡关战报生成与伙伴打气互动
 * 3. 动漫短剧追番与衍生周边收藏逻辑
 * 4. 每日低频可选生活事件与手账日记持久化
 * 5. 保证不影响经营资金，不干扰高峰营业
 */

import {
  DouGeState,
  PressOnNailItem,
  GooseAnecdote,
  AnimeDramaItem,
  AnimeDecorItem,
  DouGeDiaryEntry,
  DouGeActionType,
} from '../../types/game';
import {
  PRESS_ON_NAILS,
  GOOSE_ANECDOTES,
  ANIME_SHORT_DRAMAS,
  ANIME_DECORS,
  DOUGE_LIFE_EVENTS_POOL,
  DouGeLifeEventConfig,
} from '../config/douGeLifeData';
import { EXPANDED_PRESS_ON_NAILS } from '../config/propsData';

/**
 * 佩戴指定的穿戴甲
 */
export function equipNail(douGe: DouGeState, nailId: string): DouGeState {
  if (!douGe.life.ownedNailIds.includes(nailId)) {
    return douGe;
  }
  const isCurrentlyEquipped = douGe.life.activeNailId === nailId;
  return {
    ...douGe,
    mood: Math.min(100, douGe.mood + 2),
    currentAction: 'BROWSING_NAILS',
    life: {
      ...douGe.life,
      activeNailId: isCurrentlyEquipped ? null : nailId, // 再次点击可切换或脱下
    },
  };
}

/**
 * 兑换解锁新款穿戴甲
 */
export function unlockNail(
  douGe: DouGeState,
  nailId: string
): { success: boolean; nextDouGe: DouGeState; error?: string } {
  if (douGe.life.ownedNailIds.includes(nailId)) {
    return { success: false, nextDouGe: douGe, error: '已经拥有该款穿戴甲啦！' };
  }

  const nail = (EXPANDED_PRESS_ON_NAILS as any[]).find((n) => n.id === nailId) || PRESS_ON_NAILS.find((n) => n.id === nailId);
  if (!nail) {
    return { success: false, nextDouGe: douGe, error: '未找到指定穿戴甲款式' };
  }

  if (douGe.life.inspirationPoints < nail.inspirationCost) {
    return {
      success: false,
      nextDouGe: douGe,
      error: `灵感不足！需要 ${nail.inspirationCost} 灵感，当前仅有 ${douGe.life.inspirationPoints} 点。可以通过接待满意顾客获得灵感哦～`,
    };
  }

  const updatedOwned = [...douGe.life.ownedNailIds, nailId];
  const updatedInspiration = douGe.life.inspirationPoints - nail.inspirationCost;

  // 写入日记手账
  const newDiary: DouGeDiaryEntry = {
    id: `diary_nail_${Date.now()}_${nailId}`,
    day: douGe.life.dailyDiaries.length + 1,
    category: 'NAILS',
    title: `新入手了【${nail.name}】！`,
    content: `${nail.description} 豆哥感言：${nail.dialogue}`,
    timestamp: Date.now(),
    moodBonus: 6,
  };

  const nextDouGe: DouGeState = {
    ...douGe,
    mood: Math.min(100, douGe.mood + 6),
    currentAction: 'BROWSING_NAILS',
    life: {
      ...douGe.life,
      ownedNailIds: updatedOwned,
      activeNailId: nailId, // 购买后自动佩戴
      inspirationPoints: updatedInspiration,
      dailyDiaries: [newDiary, ...douGe.life.dailyDiaries],
    },
  };

  return { success: true, nextDouGe };
}

/**
 * 模拟豆哥玩一局微信小游戏《抓大鹅》
 */
export function playGooseGameRound(
  douGe: DouGeState,
  forceVictory: boolean = false
): {
  nextDouGe: DouGeState;
  anecdote: GooseAnecdote;
  isVictory: boolean;
  message: string;
} {
  const attempts = douGe.life.gooseAttempts + 1;
  // 极小概率通关第2关 (15%)，或指定胜利
  const roll = Math.random();
  const isVictory = forceVictory || roll < 0.15;

  let anecdote: GooseAnecdote;
  if (isVictory) {
    anecdote = GOOSE_ANECDOTES.find((a) => a.outcomeType === 'GOOSE_VICTORY') || GOOSE_ANECDOTES[4];
  } else if (roll < 0.45) {
    anecdote = GOOSE_ANECDOTES.find((a) => a.outcomeType === 'CAT_ASSISTED') || GOOSE_ANECDOTES[2];
  } else if (roll < 0.75) {
    anecdote = GOOSE_ANECDOTES.find((a) => a.outcomeType === 'ALMOST_WON') || GOOSE_ANECDOTES[1];
  } else {
    anecdote = GOOSE_ANECDOTES.find((a) => a.outcomeType === 'STUCK_ON_LEVEL_2') || GOOSE_ANECDOTES[0];
  }

  const updatedAnecdotes = douGe.life.unlockedGooseAnecdotes.includes(anecdote.id)
    ? douGe.life.unlockedGooseAnecdotes
    : [...douGe.life.unlockedGooseAnecdotes, anecdote.id];

  const moodDelta = isVictory ? 12 : anecdote.outcomeType === 'CAT_ASSISTED' ? 8 : -2;
  const newMood = Math.max(40, Math.min(100, douGe.mood + moodDelta));

  const newDiary: DouGeDiaryEntry = {
    id: `diary_goose_${Date.now()}`,
    day: douGe.life.dailyDiaries.length + 1,
    category: 'GOOSE',
    title: `抓大鹅战报：${anecdote.title}`,
    content: `${anecdote.content} 豆哥语录：${anecdote.dougeQuote}`,
    timestamp: Date.now(),
    moodBonus: isVictory ? 10 : 3,
  };

  const nextDouGe: DouGeState = {
    ...douGe,
    mood: newMood,
    currentAction: 'PLAYING_GOOSE',
    life: {
      ...douGe.life,
      gooseAttempts: attempts,
      gooseClearedLevels: isVictory ? douGe.life.gooseClearedLevels + 1 : douGe.life.gooseClearedLevels,
      unlockedGooseAnecdotes: updatedAnecdotes,
      inspirationPoints: douGe.life.inspirationPoints + (isVictory ? 15 : 4),
      dailyDiaries: [newDiary, ...douGe.life.dailyDiaries.slice(0, 49)], // 最多保留50条
    },
  };

  return {
    nextDouGe,
    anecdote,
    isVictory,
    message: isVictory
      ? `🎉 奇迹！豆哥通关了《抓大鹅》第2关！心情大好 (+${moodDelta})！`
      : `🪿 ${anecdote.title}！豆哥喊话：${anecdote.dougeQuote}`,
  };
}

/**
 * 陪伴互动：给豆哥递杯热饮打气
 */
export function cheerDouGeUp(douGe: DouGeState): {
  nextDouGe: DouGeState;
  reply: string;
  moodBonus: number;
} {
  const replies = [
    '“呼～喝了一口热咖啡，瞬间回血！刚才抓大鹅差一步的郁闷一扫而空！”',
    '“谢谢你！有这杯咖啡，今晚我一定能把第2关那只大白鹅给逮住！”',
    '“指尖戴着漂亮的猫爪穿戴甲，手里端着咖啡，感觉自己是全世界最幸福的店长～”',
    '“好香的茶！刚才兰兰也在闻这个香气呢。让我们继续元气满满地开店吧！”',
  ];
  const chosenReply = replies[Math.floor(Math.random() * replies.length)];
  const moodBonus = 10;
  const energyBonus = 8;

  const nextDouGe: DouGeState = {
    ...douGe,
    mood: Math.min(100, douGe.mood + moodBonus),
    energy: Math.min(douGe.maxEnergy, douGe.energy + energyBonus),
    currentAction: 'RESTING',
    life: {
      ...douGe.life,
      inspirationPoints: douGe.life.inspirationPoints + 5,
    },
  };

  return { nextDouGe, reply: chosenReply, moodBonus };
}

/**
 * 观看动漫短剧
 */
export function watchDramaEpisode(
  douGe: DouGeState,
  dramaId: string
): {
  nextDouGe: DouGeState;
  drama: AnimeDramaItem;
  newDecorUnlocked?: AnimeDecorItem;
  message: string;
} {
  const drama = ANIME_SHORT_DRAMAS.find((d) => d.id === dramaId) || ANIME_SHORT_DRAMAS[0];
  const isFirstWatch = !douGe.life.watchedDramaIds.includes(drama.id);
  const updatedWatched = isFirstWatch ? [...douGe.life.watchedDramaIds, drama.id] : douGe.life.watchedDramaIds;

  let newDecor: AnimeDecorItem | undefined;
  let updatedDecors = [...douGe.life.ownedDecorIds];

  if (isFirstWatch && drama.decorRewardId && !douGe.life.ownedDecorIds.includes(drama.decorRewardId)) {
    const decor = ANIME_DECORS.find((item) => item.id === drama.decorRewardId);
    if (decor) {
      newDecor = decor;
      updatedDecors.push(decor.id);
    }
  }

  const newDiary: DouGeDiaryEntry = {
    id: `diary_anime_${Date.now()}_${drama.id}`,
    day: douGe.life.dailyDiaries.length + 1,
    category: 'ANIME',
    title: `追番记录：${drama.title}`,
    content: `${drama.synopsis} 豆哥影评：${drama.dougeReview}`,
    timestamp: Date.now(),
    moodBonus: 8,
  };

  const nextDouGe: DouGeState = {
    ...douGe,
    mood: Math.min(100, douGe.mood + 8),
    currentAction: 'WATCHING_ANIME',
    life: {
      ...douGe.life,
      watchedDramaIds: updatedWatched,
      ownedDecorIds: updatedDecors,
      inspirationPoints: douGe.life.inspirationPoints + (isFirstWatch ? 12 : 5),
      dailyDiaries: [newDiary, ...douGe.life.dailyDiaries.slice(0, 49)],
    },
  };

  return {
    nextDouGe,
    drama,
    newDecorUnlocked: newDecor,
    message: newDecor
      ? `📺 陪豆哥看完了 ${drama.title}！收获影迷周边【${newDecor.name}】！`
      : `📺 豆哥看完了 ${drama.title}，心情十分治愈 (+8)！`,
  };
}

/**
 * 检查并触发当日日常偶发事件 (低频、自然、完全可选)
 */
export function checkAndTriggerDailyLifeEvent(
  douGe: DouGeState,
  currentDay: number
): {
  hasEvent: boolean;
  event: DouGeLifeEventConfig | null;
} {
  // 每个经营日只触发一次低频日常事件
  if (douGe.life.lastEventTriggeredDay === currentDay) {
    return { hasEvent: false, event: null };
  }

  // 根据当前日数的伪随机选取
  const index = (currentDay - 1) % DOUGE_LIFE_EVENTS_POOL.length;
  const event = DOUGE_LIFE_EVENTS_POOL[index];
  return { hasEvent: true, event };
}

/**
 * 确认接受/完成日常生活事件
 */
export function acceptDailyLifeEvent(
  douGe: DouGeState,
  event: DouGeLifeEventConfig,
  currentDay: number
): DouGeState {
  const newDiary: DouGeDiaryEntry = {
    id: `event_diary_${currentDay}_${event.id}`,
    day: currentDay,
    category: event.category,
    title: event.title,
    content: event.detail,
    timestamp: Date.now(),
    moodBonus: event.moodBonus,
  };

  return {
    ...douGe,
    mood: Math.min(100, douGe.mood + event.moodBonus),
    currentAction:
      event.category === 'NAILS'
        ? 'BROWSING_NAILS'
        : event.category === 'GOOSE'
        ? 'PLAYING_GOOSE'
        : event.category === 'ANIME'
        ? 'WATCHING_ANIME'
        : 'RESTING',
    life: {
      ...douGe.life,
      inspirationPoints: douGe.life.inspirationPoints + event.inspirationReward,
      lastEventTriggeredDay: currentDay,
      dailyDiaries: [newDiary, ...douGe.life.dailyDiaries.slice(0, 49)],
    },
  };
}

/**
 * 跳过生活事件 (不扣资金、不扣体力、无任何惩罚)
 */
export function skipDailyLifeEvent(douGe: DouGeState, currentDay: number): DouGeState {
  return {
    ...douGe,
    life: {
      ...douGe.life,
      lastEventTriggeredDay: currentDay, // 标记今日已处理，不再骚扰玩家
    },
  };
}

/**
 * 顾客好评时增加豆哥的灵感值 (出餐正常经营反馈)
 */
export function grantInspirationFromService(douGe: DouGeState, points: number = 2): DouGeState {
  return {
    ...douGe,
    life: {
      ...douGe.life,
      inspirationPoints: douGe.life.inspirationPoints + points,
    },
  };
}

/**
 * 获取豆哥当前动作的趣味台词
 */
export function getDouGeActionDialogue(
  action: DouGeActionType,
  activeNailId: string | null
): string {
  const activeNail = activeNailId ? PRESS_ON_NAILS.find((n) => n.id === activeNailId) : null;

  switch (action) {
    case 'BROWSING_NAILS':
      return activeNail
        ? `“佩戴着【${activeNail.name}】，${activeNail.dialogue}”`
        : '“正在物色新款穿戴甲，果冻胶一定要对准烤热压实30秒哦～”';
    case 'PLAYING_GOOSE':
      return '“《抓大鹅》第2关到底谁通关过啊？！今天我就不信降伏不了这只大白鹅！”';
    case 'WATCHING_ANIME':
      return '“这届动漫短剧太下饭了！泡面番里的小猫咪简直就是兰兰的翻版～”';
    case 'COOKING':
    case 'PREPARING':
      return '“火候和出餐时间一定要卡好，不能让客人久等啦！”';
    case 'RESTING':
      return '“忙里偷闲喝杯咖啡，摸摸兰兰，充会儿电～”';
    default:
      return activeNail
        ? `“今天的指尖佩戴着【${activeNail.name}】，心情特别明媚，欢迎光临书咖！”`
        : '“今天也是元气满满的一天，书咖的咖啡豆准备就绪啦！”';
  }
}
