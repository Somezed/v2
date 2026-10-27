/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》- 豆哥日常生活系统视图 (DouGeLifeView)
 * 核心模块：
 * 1. 穿戴甲展示盒 (10款虚构手绘穿戴甲、佩戴切换、灵感兑换)
 * 2. 微信小游戏《抓大鹅》战报室 (战报记录、卡关趣事、围观豆哥玩、递咖啡打气互动)
 * 3. 追番小影厅 (6部虚构治愈/恶搞动漫短剧、观后感、衍生周边收藏架)
 * 4. 豆哥手账日记本 (回看历史事件随笔、过滤分类)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Gamepad2,
  Tv,
  BookOpen,
  Coffee,
  Check,
  Lock,
  Heart,
  Smile,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Gift,
  HelpCircle,
  Eye,
} from 'lucide-react';
import {
  GameSaveData,
  PressOnNailItem,
  AnimeDramaItem,
  DouGeDiaryEntry,
} from '../types/game';
import {
  PRESS_ON_NAILS,
  ANIME_SHORT_DRAMAS,
  ANIME_DECORS,
} from '../game/config/douGeLifeData';
import { EXPANDED_PRESS_ON_NAILS } from '../game/config/propsData';
import {
  equipNail,
  unlockNail,
  playGooseGameRound,
  cheerDouGeUp,
  watchDramaEpisode,
  getDouGeActionDialogue,
} from '../game/engine/douGeLifeEngine';
import { DoodleDouGe } from './DoodleDouGe';
import { playClickSound, playCoinSound, playPageFlipSound } from '../game/audio/soundEffects';

interface DouGeLifeViewProps {
  gameState: GameSaveData;
  onUpdateState: (newState: GameSaveData) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const DouGeLifeView: React.FC<DouGeLifeViewProps> = ({
  gameState,
  onUpdateState,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'NAILS' | 'GOOSE' | 'ANIME' | 'DIARY'>('NAILS');
  
  // 选中的穿戴甲款式卡片详情模态窗/预览
  const [selectedNail, setSelectedNail] = useState<PressOnNailItem | null>(() => {
    return PRESS_ON_NAILS.find((n) => n.id === gameState.douGe.life.activeNailId) || PRESS_ON_NAILS[0];
  });

  // 豆哥台词与即时反馈展示
  const [dialogueText, setDialogueText] = useState<string>(() => {
    return getDouGeActionDialogue(gameState.douGe.currentAction, gameState.douGe.life.activeNailId);
  });

  // 日记过滤分类
  const [diaryFilter, setDiaryFilter] = useState<'ALL' | 'NAILS' | 'GOOSE' | 'ANIME' | 'CHILL'>('ALL');

  const douGe = gameState.douGe;
  const life = douGe.life;

  // 1. 穿戴甲切换佩戴
  const handleToggleEquip = (nailId: string) => {
    playClickSound();
    const nextDouGe = equipNail(douGe, nailId);
    onUpdateState({
      ...gameState,
      douGe: nextDouGe,
    });
    const nail = PRESS_ON_NAILS.find((n) => n.id === nailId);
    if (nextDouGe.life.activeNailId === nailId) {
      setDialogueText(`“换上了【${nail?.name}】，${nail?.dialogue}”`);
      showToast(`已佩戴穿戴甲【${nail?.name}】`, 'success');
    } else {
      setDialogueText('“脱下穿戴甲休息一下，给指甲也透透气～”');
      showToast('已卸下当前穿戴甲', 'info');
    }
  };

  // 2. 兑换解锁穿戴甲
  const handleUnlockNail = (nail: PressOnNailItem) => {
    playCoinSound();
    const result = unlockNail(douGe, nail.id);
    if (result.success) {
      onUpdateState({
        ...gameState,
        douGe: result.nextDouGe,
      });
      setSelectedNail(nail);
      setDialogueText(`“太棒了！新拆箱的【${nail.name}】，${nail.dialogue}”`);
      showToast(`成功解锁并佩戴【${nail.name}】！`, 'success');
    } else {
      showToast(result.error || '解锁失败', 'error');
    }
  };

  // 3. 玩一局《抓大鹅》
  const handlePlayGoose = () => {
    playClickSound();
    const { nextDouGe, isVictory, message, anecdote } = playGooseGameRound(douGe);
    onUpdateState({
      ...gameState,
      douGe: nextDouGe,
    });
    setDialogueText(`“${anecdote.dougeQuote}”`);
    showToast(message, isVictory ? 'success' : 'info');
  };

  // 4. 给豆哥递咖啡打气
  const handleCheerUp = () => {
    playCoinSound();
    const { nextDouGe, reply, moodBonus } = cheerDouGeUp(douGe);
    onUpdateState({
      ...gameState,
      douGe: nextDouGe,
    });
    setDialogueText(reply);
    showToast(`给豆哥递上特调热饮！体力恢复，心情 +${moodBonus}`, 'success');
  };

  // 5. 陪豆哥看一集短剧
  const handleWatchDrama = (drama: AnimeDramaItem) => {
    playPageFlipSound();
    const { nextDouGe, newDecorUnlocked, message } = watchDramaEpisode(douGe, drama.id);
    onUpdateState({
      ...gameState,
      douGe: nextDouGe,
    });
    setDialogueText(`“看完了 ${drama.title}！${drama.dougeReview}”`);
    showToast(message, newDecorUnlocked ? 'success' : 'info');
  };

  // 过滤后的日记手账
  const filteredDiaries = life.dailyDiaries.filter((diary) => {
    if (diaryFilter === 'ALL') return true;
    return diary.category === diaryFilter;
  });

  return (
    <div className="space-y-4">
      {/* 豆哥生活温馨横幅与看板 */}
      <div className="doodle-box p-4 bg-white border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 左侧：豆哥手绘形象与状态微动 */}
        <div className="flex items-center gap-4">
          <DoodleDouGe
            action={douGe.currentAction}
            energy={douGe.energy}
            mood={douGe.mood}
            activeNailId={life.activeNailId}
            speechText={dialogueText}
            onClick={() => {
              playClickSound();
              setDialogueText(getDouGeActionDialogue(douGe.currentAction, life.activeNailId));
            }}
          />
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-stone-900 font-doodle">店长豆哥的温馨日常</span>
              <span className="px-2 py-0.5 rounded-full border border-stone-800 bg-amber-50 text-[10px] font-mono font-bold text-amber-900">
                ✨ 灵感小确幸: {life.inspirationPoints} 点
              </span>
            </div>
            <p className="text-stone-500 text-[11px] max-w-md leading-relaxed">
              生活是开店的养分。穿戴甲的仪式感、《抓大鹅》的胜负欲、动漫短剧的治愈，构成了真实的豆哥。
            </p>
            {/* 灵感获取小贴士 */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-stone-500 font-mono">
              <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                ☕ 顾客满意出餐：自动积累灵感点
              </span>
              <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                🔒 纯单机虚构点数 · 绝无真实充值
              </span>
            </div>
          </div>
        </div>

        {/* 右侧：快速互动操作区 */}
        <div className="flex flex-wrap md:flex-col gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={handleCheerUp}
            className="doodle-btn px-3 py-1.5 text-xs flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 font-bold"
            title="给豆哥递上特调热饮恢复体力和心情"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-800" />
            <span>递咖啡打气 (+10心情)</span>
          </button>
          <button
            onClick={handlePlayGoose}
            className="doodle-btn px-3 py-1.5 text-xs flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-white font-bold"
            title="围观豆哥玩一局微信小游戏《抓大鹅》"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-stone-800" />
            <span>围观抓大鹅一把</span>
          </button>
        </div>
      </div>

      {/* 4个生活主题标签导航 */}
      <div className="flex items-center gap-2 border-b-2 border-stone-900 pb-1 overflow-x-auto">
        <button
          onClick={() => {
            playPageFlipSound();
            setActiveTab('NAILS');
          }}
          className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-t-lg border-2 border-b-0 border-stone-900 flex items-center gap-1.5 transition-all ${
            activeTab === 'NAILS'
              ? 'bg-white shadow-[2px_-2px_0px_#1c1917] -mb-[3px] z-10'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>💅 穿戴甲展示盒</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 font-mono">
            {life.ownedNailIds.length}/10
          </span>
        </button>

        <button
          onClick={() => {
            playPageFlipSound();
            setActiveTab('GOOSE');
          }}
          className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-t-lg border-2 border-b-0 border-stone-900 flex items-center gap-1.5 transition-all ${
            activeTab === 'GOOSE'
              ? 'bg-white shadow-[2px_-2px_0px_#1c1917] -mb-[3px] z-10'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>🪿 抓大鹅战报室</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 font-mono">
            {life.gooseAttempts}局
          </span>
        </button>

        <button
          onClick={() => {
            playPageFlipSound();
            setActiveTab('ANIME');
          }}
          className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-t-lg border-2 border-b-0 border-stone-900 flex items-center gap-1.5 transition-all ${
            activeTab === 'ANIME'
              ? 'bg-white shadow-[2px_-2px_0px_#1c1917] -mb-[3px] z-10'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>🎬 追番小影厅</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 font-mono">
            {life.watchedDramaIds.length}/{ANIME_SHORT_DRAMAS.length}
          </span>
        </button>

        <button
          onClick={() => {
            playPageFlipSound();
            setActiveTab('DIARY');
          }}
          className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-t-lg border-2 border-b-0 border-stone-900 flex items-center gap-1.5 transition-all ${
            activeTab === 'DIARY'
              ? 'bg-white shadow-[2px_-2px_0px_#1c1917] -mb-[3px] z-10'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>📖 豆哥手账日记</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 font-mono">
            {life.dailyDiaries.length}篇
          </span>
        </button>
      </div>

      {/* 模块一：💅 穿戴甲展示盒 */}
      {activeTab === 'NAILS' && (
        <div className="space-y-4 animate-in fade-in">
          {/* 穿戴甲指尖当前佩戴状态条 */}
          <div className="p-3 bg-[#FAF8F5] border-2 border-stone-900 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900">当前佩戴指尖:</span>
              {life.activeNailId ? (
                <span className="px-2.5 py-1 rounded-lg border border-stone-900 bg-white font-bold flex items-center gap-1 shadow-xs">
                  <span>✦</span>
                  <span>{(EXPANDED_PRESS_ON_NAILS as any[]).find((n) => n.id === life.activeNailId)?.name || PRESS_ON_NAILS.find((n) => n.id === life.activeNailId)?.name}</span>
                </span>
              ) : (
                <span className="text-stone-500 font-mono">暂未佩戴任何款式 (素甲状态)</span>
              )}
            </div>
            <div className="text-[11px] text-stone-600">
              💡 豆哥小贴士：“果冻胶一定要对准烤热压实30秒，端咖啡出餐超牢固！”
            </div>
          </div>

          {/* 18款虚构穿戴甲网格展示 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {(EXPANDED_PRESS_ON_NAILS as any[]).map((nail) => {
              const isOwned = life.ownedNailIds.includes(nail.id);
              const isActive = life.activeNailId === nail.id;
              const isSelected = selectedNail?.id === nail.id;

              return (
                <div
                  key={nail.id}
                  onClick={() => setSelectedNail(nail)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'border-stone-900 bg-white shadow-[3px_3px_0px_#1c1917]'
                      : 'border-stone-300 bg-white/70 hover:border-stone-900 hover:bg-white'
                  }`}
                >
                  {/* 手绘穿戴甲指尖线稿预览 */}
                  <div className="relative w-full aspect-square bg-[#FAF8F5] rounded-lg border border-stone-800 flex items-center justify-center p-2 mb-2 overflow-hidden">
                    {/* 手绘甲型轮廓 */}
                    <div className="relative w-12 h-16 rounded-t-full border-2 border-stone-900 bg-white shadow-xs flex flex-col items-center justify-between p-1.5">
                      {/* 甲面花纹线稿 */}
                      {nail.id === 'nail_latte_paw' && (
                        // 小猫爪肉垫
                        <div className="mt-2 flex flex-col items-center">
                          <div className="w-4 h-3.5 rounded-full bg-stone-900" />
                          <div className="flex gap-1 -mt-5">
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                          </div>
                        </div>
                      )}
                      {nail.id === 'nail_bw_checker' && (
                        // 棋盘格
                        <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-0.5 mt-1 opacity-80">
                          <div className="bg-stone-900" />
                          <div className="bg-white border border-stone-400" />
                          <div className="bg-white border border-stone-400" />
                          <div className="bg-stone-900" />
                          <div className="bg-stone-900" />
                          <div className="bg-white border border-stone-400" />
                        </div>
                      )}
                      {nail.id === 'nail_grape_ice' && (
                        // 冰透露珠
                        <div className="w-full flex flex-col items-center gap-1 mt-2">
                          <div className="w-5 h-5 rounded-full border border-stone-800 border-dashed" />
                          <div className="w-2 h-2 rounded-full border border-stone-900" />
                        </div>
                      )}
                      {nail.id === 'nail_cat_eye_silver' && (
                        // 斜向猫眼流动线
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1 h-12 bg-stone-900 rotate-45 rounded-full shadow-xs" />
                        </div>
                      )}
                      {nail.id === 'nail_vintage_camellia' && (
                        // 浮雕山茶花
                        <div className="w-6 h-6 rounded-full border-2 border-stone-900 flex items-center justify-center mt-3">
                          <div className="w-2 h-2 rounded-full bg-stone-900" />
                        </div>
                      )}
                      {nail.id === 'nail_french_daisy' && (
                        // 小雏菊
                        <div className="w-5 h-5 rounded-full border border-stone-900 flex items-center justify-center mt-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                        </div>
                      )}
                      {nail.id === 'nail_aurora_blush' && (
                        // 水光腮红晕染点
                        <div className="w-5 h-7 rounded-full bg-stone-200 border border-stone-400 mt-2" />
                      )}
                      {nail.id === 'nail_sunset_twilight' && (
                        // 晚霞横线
                        <div className="w-full flex flex-col gap-1 mt-3">
                          <div className="h-0.5 bg-stone-900 w-full" />
                          <div className="h-0.5 bg-stone-600 w-full" />
                          <div className="h-0.5 bg-stone-400 w-full" />
                        </div>
                      )}
                      {nail.id === 'nail_amber_smudge' && (
                        // 焦糖晕染涡流
                        <div className="w-6 h-6 rounded-full border border-stone-900 border-t-2 border-r-2 mt-2" />
                      )}
                      {nail.id === 'nail_chilly_wave' && (
                        // 不规则银丝波纹
                        <svg viewBox="0 0 24 24" className="w-6 h-10 mt-1 stroke-stone-900 fill-none stroke-2">
                          <path d="M4 2 Q14 12 6 22" />
                          <path d="M12 4 Q20 14 14 24" />
                        </svg>
                      )}

                      {/* 底端月牙小甲弧 */}
                      <div className="w-6 h-1 border-t border-stone-400 rounded-full" />
                    </div>

                    {/* 佩戴中小角标 */}
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-stone-900 text-white text-[9px] font-bold">
                        佩戴中
                      </span>
                    )}

                    {/* 未解锁锁头 */}
                    {!isOwned && (
                      <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[0.5px] flex items-center justify-center">
                        <div className="p-1.5 rounded-full bg-white border border-stone-900 shadow-xs">
                          <Lock className="w-3.5 h-3.5 text-stone-700" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 标题与标签 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900 truncate">{nail.name}</span>
                    </div>
                    <span className="inline-block text-[10px] px-1.5 py-0.2 rounded border border-stone-300 bg-stone-100 text-stone-600 font-mono">
                      {nail.styleTag}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="mt-2.5">
                    {isOwned ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEquip(nail.id);
                        }}
                        className={`w-full py-1 text-[11px] font-bold rounded-lg border border-stone-900 transition-all ${
                          isActive
                            ? 'bg-stone-900 text-white'
                            : 'bg-white hover:bg-stone-100 text-stone-900'
                        }`}
                      >
                        {isActive ? '正在佩戴 (点击脱下)' : '点击佩戴'}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockNail(nail);
                        }}
                        disabled={life.inspirationPoints < nail.inspirationCost}
                        className={`w-full py-1 text-[11px] font-bold rounded-lg border border-stone-900 transition-all flex items-center justify-center gap-1 ${
                          life.inspirationPoints >= nail.inspirationCost
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-950'
                            : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                        }`}
                      >
                        <span>✨</span>
                        <span>{nail.inspirationCost} 灵感解锁</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 选中的穿戴甲详细品鉴卡 */}
          {selectedNail && (
            <div className="doodle-box p-4 bg-white border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900">【{selectedNail.name}】品鉴细节</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-800 bg-stone-100 font-mono">
                    风格: {selectedNail.styleTag}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{selectedNail.description}</p>
                <div className="p-2.5 bg-[#FAF8F5] border border-stone-300 rounded-lg text-xs italic text-stone-800">
                  {selectedNail.dialogue}
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-2 w-full md:w-48 text-xs font-mono">
                <div className="p-2 rounded-lg border border-stone-200 bg-stone-50">
                  <span className="text-stone-500">解锁要求:</span>
                  <p className="font-bold text-stone-800 text-[11px]">{selectedNail.unlockCondition}</p>
                </div>
                {life.ownedNailIds.includes(selectedNail.id) ? (
                  <button
                    onClick={() => handleToggleEquip(selectedNail.id)}
                    className="doodle-btn doodle-btn-primary py-1.5 text-xs font-bold"
                  >
                    {life.activeNailId === selectedNail.id ? '卸下当前款式' : '立即换戴此款'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnlockNail(selectedNail)}
                    disabled={life.inspirationPoints < selectedNail.inspirationCost}
                    className={`doodle-btn py-1.5 text-xs font-bold ${
                      life.inspirationPoints >= selectedNail.inspirationCost
                        ? 'bg-amber-100 text-amber-950 border-stone-900'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed border-stone-300'
                    }`}
                  >
                    ✨ 兑换解锁 ({selectedNail.inspirationCost} 灵感)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 模块二：🪿 抓大鹅战报室 */}
      {activeTab === 'GOOSE' && (
        <div className="space-y-4 animate-in fade-in">
          {/* 数据总览看板 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="doodle-box p-3 bg-white text-center">
              <span className="text-[11px] text-stone-500">累计抓鹅挑战</span>
              <div className="text-lg font-bold font-mono text-stone-900">{life.gooseAttempts} 局</div>
            </div>
            <div className="doodle-box p-3 bg-white text-center">
              <span className="text-[11px] text-stone-500">第2关通关奇迹</span>
              <div className="text-lg font-bold font-mono text-emerald-800">{life.gooseClearedLevels} 次</div>
            </div>
            <div className="doodle-box p-3 bg-white text-center">
              <span className="text-[11px] text-stone-500">第2关卡关率</span>
              <div className="text-lg font-bold font-mono text-rose-800">
                {life.gooseAttempts > 0
                  ? `${(((life.gooseAttempts - life.gooseClearedLevels) / life.gooseAttempts) * 100).toFixed(0)}%`
                  : '100%'}
              </div>
            </div>
            <div className="doodle-box p-3 bg-white text-center">
              <span className="text-[11px] text-stone-500">已解锁趣味战报</span>
              <div className="text-lg font-bold font-mono text-amber-800">
                {life.unlockedGooseAnecdotes.length} / 6 条
              </div>
            </div>
          </div>

          {/* 实时抓鹅操作模拟区 */}
          <div className="doodle-box p-4 bg-white border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-stone-900">微信小游戏《抓大鹅》豆哥专属战台</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-800 bg-stone-100 font-mono">
                  休闲模拟
                </span>
              </div>
              <p className="text-xs text-stone-600">
                每到闲暇，豆哥就会在吧台开一局《抓大鹅》。你可以围观他的即时战局，或者给他递杯咖啡解救他的血压！
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePlayGoose}
                className="doodle-btn doodle-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>围观抓一把大鹅</span>
              </button>
            </div>
          </div>

          {/* 战报与大鹅逸事集锦 */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <span>🪿 豆哥与大鹅的宿命对决记录</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {life.unlockedGooseAnecdotes.map((anecdoteId) => {
                const anecdote = PRESS_ON_NAILS ? null : null; // dummy
                const realAnecdote = (await_dummy: any) => null;
                // 从配置匹配
                const found = [
                  {
                    id: 'goose_stuck_level2',
                    title: '第2关的量子力学',
                    content: '第1关是幼儿园教学，第2关直接跨入量子力学！豆哥连战8局，格子总是卡在最后两个空格。',
                    dougeQuote: '“我就不信了！明明桌上只剩两个大姜丝和一个大葱，怎么凑不出一套？！”',
                    gooseType: '呆头大白鹅',
                  },
                  {
                    id: 'goose_almost_cleared',
                    title: '差一只大白鹅的遗憾',
                    content: '倒计时还剩3秒，满屏只剩最后一只戴领结的大白鹅被压在最底层，道具刷新全用完了。',
                    dougeQuote: '“啊啊啊！就差最后半秒！那只大白鹅还在冲我耀武扬威地叫了一声‘嘎！’”',
                    gooseType: '绅士领结鹅',
                  },
                  {
                    id: 'goose_cat_assist',
                    title: '兰兰神之一爪',
                    content: '豆哥正犹豫该点哪个物品，兰兰跳上吧台尾巴扫过屏幕，神奇地触发了连消！',
                    dougeQuote: '“兰兰！你才是真正的消消乐大师吧？！今天给你加两个冻干小鱼干！”',
                    gooseType: '猫耳抱枕鹅',
                  },
                  {
                    id: 'goose_rage_quit_chill',
                    title: '战略性休战',
                    content: '连续第15次卡关后，豆哥深吸一口气，端起手冲咖啡：“抓大鹅要讲究缘分，不急。”',
                    dougeQuote: '“大鹅先在农场养着，等我把店里的咖啡豆磨完，晚上再来收网！”',
                    gooseType: '铁锅大烤鹅',
                  },
                  {
                    id: 'goose_epic_victory',
                    title: '奇迹！大白鹅被捕获！',
                    content: '凭借冷静的计算与精准的记忆翻牌，豆哥终于清空了全部障碍，抓到了金色大鹅机甲！',
                    dougeQuote: '“赢了！我终于通关了！快发个朋友圈告诉大家，今天豆哥也是大鹅驯服者了！”',
                    gooseType: '机甲战神鹅',
                  },
                  {
                    id: 'goose_cafe_crossover',
                    title: '咖啡师特别鹅出没',
                    content: '小游戏里限时刷新出了一只戴着围裙的小鹅，长得跟豆哥本店长颇有几分神似。',
                    dougeQuote: '“这只鹅手里的咖啡壶怎么跟我的一模一样？决定了，抓到了就放在展柜里！”',
                    gooseType: '咖啡师见习鹅',
                  },
                ].find((a) => a.id === anecdoteId);

                if (!found) return null;

                return (
                  <div
                    key={found.id}
                    className="p-3 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{found.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-950 font-mono font-bold">
                        {found.gooseType}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">{found.content}</p>
                    <div className="p-2 bg-[#FAF8F5] border border-stone-200 rounded text-stone-800 text-[11px] italic">
                      {found.dougeQuote}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 模块三：🎬 追番小影厅 & 衍生周边 */}
      {activeTab === 'ANIME' && (
        <div className="space-y-4 animate-in fade-in">
          {/* 动漫周边展示架 */}
          <div className="doodle-box p-4 bg-white border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-stone-900" />
                <span className="font-bold text-xs sm:text-sm text-stone-900">
                  豆哥的桌面动漫周边展示架 ({life.ownedDecorIds.length}/{ANIME_DECORS.length})
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">看剧首播即可解锁对应周边</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ANIME_DECORS.map((decor) => {
                const isOwned = life.ownedDecorIds.includes(decor.id);
                return (
                  <div
                    key={decor.id}
                    className={`p-2.5 rounded-xl border-2 text-xs flex flex-col justify-between ${
                      isOwned
                        ? 'border-stone-900 bg-[#FAF8F5] shadow-xs'
                        : 'border-stone-300 bg-stone-100/70 text-stone-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate">{decor.name}</span>
                        {isOwned ? (
                          <span className="text-[9px] px-1 bg-stone-900 text-white rounded">已收藏</span>
                        ) : (
                          <Lock className="w-3 h-3 text-stone-400" />
                        )}
                      </div>
                      <p className="text-[10px] line-clamp-2 leading-relaxed text-stone-600">
                        {decor.description}
                      </p>
                    </div>
                    <div className="mt-2 text-[9px] text-stone-500 font-mono truncate">
                      出处: {decor.fromDramaTitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 虚构动漫短剧剧目列表 */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-stone-900">
              📺 豆哥的泡面番短剧收藏夹 (全原创治愈剧目)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ANIME_SHORT_DRAMAS.map((drama) => {
                const isWatched = life.watchedDramaIds.includes(drama.id);
                return (
                  <div
                    key={drama.id}
                    className="p-3.5 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-2 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-sm">{drama.title}</span>
                        <div className="flex items-center gap-1 text-amber-800 font-bold font-mono text-[11px]">
                          <span>★ {drama.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-stone-500 font-mono">{drama.episodes}</span>
                        {drama.genreTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.2 rounded border border-stone-300 bg-stone-100 text-stone-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-stone-600 text-[11px] leading-relaxed">{drama.synopsis}</p>

                      <div className="p-2 bg-[#FAF8F5] border border-stone-200 rounded text-stone-800 text-[11px] italic">
                        豆哥影评：{drama.dougeReview}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-stone-200 mt-2">
                      <span className="text-[10px] text-stone-500 font-mono">
                        {isWatched ? '✓ 已完整刷完' : '未看 (首看奖励周边)'}
                      </span>
                      <button
                        onClick={() => handleWatchDrama(drama)}
                        className="doodle-btn px-3 py-1 text-xs font-bold flex items-center gap-1"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>陪豆哥看一集</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 模块四：📖 豆哥手账日记本 */}
      {activeTab === 'DIARY' && (
        <div className="space-y-3 animate-in fade-in">
          {/* 过滤按钮组 */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {[
              { id: 'ALL', label: '全部随笔' },
              { id: 'NAILS', label: '💅 穿戴甲记录' },
              { id: 'GOOSE', label: '🪿 抓大鹅战报' },
              { id: 'ANIME', label: '🎬 追番影评' },
              { id: 'CHILL', label: '☕ 生活闲趣' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDiaryFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg border font-bold text-xs transition-all ${
                  diaryFilter === f.id
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 手账列表 */}
          {filteredDiaries.length > 0 ? (
            <div className="space-y-2.5">
              {filteredDiaries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm font-doodle">{entry.title}</span>
                      <span className="px-1.5 py-0.2 rounded border border-stone-300 bg-stone-100 text-[10px] font-mono text-stone-600">
                        经营第 {entry.day} 日
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-stone-700 text-xs leading-relaxed">{entry.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="doodle-box p-8 bg-white text-center space-y-2 text-stone-500 text-xs">
              <BookOpen className="w-6 h-6 mx-auto text-stone-400" />
              <p>该分类下暂无生活随笔记录，快去和豆哥一起开启日常互动吧～</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
