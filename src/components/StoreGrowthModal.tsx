/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 书咖经营等级与成长专长面板 (StoreGrowthModal)
 * 职责：
 * 1. 经营等级进度 (Lv.1 ~ Lv.5) 与当前有效经营经验 EXP
 * 2. 五大等级解锁内容 (新商品、新设备、新家具、熟客、自动补货、专长)
 * 3. 经营专长点选与激活
 */

import React from 'react';
import { StoreLevelState, SpecializationId } from '../types/game';
import {
  STORE_LEVEL_MILESTONES,
  SPECIALIZATIONS_CATALOG,
} from '../game/config/growthData';
import { activateSpecialization } from '../game/engine/growthEngine';
import { playClickSound, playCoinSound } from '../game/audio/soundEffects';
import {
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Star,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface StoreGrowthModalProps {
  isOpen: boolean;
  growth: StoreLevelState;
  onClose: () => void;
  onUpdateGrowth: (newGrowth: StoreLevelState) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const StoreGrowthModal: React.FC<StoreGrowthModalProps> = ({
  isOpen,
  growth,
  onClose,
  onUpdateGrowth,
  showToast,
}) => {
  if (!isOpen) return null;

  const currentMilestone = STORE_LEVEL_MILESTONES.find((m) => m.level === growth.level) || STORE_LEVEL_MILESTONES[0];
  const nextMilestone = STORE_LEVEL_MILESTONES.find((m) => m.level === growth.level + 1);

  // 激活专长
  const handleSelectSpecialization = (specId: SpecializationId) => {
    playCoinSound();
    const res = activateSpecialization(growth, specId);
    if (!res.success) {
      showToast(res.error || '激活失败', 'error');
      return;
    }
    onUpdateGrowth(res.nextGrowth);
    showToast(`恭喜！成功激活经营专长【${SPECIALIZATIONS_CATALOG[specId].name}】！`, 'success');
  };

  const expProgressPct = nextMilestone
    ? Math.min(100, Math.round(((growth.currentExp - currentMilestone.requiredExp) / (nextMilestone.requiredExp - currentMilestone.requiredExp)) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#1c1917] overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="p-4 sm:p-5 border-b-2 border-stone-900 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-doodle tracking-wide text-stone-900">
                  书咖经营等级与专长
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-900 font-bold bg-amber-100 text-amber-950 font-mono">
                  Lv.{growth.level} 阶梯成长
                </span>
              </div>
              <p className="text-xs text-stone-500">
                以真实有效经营积攒经验 · 阶梯式解锁设备、熟客、专长与自动化
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

        {/* 主体内容 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-800">
          
          {/* 当前等级与经验进度卡 */}
          <div className="p-4 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  当前经营称号
                </span>
                <span className="font-bold text-base font-doodle text-stone-900">
                  {currentMilestone.title}
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-stone-500 block">有效经营经验</span>
                <span className="font-bold text-sm text-stone-900">
                  {growth.currentExp} {nextMilestone ? `/ ${nextMilestone.requiredExp} EXP` : '(满级 MAX)'}
                </span>
              </div>
            </div>

            {/* 经验进度条 */}
            <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden border border-stone-800 mt-1">
              <div
                className="bg-stone-900 h-full transition-all duration-300"
                style={{ width: `${expProgressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <span>成功出餐交付: +10 EXP/单 · 90+高分好评: 额外+5 EXP</span>
              <span className="font-bold text-stone-700">累计成功交付 {growth.totalOrdersDelivered} 单</span>
            </div>
          </div>

          {/* 经营专长库 (升级解锁并自由激活) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1 text-xs font-bold text-stone-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>经营专长树 (已激活 {growth.selectedSpecializations.length} 项)</span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal">提升出餐满意度、耐心与采购折扣</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(SPECIALIZATIONS_CATALOG).map((spec) => {
                const isUnlockedLevel = growth.level >= spec.requiredLevel;
                const isActivated = growth.selectedSpecializations.includes(spec.id);

                return (
                  <div
                    key={spec.id}
                    className={`p-3 rounded-xl border-2 transition-all space-y-1.5 ${
                      isActivated
                        ? 'border-stone-900 bg-amber-50/80 shadow-[2px_2px_0px_#1c1917]'
                        : isUnlockedLevel
                        ? 'border-stone-800 bg-white shadow-xs'
                        : 'border-stone-300 bg-stone-50/60 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{spec.icon}</span>
                        <span className="font-bold text-xs sm:text-sm text-stone-900">{spec.name}</span>
                      </div>

                      {isActivated ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-bold border border-emerald-400">
                          已激活
                        </span>
                      ) : isUnlockedLevel ? (
                        <button
                          onClick={() => handleSelectSpecialization(spec.id)}
                          className="doodle-btn px-2.5 py-0.5 text-[11px] font-bold bg-stone-900 text-white"
                        >
                          激活
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Lv.{spec.requiredLevel} 解锁
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                      {spec.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 五大等级里程碑路线 */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-stone-700 border-b border-stone-200 pb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-stone-700" />
              <span>等级里程碑路线图</span>
            </h4>

            <div className="space-y-2">
              {STORE_LEVEL_MILESTONES.map((m) => {
                const isPassed = growth.level >= m.level;
                const isCurrent = growth.level === m.level;

                return (
                  <div
                    key={m.level}
                    className={`p-3 rounded-xl border-2 transition-all flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'border-stone-900 bg-white ring-2 ring-stone-900/10 shadow-[2px_2px_0px_#1c1917]'
                        : isPassed
                        ? 'border-stone-800 bg-[#FAF8F5]'
                        : 'border-stone-200 bg-stone-50/60 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">
                          Lv.{m.level} · {m.title}
                        </span>
                        {isPassed && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-100 text-emerald-800">
                            ✓ {isCurrent ? '当前等级' : '已达成'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600">
                        {m.unlockNote}
                      </p>
                    </div>

                    <span className="font-mono text-xs text-stone-500 shrink-0">
                      {m.requiredExp} EXP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

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
            返回书咖
          </button>
        </div>

      </div>
    </div>
  );
};
