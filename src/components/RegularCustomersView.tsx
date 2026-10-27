/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 熟客长线羁绊与故事集视图 (RegularCustomersView)
 * 核心功能：
 * 1. 4位核心熟客的羁绊档案 (小林、老王、阿豪、沫沫)
 * 2. 熟客到店频次、专属偏好与亲密度进度条
 * 3. 永久沉淀已解锁的熟客回忆录故事
 * 4. 熟客赠予的书咖纪念物展台
 */

import React, { useState } from 'react';
import {
  RegularCustomerProfile,
  RegularCustomerStory,
} from '../types/game';
import { REGULAR_CUSTOMER_STORIES } from '../game/config/growthData';
import { INITIAL_MENU_ITEMS } from '../game/config/initialData';
import {
  Users,
  Heart,
  BookOpen,
  Award,
  Sparkles,
  Coffee,
  MessageSquare,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { playClickSound } from '../game/audio/soundEffects';

interface RegularCustomersViewProps {
  regularCustomers: Record<string, RegularCustomerProfile>;
  currentDay: number;
}

export const RegularCustomersView: React.FC<RegularCustomersViewProps> = ({
  regularCustomers,
  currentDay,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('regular_student_xiaolin');
  const [selectedStory, setSelectedStory] = useState<RegularCustomerStory | null>(null);

  const customerList = Object.values(regularCustomers);
  const activeCustomer = regularCustomers[selectedCustomerId] || customerList[0];
  const allStoriesForActive = REGULAR_CUSTOMER_STORIES[activeCustomer?.id] || [];

  const affinityLevelNames = [
    '未结缘',
    '萍水相逢 (Lv.1)',
    '常常光顾 (Lv.2)',
    '默契熟客 (Lv.3)',
    '莫逆知己 (Lv.4)',
  ];

  return (
    <div className="space-y-4">
      
      {/* 熟客故事查看弹窗 */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-lg p-5 space-y-3.5 shadow-[6px_6px_0px_#1c1917]">
            <div className="flex items-center justify-between border-b-2 border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-stone-900" />
                <h3 className="font-bold text-base font-doodle text-stone-900">
                  {selectedStory.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="w-7 h-7 rounded border-2 border-stone-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed indent-4 bg-white p-3.5 rounded-xl border border-stone-800 font-serif">
              {selectedStory.content}
            </p>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <span>奖励影响：{selectedStory.rewardNote || '情谊加深'}</span>
              <button
                onClick={() => setSelectedStory(null)}
                className="doodle-btn px-4 py-1 text-xs font-bold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 熟客系统说明横幅 */}
      <div className="p-3 bg-white border-2 border-stone-900 rounded-xl flex items-start gap-2.5 shadow-[2px_2px_0px_#1c1917]">
        <Users className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
            熟客关系与羁绊故事集
          </h4>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            顾客多次光临、成功出餐并获得好评后，将逐步从普通顾客升级为<strong>熟客</strong>。
            熟客会解锁独特的进店问候、特殊定制心愿订单、赠送珍贵书咖纪念物，并解锁温情故事（故事永久持久化保存）。
          </p>
        </div>
      </div>

      {/* 主界面双栏：左侧熟客名录卡片，右侧熟客详情与故事树 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* 左侧：熟客名录导航 */}
        <div className="md:col-span-5 space-y-2.5">
          {customerList.map((cust) => {
            const isSelected = cust.id === activeCustomer.id;
            const favItem = INITIAL_MENU_ITEMS[cust.favoriteProductId];

            return (
              <div
                key={cust.id}
                onClick={() => {
                  playClickSound();
                  setSelectedCustomerId(cust.id);
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-stone-900 bg-white shadow-[3px_3px_0px_#1c1917]'
                    : 'border-stone-800 bg-[#FAF8F5] hover:bg-white text-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border-2 border-stone-900 bg-stone-100 flex items-center justify-center font-bold text-sm shadow-[1.5px_1.5px_0px_#1c1917]">
                    {cust.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-stone-900">{cust.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded border border-stone-800 bg-stone-100 text-stone-600">
                        {cust.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {affinityLevelNames[cust.affinityLevel]} · 到店 {cust.visitsCount} 次
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {cust.souvenirReceived && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-800 text-amber-950 font-bold block mb-1">
                      🎁 纪念物
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-stone-400 ml-auto" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 右侧：选中熟客的深度档案、故事与纪念物 */}
        <div className="md:col-span-7 doodle-box p-4 sm:p-5 bg-white space-y-4">
          
          {/* 档案头部 */}
          <div className="flex items-start justify-between border-b-2 border-stone-100 pb-3 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg font-doodle text-stone-900">
                  {activeCustomer.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full border border-stone-900 bg-[#FAF8F5] font-bold">
                  {activeCustomer.title}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 italic">
                “{activeCustomer.greetingDialogue}”
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-stone-500 block">心头好餐品</span>
              <span className="font-bold text-xs text-emerald-800 flex items-center gap-1 mt-0.5">
                <Coffee className="w-3.5 h-3.5" />
                {INITIAL_MENU_ITEMS[activeCustomer.favoriteProductId]?.name || '手冲咖啡'}
              </span>
            </div>
          </div>

          {/* 羁绊等级进度条 */}
          <div className="p-3 bg-[#FAF8F5] border border-stone-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                <span>熟客羁绊：{affinityLevelNames[activeCustomer.affinityLevel]}</span>
              </span>
              <span className="font-mono text-stone-600 font-bold">
                {activeCustomer.affinityLevel >= 4 ? 'MAX' : `${activeCustomer.affinityExp}/100 EXP`}
              </span>
            </div>

            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${activeCustomer.affinityLevel >= 4 ? 100 : activeCustomer.affinityExp}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-400">
              每次成功出餐交付获得 +15 羁绊经验，满意度 90+ 额外获得 +10 惊喜经验。
            </p>
          </div>

          {/* 赠予的书咖纪念物展示 */}
          {activeCustomer.souvenirReceived ? (
            <div className="p-3 bg-amber-50/80 border-2 border-amber-900/60 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-stone-900 flex items-center justify-center text-lg shadow-[1.5px_1.5px_0px_#1c1917]">
                🎁
              </div>
              <div>
                <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wide">
                  熟客赠予纪念物
                </span>
                <span className="font-bold text-xs text-stone-900">
                  【{activeCustomer.souvenirReceived}】
                </span>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  已永久陈列在书咖纪念展台，为全店带来持久声誉加成。
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-stone-50 border border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-400">
              熟客羁绊达到 Lv.3 时，顾客将向书咖赠送独一无二的专属纪念物。
            </div>
          )}

          {/* 解锁的故事章节列表 */}
          <div className="space-y-2 pt-1">
            <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-stone-700" />
              <span>羁绊故事集 ({activeCustomer.unlockedStoryIds.length}/{allStoriesForActive.length} 篇)</span>
            </h4>

            <div className="space-y-2">
              {allStoriesForActive.map((st) => {
                const isUnlocked = activeCustomer.unlockedStoryIds.includes(st.id);

                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      if (isUnlocked) {
                        playClickSound();
                        setSelectedStory(st);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                      isUnlocked
                        ? 'border-stone-900 bg-white hover:bg-stone-50 cursor-pointer shadow-[2px_2px_0px_#1c1917]'
                        : 'border-stone-200 bg-stone-50/60 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${isUnlocked ? 'text-stone-900' : 'text-stone-400'}`}>
                          {st.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono border border-stone-300">
                          Lv.{st.requiredAffinityLevel} 解锁
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1">
                        {isUnlocked ? st.content : '提升熟客羁绊即可解锁此段温情故事...'}
                      </p>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <button className="doodle-btn px-2.5 py-1 text-[11px] font-bold text-stone-900">
                          翻阅
                        </button>
                      ) : (
                        <span className="text-xs text-stone-400">未解锁</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
