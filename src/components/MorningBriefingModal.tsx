/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 晨间简报组件 (MorningBriefingModal)
 * 每日清晨开门前：
 * 1. 汇报当前可用现金与原料库存概览
 * 2. 预测今日天气与节假日客流特征 (晴天、小雨、阴天、大风暴雨、周末狂欢)
 * 3. 详细列出每日刚性固定支出预算 (豆哥房租水电日常 + 兰兰猫粮猫砂生活保障)
 * 4. 回顾昨日经营业绩与利润情况
 * 5. 豆哥与兰兰的清晨留言
 */

import React from 'react';
import {
  Sun,
  Coins,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  CloudSun,
  Heart,
  Home,
  AlertTriangle,
} from 'lucide-react';
import { GameSaveData } from '../types/game';
import { INITIAL_INGREDIENTS, DEFAULT_FIXED_COST_BREAKDOWN } from '../game/config/initialData';
import { playClickSound, playPageFlipSound } from '../game/audio/soundEffects';

interface MorningBriefingModalProps {
  gameState: GameSaveData;
  onProceedToPreparation: () => void;
  onTriggerEventModal?: () => void;
}

export const MorningBriefingModal: React.FC<MorningBriefingModalProps> = ({
  gameState,
  onProceedToPreparation,
  onTriggerEventModal,
}) => {
  const yesterdayReport = gameState.dailyReports[gameState.dailyReports.length - 1];
  const weather = gameState.weather;
  const fixedCost = DEFAULT_FIXED_COST_BREAKDOWN;

  // 计算库存紧张的原料数量 (存量 <= 2)
  const lowStockItems = Object.entries(gameState.inventory).filter(([id, count]) => {
    return count <= 2 && INITIAL_INGREDIENTS[id];
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="doodle-box w-full max-w-xl bg-[#FAF8F5] p-5 sm:p-6 space-y-3.5 shadow-[6px_6px_0px_#1c1917] border-2 border-stone-900 max-h-[92vh] overflow-y-auto">
        
        {/* 顶部标题与图标 */}
        <div className="flex items-center justify-between border-b-2 border-stone-900 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-stone-900 flex items-center justify-center text-amber-900 shadow-[2px_2px_0px_#1c1917]">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-doodle text-lg sm:text-xl font-bold text-stone-900">
                第 {gameState.currentDay} 天 · 晨间经营简报
              </h2>
              <p className="text-xs text-stone-500">晨光穿透书架，微风送来窗外清新的气息与墨香</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-stone-900">
            DAY {gameState.currentDay} · 晨光初现
          </span>
        </div>

        {/* 突发随机事件高优先级提醒条 */}
        {gameState.pendingRandomEvent && (
          <div className="p-3 bg-amber-100 border-2 border-stone-900 rounded-xl flex items-center justify-between shadow-[2px_2px_0px_#1c1917] animate-pulse">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-lg">{gameState.pendingRandomEvent.definition.icon}</span>
              <div>
                <span className="font-bold text-amber-950 block">
                  今日突发：{gameState.pendingRandomEvent.definition.title}
                </span>
                <span className="text-[11px] text-amber-800">
                  需要店长豆哥在开门前作出应对决策
                </span>
              </div>
            </div>
            {onTriggerEventModal && (
              <button
                onClick={() => {
                  playClickSound();
                  onTriggerEventModal();
                }}
                className="doodle-btn px-2.5 py-1 text-xs bg-amber-900 text-white font-bold"
              >
                立即处理
              </button>
            )}
          </div>
        )}

        {/* 1. 今日天气与客流特征预报 */}
        {weather && (
          <div className="p-3 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="text-2xl mt-0.5">{weather.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 font-doodle text-sm">
                    今日天气：{weather.name} ({weather.temperature}°C)
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                    weather.trafficMultiplier > 1.0
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                      : weather.trafficMultiplier < 1.0
                      ? 'bg-blue-100 text-blue-950 border-blue-400'
                      : 'bg-stone-100 text-stone-700 border-stone-300'
                  }`}>
                    客流预期 {weather.trafficMultiplier > 1.0 ? '+' : ''}{Math.round((weather.trafficMultiplier - 1.0) * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                  {weather.description}
                </p>
                {weather.patienceBonusSeconds !== 0 && (
                  <span className="text-[10px] text-blue-700 font-medium inline-block mt-0.5">
                    ⏱️ 顾客等待耐心 {weather.patienceBonusSeconds > 0 ? `+${weather.patienceBonusSeconds}秒` : `${weather.patienceBonusSeconds}秒`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 核心资产与财务速览 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Coins className="w-3.5 h-3.5 text-amber-700" />
              <span>当前营运现金</span>
            </div>
            <div className="text-xl font-bold font-mono text-stone-900">
              ¥{gameState.cash.toFixed(2)}
            </div>
          </div>

          <div className="p-3 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Package className="w-3.5 h-3.5 text-stone-700" />
              <span>库存原料状态</span>
            </div>
            <div className="text-sm font-bold text-stone-900">
              {lowStockItems.length > 0 ? (
                <span className="text-amber-800">{lowStockItems.length} 种原料告急</span>
              ) : (
                <span className="text-emerald-700">原料储备充足</span>
              )}
            </div>
            <div className="text-[11px] text-stone-400">
              共管理 {Object.keys(gameState.inventory).length} 项生鲜干货
            </div>
          </div>
        </div>

        {/* 3. 今日刚性固定成本预算 (加一部分固定支出：兰兰猫粮猫砂 + 豆哥房租水电日常) */}
        <div className="p-3 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-stone-900 border-b border-stone-200 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-stone-700" />
              <span>今日打烊刚性固定支出预算 (共计 ¥{fixedCost.total.toFixed(2)}/天)</span>
            </div>
            <span className="text-[10px] text-stone-400 font-normal">打烊时自动从营收扣减</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {/* 豆哥店面与生活开销 */}
            <div className="p-2 rounded-lg bg-[#FAF8F5] border border-stone-200 space-y-1">
              <div className="font-bold text-stone-800 flex items-center justify-between">
                <span>☕ 豆哥店面与日常生活</span>
                <span className="font-mono text-stone-900">
                  ¥{(fixedCost.rent + fixedCost.utilities + fixedCost.dougeLiving).toFixed(2)}/天
                </span>
              </div>
              <ul className="text-[10px] text-stone-500 space-y-0.5">
                <li>• 门面租金与商业物业: ¥{fixedCost.rent.toFixed(1)}</li>
                <li>• 水电暖燃气与千兆光纤: ¥{fixedCost.utilities.toFixed(1)}</li>
                <li>• 豆哥工作餐与生活杂费: ¥{fixedCost.dougeLiving.toFixed(1)}</li>
              </ul>
            </div>

            {/* 兰兰专属生活费 */}
            <div className="p-2 rounded-lg bg-[#FAF8F5] border border-stone-200 space-y-1">
              <div className="font-bold text-stone-800 flex items-center justify-between">
                <span>🐱 蓝猫兰兰品质养护</span>
                <span className="font-mono text-stone-900">
                  ¥{(fixedCost.catFood + fixedCost.catLitter + fixedCost.storeHygiene).toFixed(2)}/天
                </span>
              </div>
              <ul className="text-[10px] text-stone-500 space-y-0.5">
                <li>• 纯肉主食罐头与营养冻干: ¥{fixedCost.catFood.toFixed(1)}</li>
                <li>• 除臭豆腐猫砂与日常清洁: ¥{fixedCost.catLitter.toFixed(1)}</li>
                <li>• 店内常态消杀与绿植养护: ¥{fixedCost.storeHygiene.toFixed(1)}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. 昨日战报回顾 (若有) */}
        {yesterdayReport && (
          <div className="p-3 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-stone-800 border-b border-stone-200 pb-1.5">
              <span>昨日经营战报回顾 (第 {yesterdayReport.day} 天)</span>
              <div className="flex items-center gap-1">
                {yesterdayReport.netProfit >= 0 ? (
                  <span className="text-emerald-700 flex items-center font-mono">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    净利润 +¥{yesterdayReport.netProfit.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center font-mono">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    净亏损 -¥{Math.abs(yesterdayReport.netProfit).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono pt-0.5">
              <div>
                <span className="text-[10px] text-stone-500 block">营业总额</span>
                <span className="font-bold text-stone-900">¥{yesterdayReport.revenue.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">出餐成功</span>
                <span className="font-bold text-stone-900">{yesterdayReport.ordersServed} 单</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">缺料流失</span>
                <span className={`font-bold ${yesterdayReport.ordersLostStockOut > 0 ? 'text-amber-700' : 'text-stone-700'}`}>
                  {yesterdayReport.ordersLostStockOut} 单
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. 豆哥与兰兰晨间留言栏 */}
        <div className="space-y-1.5">
          <div className="p-2 bg-stone-100/70 border border-stone-400 rounded-lg text-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-stone-800 bg-white flex items-center justify-center font-bold text-stone-800 shrink-0 text-xs">
              ☕
            </div>
            <div className="text-[11px] text-stone-700 leading-tight">
              <strong>豆哥：</strong>
              <span>“今天的固定支出和房租已做好预算，只要合理定价、保障原料不缺货，咱们书咖就能稳步赚到钱！”</span>
            </div>
          </div>
          <div className="p-2 bg-stone-100/70 border border-stone-400 rounded-lg text-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-stone-800 bg-white flex items-center justify-center font-bold text-stone-800 shrink-0 text-xs">
              🐱
            </div>
            <div className="text-[11px] text-stone-700 leading-tight">
              <strong>兰兰：</strong>
              <span>“喵呜~ 刚刚吃完纯肉罐头，猫砂也干干净净！今天我也要在店里好好当个招财招客蓝猫～”</span>
            </div>
          </div>
        </div>

        {/* 底部跳转按钮 */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={() => {
              playPageFlipSound();
              onProceedToPreparation();
            }}
            className="w-full sm:w-auto doodle-btn doodle-btn-primary px-6 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span>进入经营准备 (采购原料与调整菜单)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
