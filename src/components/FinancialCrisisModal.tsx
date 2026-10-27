/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 经营风险预警与应急借款自救面板 (FinancialCrisisModal)
 * 职责：
 * 1. 资金紧张与破产危机诊断提示
 * 2. 经营自救指南 (调整定价、消化原料库存、撤回收纳折旧设备)
 * 3. 社区创业互助应急借款机制 (最高 ¥300，每日 3% 息，禁止无限借款)
 * 4. 借款偿还清算通道
 */

import React, { useState } from 'react';
import { StoreLoanState } from '../types/game';
import {
  assessStoreFinancialHealth,
  applyEmergencyLoan,
  repayEmergencyLoan,
} from '../game/engine/growthEngine';
import { playClickSound, playCoinSound } from '../game/audio/soundEffects';
import {
  AlertTriangle,
  ShieldAlert,
  Coins,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FinancialCrisisModalProps {
  isOpen: boolean;
  cash: number;
  loanState: StoreLoanState;
  currentDay: number;
  onClose: () => void;
  onUpdateLoanAndCash: (newLoan: StoreLoanState, newCash: number, note: string) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const FinancialCrisisModal: React.FC<FinancialCrisisModalProps> = ({
  isOpen,
  cash,
  loanState,
  currentDay,
  onClose,
  onUpdateLoanAndCash,
  showToast,
}) => {
  const [borrowAmount, setBorrowAmount] = useState<number>(150);
  const health = assessStoreFinancialHealth(cash);

  if (!isOpen) return null;

  // 申请借款
  const handleApplyLoan = () => {
    playCoinSound();
    const res = applyEmergencyLoan(loanState, cash, borrowAmount, currentDay);
    if (!res.success) {
      showToast(res.error || '借款失败', 'error');
      return;
    }
    onUpdateLoanAndCash(res.nextLoan, res.newCash, `申请社区应急经营救助金 ¥${borrowAmount}`);
    showToast(`成功到账应急救助金 ¥${borrowAmount}！请尽快改善经营，打烊时按日结算利息。`, 'success');
  };

  // 偿还借款
  const handleRepay = () => {
    playCoinSound();
    const res = repayEmergencyLoan(loanState, cash);
    if (!res.success) {
      showToast(res.error || '还款失败', 'error');
      return;
    }
    onUpdateLoanAndCash(res.nextLoan, res.newCash, `全额结清应急借款本息 ¥${res.totalPaid}`);
    showToast(`恭喜！已全额结清借款本息 ¥${res.totalPaid.toFixed(2)}，书咖信用优良！`, 'success');
  };

  const totalOwed = Math.round((loanState.principal + loanState.accumulatedInterest) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#1c1917] overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="p-4 sm:p-5 border-b-2 border-stone-900 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border-2 border-stone-900 flex items-center justify-center font-bold ${
              health.status === 'CRISIS' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-900'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-doodle tracking-wide text-stone-900">
                经营风险与财务自救
              </h2>
              <p className="text-xs text-stone-500">流动资金监控 · 危机恢复指引 · 应急经营贷款</p>
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

        {/* 主体诊断内容区 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-800">
          
          {/* 实时财务健康诊断卡 */}
          <div className={`p-4 rounded-xl border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917] space-y-2 ${
            health.status === 'CRISIS' ? 'bg-rose-50 text-rose-950' : 'bg-amber-50 text-amber-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{health.title}</span>
              </span>
              <span className="font-mono font-bold text-sm">
                当前资金: ¥{cash.toFixed(2)}
              </span>
            </div>

            <ul className="list-disc list-inside space-y-1 text-xs text-stone-700 pl-1 font-sans">
              {health.advice.map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>

          {/* 三条立竿见影的经营自救法则 */}
          <div className="p-4 bg-white border-2 border-stone-900 rounded-xl space-y-2 shadow-[2px_2px_0px_#1c1917]">
            <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>经营自救核心策略 (拒绝破产死局)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-[#FAF8F5] border border-stone-800 rounded-lg space-y-0.5">
                <span className="font-bold text-stone-900 block">1. 暂停原料采购</span>
                <p className="text-[11px] text-stone-600">
                  全力销售现有库存，将库存转化为现金流入，停止非必要采购支出。
                </p>
              </div>

              <div className="p-2.5 bg-[#FAF8F5] border border-stone-800 rounded-lg space-y-0.5">
                <span className="font-bold text-stone-900 block">2. 调整高毛利售价</span>
                <p className="text-[11px] text-stone-600">
                  将手冲咖啡与茶饮售价适度微调，快速积累每日毛利盈余。
                </p>
              </div>

              <div className="p-2.5 bg-[#FAF8F5] border border-stone-800 rounded-lg space-y-0.5">
                <span className="font-bold text-stone-900 block">3. 收纳高耗能设备</span>
                <p className="text-[11px] text-stone-600">
                  可在装修中将耗损维护费高的电热锅或冷藏台暂收回背包，省去每日维护费。
                </p>
              </div>
            </div>
          </div>

          {/* 社区创业互助应急借款 */}
          <div className="p-4 bg-white border-2 border-stone-900 rounded-xl space-y-3 shadow-[2px_2px_0px_#1c1917]">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-700" />
                  <span>社区青年创业互助应急借款</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  专为流动资金断裂危机设立 · 单次限额最高 ¥300 · 日利息 3% · 禁止无限借款
                </p>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded border border-stone-800 font-mono font-bold bg-stone-100">
                {loanState.hasActiveLoan ? '当前有贷款生效中' : '额度待申请'}
              </span>
            </div>

            {loanState.hasActiveLoan ? (
              <div className="p-3 bg-rose-50 border border-rose-900/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-700 font-bold">借款本金：¥{loanState.principal.toFixed(2)}</span>
                  <span className="text-rose-700 font-bold font-mono">
                    已累计利息：¥{loanState.accumulatedInterest.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-200">
                  <span className="font-bold text-stone-900">
                    应还本息合计：<strong className="text-base font-mono text-rose-800">¥{totalOwed.toFixed(2)}</strong>
                  </span>
                  <button
                    onClick={handleRepay}
                    disabled={cash < totalOwed}
                    className="doodle-btn px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white border-emerald-950 disabled:opacity-40"
                  >
                    全额还款清偿
                  </button>
                </div>
                {cash < totalOwed && (
                  <p className="text-[10px] text-stone-500">
                    还款需可用现金达到 ¥{totalOwed.toFixed(2)}。请先通过营业出餐积累资金。
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-stone-700">选择应急借款金额：</span>
                  <div className="flex items-center gap-2">
                    {[100, 200, 300].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          playClickSound();
                          setBorrowAmount(amt);
                        }}
                        className={`doodle-btn px-3 py-1 font-mono font-bold text-xs ${
                          borrowAmount === amt ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        ¥{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-500">
                    日息 3%（即每天打烊扣除 ¥{(borrowAmount * 0.03).toFixed(2)} 利息）
                  </span>
                  <button
                    onClick={handleApplyLoan}
                    className="doodle-btn doodle-btn-primary px-4 py-1.5 text-xs font-bold"
                  >
                    确认申请 ¥{borrowAmount}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 底部关闭栏 */}
        <div className="p-4 sm:p-5 border-t-2 border-stone-900 bg-white flex justify-end">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="doodle-btn px-5 py-2 text-xs font-bold text-stone-700"
          >
            返回店铺经营
          </button>
        </div>

      </div>
    </div>
  );
};
