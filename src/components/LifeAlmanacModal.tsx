/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 书咖生活总图鉴与长线收藏馆 (LifeAlmanacModal)
 * 职责：
 * 1. 穿戴甲图鉴 (10款手绘穿戴甲与佩戴记录)
 * 2. 《抓大鹅》摸鱼趣事馆 (战报与通关趣事)
 * 3. 动漫短剧影院回忆 (6部原创短剧与周边展台)
 * 4. 兰兰九大自主行为观察图鉴
 * 5. 熟客温情回忆录与纪念物展柜
 * 6. 家具与设施图鉴
 */

import React, { useState } from 'react';
import {
  LifeAlmanacState,
  LanLanBehavior,
  RegularCustomerProfile,
  DouGeLifeState,
} from '../types/game';
import {
  PRESS_ON_NAILS,
  ANIME_SHORT_DRAMAS,
  ANIME_DECORS,
  GOOSE_ANECDOTES,
} from '../game/config/douGeLifeData';
import {
  BARISTA_TOOLS,
  CAT_PROPS,
  EXPANDED_PRESS_ON_NAILS,
  GamePropItem,
  PropRarity,
} from '../game/config/propsData';
import { LANLAN_BEHAVIOR_BUBBLES } from '../game/config/lanlanData';
import { REGULAR_CUSTOMER_STORIES } from '../game/config/growthData';
import { FURNITURE_CATALOG } from '../game/engine/layoutEngine';
import { playClickSound } from '../game/audio/soundEffects';
import {
  BookOpen,
  Sparkles,
  Gamepad2,
  Tv,
  Users,
  Armchair,
  CheckCircle2,
  Lock,
  Gift,
  Award,
  Filter,
} from 'lucide-react';

interface LifeAlmanacModalProps {
  isOpen: boolean;
  almanac: LifeAlmanacState;
  douGeLife: DouGeLifeState;
  regularCustomers: Record<string, RegularCustomerProfile>;
  onClose: () => void;
}

export const LifeAlmanacModal: React.FC<LifeAlmanacModalProps> = ({
  isOpen,
  almanac,
  douGeLife,
  regularCustomers,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'NAILS' | 'PROPS' | 'GOOSE' | 'ANIME' | 'LANLAN' | 'STORIES' | 'FURNITURE'>('NAILS');
  const [propFilter, setPropFilter] = useState<'ALL' | 'BARISTA' | 'CAT'>('ALL');

  if (!isOpen) return null;

  const getRarityBadge = (rarity: PropRarity) => {
    switch (rarity) {
      case 'COMMON':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-400 bg-stone-100 text-stone-700">普通</span>;
      case 'RARE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-400 bg-blue-100 text-blue-900">稀有</span>;
      case 'EPIC':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-purple-400 bg-purple-100 text-purple-900">史诗</span>;
      case 'LEGENDARY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-500 bg-amber-100 text-amber-950 shadow-xs animate-pulse">★ 传世</span>;
    }
  };

  // 兰兰9大行为定义
  const lanlanBehaviorsList: { id: LanLanBehavior; name: string; desc: string; icon: string }[] = [
    { id: 'SLEEPING', name: '睡大懒觉', desc: '雷打不动的深度睡眠，蜷成一个圆圆毛球呼噜打盹。', icon: '💤' },
    { id: 'STRETCHING', name: '伸长懒腰', desc: '刚睡醒时前爪下压、翘起屁股，拉伸舒展全身筋骨。', icon: '🐾' },
    { id: 'RESTING', name: '揣手手发呆', desc: '大圆脸包子腮帮，两只前爪折叠揣在胸下暗中观察客人们。', icon: '🍞' },
    { id: 'WALKING', name: '优雅踱步巡视', desc: '迈着轻柔无声小肉垫，在桌椅空隙间悠然巡视书咖领地。', icon: '🚶' },
    { id: 'ZOOMING', name: '突然跑酷冲刺', desc: '体内洪荒之力爆发！毫无预兆突然起飞狂奔，尾巴竖得笔直。', icon: '⚡' },
    { id: 'OBSERVING', name: '急刹车停下观察', desc: '狂奔后猛地刹车，铜琥珀大眼好奇环顾四周，假装什么都没发生。', icon: '👀' },
    { id: 'APPROACHING', name: '主动贴贴蹭豆哥', desc: '好久没人理我时，主动迈着小步凑过去蹭蹭豆哥裤腿或在脚边坐下。', icon: '❤️' },
    { id: 'PLAYING_YARN', name: '小爪击打毛线球', desc: '左右开弓啪啪拍打毛线球，看着毛球骨碌碌滚动追击扑打。', icon: '🧶' },
    { id: 'REFUSING_HUG', name: '泥鳅滑脱拒绝被抱', desc: '天生抗拒被强行束缚！像水一样敏捷扭动滑脱或跳开，保持独立大猫威严。', icon: '🚫' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#1c1917] overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="p-4 sm:p-5 border-b-2 border-stone-900 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-doodle tracking-wide text-stone-900">
                  书咖生活图鉴与典藏馆
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-900 font-bold bg-amber-100 text-amber-950">
                  永久收藏
                </span>
              </div>
              <p className="text-xs text-stone-500">
                记录豆哥的指尖美学与摸鱼日常 · 兰兰的自主习性 · 熟客的温情岁月
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-lg border-2 border-stone-900 flex items-center justify-center font-bold text-stone-700 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {/* 导航标签条 */}
        <div className="flex border-b-2 border-stone-900 bg-stone-100 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'NAILS', label: '穿戴甲图鉴', icon: <Sparkles className="w-3.5 h-3.5" />, count: douGeLife.ownedNailIds.length, total: EXPANDED_PRESS_ON_NAILS.length },
            { id: 'PROPS', label: '器具与猫物', icon: <Gift className="w-3.5 h-3.5" />, count: Math.min(BARISTA_TOOLS.length + CAT_PROPS.length, (douGeLife.ownedDecorIds?.length || 0) + 3), total: BARISTA_TOOLS.length + CAT_PROPS.length },
            { id: 'GOOSE', label: '抓大鹅趣事', icon: <Gamepad2 className="w-3.5 h-3.5" />, count: douGeLife.unlockedGooseAnecdotes.length, total: GOOSE_ANECDOTES.length },
            { id: 'ANIME', label: '短剧与周边', icon: <Tv className="w-3.5 h-3.5" />, count: douGeLife.watchedDramaIds.length, total: ANIME_SHORT_DRAMAS.length },
            { id: 'LANLAN', label: '兰兰九大行为', icon: <span>🐱</span>, count: (almanac.unlockedLanLanBehaviors || []).length, total: 9 },
            { id: 'STORIES', label: '熟客温情回忆', icon: <Users className="w-3.5 h-3.5" />, count: (almanac.unlockedCustomerStoryIds || []).length, total: 12 },
            { id: 'FURNITURE', label: '家具与设施', icon: <Armchair className="w-3.5 h-3.5" />, count: (almanac.unlockedFurnitureIds || []).length, total: Object.keys(FURNITURE_CATALOG).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2.5 flex items-center gap-1.5 border-r-2 border-stone-900 whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-[#FAF8F5] text-stone-900 font-bold border-b-2 border-b-[#FAF8F5] -mb-[2px]' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-white border border-stone-400 font-mono">
                {tab.count}/{tab.total}
              </span>
            </button>
          ))}
        </div>

        {/* 主体展示区 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-800">
          
          {/* TAB 1: 穿戴甲图鉴 (18款扩充穿戴甲，含分级收集难度与品质标签) */}
          {activeTab === 'NAILS' && (
            <div className="space-y-3">
              <div className="p-3 bg-white border-2 border-stone-900 rounded-xl flex items-center justify-between shadow-[2px_2px_0px_#1c1917]">
                <div>
                  <span className="text-xs text-stone-500 block">豆哥的指尖美学 · 虚构穿戴甲手作珍藏</span>
                  <span className="font-bold text-sm text-stone-900">
                    已入柜 {douGeLife.ownedNailIds.length} / {EXPANDED_PRESS_ON_NAILS.length} 款 · 当前灵感 {douGeLife.inspirationPoints} 点
                  </span>
                </div>
                <span className="text-2xl">💅</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {EXPANDED_PRESS_ON_NAILS.map((nail) => {
                  const isOwned = douGeLife.ownedNailIds.includes(nail.id);
                  const isEquipped = douGeLife.activeNailId === nail.id;

                  return (
                    <div
                      key={nail.id}
                      className={`p-3.5 rounded-xl border-2 transition-all space-y-2 flex flex-col justify-between ${
                        isOwned
                          ? 'border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917]'
                          : 'border-stone-300 bg-stone-100/70 text-stone-400 opacity-70'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-6 rounded-full border border-stone-800 shadow-xs shrink-0 bg-stone-800" />
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                                <span>{nail.name}</span>
                                {getRarityBadge((nail.rarity as PropRarity) || 'COMMON')}
                              </div>
                              <span className="text-[10px] text-stone-500 font-mono">{nail.styleTag}</span>
                            </div>
                          </div>

                          {isEquipped && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-900 bg-emerald-100 text-emerald-950 font-bold shrink-0">
                              佩戴中
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-stone-600 leading-relaxed font-sans line-clamp-2">
                          {nail.description}
                        </p>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-stone-100 text-[10px]">
                        <div className="text-amber-800 font-mono flex items-center justify-between">
                          <span>解锁条件:</span>
                          <span className="text-stone-700 font-sans font-semibold">
                            {(nail as any).unlockRequirement?.specialConditionDesc || (nail as any).unlockCondition || '书咖灵感兑换'}
                          </span>
                        </div>
                        <div className="text-stone-400 flex items-center justify-between">
                          <span>灵感点: {nail.inspirationCost} 点</span>
                          <span>{isOwned ? '✓ 已收藏入柜' : '🔒 待解锁'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1.5: 吧台经营器具与猫咪秘宝道具 (高收集难度与深度经营增益) */}
          {activeTab === 'PROPS' && (
            <div className="space-y-3">
              {/* 筛选切换 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1.5 text-xs font-semibold">
                  {[
                    { id: 'ALL', label: '全部器具与道具' },
                    { id: 'BARISTA', label: '☕ 咖啡吧台器具' },
                    { id: 'CAT', label: '🐱 兰兰猫物与玩具' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setPropFilter(f.id as any)}
                      className={`px-3 py-1 rounded-lg border transition-colors ${
                        propFilter === f.id
                          ? 'border-stone-900 bg-stone-900 text-white font-bold'
                          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-stone-400">
                  道具影响出餐品质、小费与猫咪互动
                </span>
              </div>

              {/* 道具卡片网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...BARISTA_TOOLS, ...CAT_PROPS]
                  .filter((item) => {
                    if (propFilter === 'BARISTA') return item.category === 'BARISTA_TOOL';
                    if (propFilter === 'CAT') return item.category === 'CAT_TOY';
                    return true;
                  })
                  .map((prop) => {
                    return (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-xl border-2 border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917] space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl p-1.5 rounded-lg border border-stone-800 bg-stone-50">
                                {prop.icon}
                              </span>
                              <div>
                                <div className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                                  <span>{prop.name}</span>
                                  {getRarityBadge(prop.rarity)}
                                </div>
                                <span className="text-[10px] text-stone-500 font-mono">
                                  {prop.category === 'BARISTA_TOOL' ? '专业吧台设备' : '猫咪生活道具'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-stone-600 leading-relaxed">
                            {prop.description}
                          </p>

                          <p className="text-[10px] text-stone-400 italic">
                            {prop.flavorText}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-stone-100 space-y-1 text-xs">
                          <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <span>✨ 效果:</span>
                            <span>{prop.effectDesc}</span>
                          </div>

                          <div className="text-[10px] text-stone-500 flex items-center justify-between bg-stone-50 p-1.5 rounded border border-stone-200">
                            <span className="font-bold text-stone-700">获得途径:</span>
                            <span>{prop.unlockRequirement.specialConditionDesc}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: 《抓大鹅》趣事馆 */}
          {activeTab === 'GOOSE' && (
            <div className="space-y-3">
              <div className="p-3 bg-white border-2 border-stone-900 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">微信小游戏《抓大鹅》摸鱼战报</span>
                  <span className="font-bold text-sm text-stone-900">
                    总对局 {douGeLife.gooseAttempts} 次 · 通关 {douGeLife.gooseClearedLevels} 次 (大部分卡在第2关)
                  </span>
                </div>
                <span className="text-2xl">🪿</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOOSE_ANECDOTES.map((anec) => {
                  const isUnlocked = douGeLife.unlockedGooseAnecdotes.includes(anec.id);

                  return (
                    <div
                      key={anec.id}
                      className={`p-3.5 rounded-xl border-2 transition-all space-y-1.5 ${
                        isUnlocked
                          ? 'border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917]'
                          : 'border-stone-300 bg-stone-100/70 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">{anec.title}</span>
                        {isUnlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        {isUnlocked ? anec.content : '在【豆哥日常】多玩几次《抓大鹅》解锁趣事...'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 动漫短剧影院 */}
          {activeTab === 'ANIME' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ANIME_SHORT_DRAMAS.map((drama) => {
                  const isWatched = douGeLife.watchedDramaIds.includes(drama.id);

                  return (
                    <div
                      key={drama.id}
                      className={`p-3.5 rounded-xl border-2 transition-all space-y-2 ${
                        isWatched
                          ? 'border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917]'
                          : 'border-stone-300 bg-stone-100/70 text-stone-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-xs text-stone-900">{drama.title}</div>
                          <span className="text-[10px] text-stone-500 font-mono">{drama.genreTags.join(' / ')} · {drama.episodes}</span>
                        </div>
                        {isWatched ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-950 font-bold border border-emerald-400">
                            已追完
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">待看</span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        {drama.synopsis}
                      </p>

                      {isWatched && (
                        <div className="p-2 bg-[#FAF8F5] rounded-lg border border-stone-200 text-[11px] text-stone-700 font-serif italic">
                          豆哥观后感：“{drama.dougeReview}”
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: 兰兰九大自主行为 */}
          {activeTab === 'LANLAN' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {lanlanBehaviorsList.map((beh) => {
                const isObserved = (almanac.unlockedLanLanBehaviors || []).includes(beh.id);

                return (
                  <div
                    key={beh.id}
                    className={`p-3 rounded-xl border-2 transition-all space-y-1.5 ${
                      isObserved
                        ? 'border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917]'
                        : 'border-stone-200 bg-stone-50 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                        <span>{beh.icon}</span>
                        <span>{beh.name}</span>
                      </div>
                      {isObserved ? (
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">已观察</span>
                      ) : (
                        <span className="text-[10px] text-stone-400">未记录</span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {beh.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: 熟客温情回忆 */}
          {activeTab === 'STORIES' && (
            <div className="space-y-3">
              {Object.values(regularCustomers).map((cust) => {
                const stories = REGULAR_CUSTOMER_STORIES[cust.id] || [];

                return (
                  <div key={cust.id} className="p-4 bg-white border-2 border-stone-900 rounded-xl space-y-2 shadow-[2px_2px_0px_#1c1917]">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{cust.name}</span>
                        <span className="text-xs text-stone-500 font-normal">({cust.title})</span>
                      </div>
                      {cust.souvenirReceived && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-800 text-amber-950 font-bold flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          <span>已赠【{cust.souvenirReceived}】</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {stories.map((st) => {
                        const isUnlocked = cust.unlockedStoryIds.includes(st.id);

                        return (
                          <div
                            key={st.id}
                            className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                              isUnlocked
                                ? 'bg-[#FAF8F5] border-stone-800 text-stone-800'
                                : 'bg-stone-50 border-stone-200 text-stone-400'
                            }`}
                          >
                            <span className="font-bold block text-stone-900">{st.title}</span>
                            <p className="text-[11px] leading-relaxed line-clamp-3">
                              {isUnlocked ? st.content : '熟客好感提升后解锁该故事...'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 6: 家具与设施 */}
          {activeTab === 'FURNITURE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(FURNITURE_CATALOG).map((item) => {
                const isUnlocked = (almanac.unlockedFurnitureIds || []).includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border-2 transition-all space-y-1 ${
                      isUnlocked
                        ? 'border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917]'
                        : 'border-stone-200 bg-stone-50 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{item.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono">{item.width}×{item.height}格</span>
                    </div>
                    <p className="text-[11px] text-stone-600 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1">
                      <span>进价: ¥{item.purchaseCost}</span>
                      <span>{isUnlocked ? '已收录' : '未解锁'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* 底部关闭 */}
        <div className="p-4 sm:p-5 border-t-2 border-stone-900 bg-white flex justify-end">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="doodle-btn px-5 py-2 text-xs font-bold text-stone-700"
          >
            关闭图鉴
          </button>
        </div>

      </div>
    </div>
  );
};
