/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 随机经营突发事件弹窗组件 (RandomEventModal)
 * 功能：
 * 1. 呈现经营中突发的现实挑战 (猫咪生病、极端恶劣天气破损、供应链加急、商用设备检修等)
 * 2. 供玩家抉择应对方案，严谨扣减营运现金，记录财务支出流向
 * 3. 增强金钱流动与经营策略博弈深度
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Coins,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { TriggeredRandomEvent, RandomEventChoice } from '../types/game';
import { playClickSound, playCoinSound } from '../game/audio/soundEffects';

interface RandomEventModalProps {
  event: TriggeredRandomEvent;
  currentCash: number;
  onResolveChoice: (choiceId: string) => void;
}

export const RandomEventModal: React.FC<RandomEventModalProps> = ({
  event,
  currentCash,
  onResolveChoice,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>(event.definition.choices[0].id);
  const [resolvedOutcome, setResolvedOutcome] = useState<{ choice: RandomEventChoice; actualCost: number } | null>(null);

  const def = event.definition;

  // 确认选择
  const handleConfirm = () => {
    playCoinSound();
    const chosen = def.choices.find((c) => c.id === selectedChoiceId) || def.choices[0];
    const actualCost = Math.min(currentCash, chosen.cost);
    setResolvedOutcome({ choice: chosen, actualCost });
  };

  // 完成并关闭
  const handleFinish = () => {
    playClickSound();
    onResolveChoice(selectedChoiceId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="doodle-box w-full max-w-lg bg-[#FAF8F5] p-5 sm:p-6 space-y-4 border-2 border-stone-900 shadow-[8px_8px_0px_#1c1917]">
        
        {/* 标题栏 */}
        <div className="flex items-start justify-between border-b-2 border-stone-900 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 border-2 border-stone-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_#1c1917]">
              {def.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold border border-stone-800 bg-amber-200 text-amber-950">
                  第 {event.day} 天 · 突发经营事件
                </span>
                {def.severity === 'URGENT' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-200 text-rose-950 border border-rose-800 animate-pulse">
                    紧急
                  </span>
                )}
              </div>
              <h3 className="font-doodle text-lg sm:text-xl font-bold text-stone-900 mt-1">
                {def.title}
              </h3>
            </div>
          </div>
        </div>

        {/* 解决后的结果界面 */}
        {resolvedOutcome ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-50 border-2 border-stone-900 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>应对方案已落实并完成支付</span>
              </div>
              <p className="text-stone-700 leading-relaxed text-xs">
                {resolvedOutcome.choice.outcomeText}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200 font-mono">
                <span className="text-stone-500">实付应急资金：</span>
                <span className="text-rose-700 font-bold text-sm">
                  -¥{resolvedOutcome.actualCost.toFixed(2)}
                </span>
              </div>
              {(resolvedOutcome.choice.reputationChange || 0) > 0 && (
                <div className="text-[11px] text-emerald-700 font-bold">
                  ★ 店铺声誉获得加成 +{resolvedOutcome.choice.reputationChange}
                </div>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="doodle-btn doodle-btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>记入今日财务总账 · 返回书咖经营</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* 未选择界面：叙事与抉择选项 */
          <div className="space-y-4">
            {/* 事件叙事卡片 */}
            <div className="p-3.5 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] text-xs leading-relaxed text-stone-700">
              {def.narrative}
            </div>

            {/* 应对方案列表 */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-stone-800 block">
                请选择店长豆哥的应对措施 (将从当前流动资金扣除)：
              </span>

              {def.choices.map((choice) => {
                const isSelected = selectedChoiceId === choice.id;
                const canAfford = currentCash >= choice.cost;

                return (
                  <div
                    key={choice.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedChoiceId(choice.id);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-amber-50 shadow-[3px_3px_0px_#1c1917]'
                        : 'border-stone-800 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="event_choice"
                            checked={isSelected}
                            onChange={() => setSelectedChoiceId(choice.id)}
                            className="accent-stone-900"
                          />
                          <span>{choice.label}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 pl-5 leading-normal">
                          {choice.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-rose-700 block">
                          -¥{choice.cost.toFixed(2)}
                        </span>
                        {(choice.reputationChange || 0) > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold block">
                            声誉 +{choice.reputationChange}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 当前可用现金核算提示 */}
            <div className="flex items-center justify-between text-xs px-1 text-stone-600 font-mono">
              <span>当前营运现金：¥{currentCash.toFixed(2)}</span>
              <span className="text-stone-400">稳健经营 · 应对意外</span>
            </div>

            {/* 确认执行 */}
            <button
              onClick={handleConfirm}
              className="doodle-btn doodle-btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>确认执行此应对方案</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
