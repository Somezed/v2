/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 每日营业结算面板 (SettlementModal)
 * 职责：
 * 1. 严格展示利润表 (P&L): 营业收入 - 已消耗原料成本(COGS) - 固定费用 - 维护损耗 = 当日净利润
 * 2. 严谨勾稽现金流表 (Cash Flow): 期初现金 + 收入 - 采购付现 - 固定费用 - 设备投资 = 期末现金
 * 3. 统计客流、缺货流失、嫌贵流失
 * 4. 驱动进入下一经营日
 */

import React from 'react';
import {
  FileSpreadsheet,
  Coins,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { DailyReport, GameSaveData } from '../types/game';
import { playClickSound, playPageFlipSound, playCoinSound } from '../game/audio/soundEffects';

interface SettlementModalProps {
  report: DailyReport;
  onNextDay: () => void;
  onOpenEndings?: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  report,
  onNextDay,
  onOpenEndings,
}) => {
  const isProfitable = report.netProfit >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="doodle-box w-full max-w-2xl bg-[#FAF8F5] p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_#1c1917] border-2 border-stone-900 max-h-[92vh] overflow-y-auto">
        
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b-2 border-stone-900 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-doodle text-lg sm:text-xl font-bold text-stone-900">
                第 {report.day} 天 · 营业打烊日结账单
              </h2>
              <p className="text-xs text-stone-500">
                严格遵循独立经营核算准则 · 损益与现金流双重勾稽
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-900 bg-white font-mono text-xs font-bold shadow-[1px_1px_0px_#1c1917]">
            <Calendar className="w-3.5 h-3.5 text-stone-600" />
            <span>DAY {report.day} 终了</span>
          </div>
        </div>

        {/* 核心净利润大卡片 */}
        <div className={`p-4 rounded-xl border-2 border-stone-900 shadow-[3px_3px_0px_#1c1917] flex items-center justify-between ${
          isProfitable ? 'bg-emerald-50/80' : 'bg-rose-50/80'
        }`}>
          <div>
            <span className="text-xs font-bold text-stone-600 block">
              当日经营净利润 (P&L Net Profit)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl sm:text-3xl font-bold font-mono ${
                isProfitable ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                {isProfitable ? `+¥${report.netProfit.toFixed(2)}` : `-¥${Math.abs(report.netProfit).toFixed(2)}`}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                isProfitable ? 'bg-emerald-200 text-emerald-950 border-emerald-400' : 'bg-rose-200 text-rose-950 border-rose-400'
              }`}>
                {isProfitable ? '今日盈利' : '今日亏损'}
              </span>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-stone-600">
            <div>期末可用现金</div>
            <div className="text-lg font-bold text-stone-900 mt-0.5">
              ¥{report.closingCash.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 利润表 (P&L) 详实核算分解 */}
        <div className="p-3.5 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-2 text-xs">
          <div className="font-bold text-stone-900 border-b border-stone-200 pb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>经营损益表 (P&L - 经营成果)</span>
            </span>
            <span className="text-stone-400 font-normal text-[11px]">按出餐实际消耗与刚性开销核算</span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-stone-800">
              <span>(+) 销售总收入 (含餐品与小费)</span>
              <span className="font-bold text-emerald-700">+¥{report.revenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>(-) 已消耗原料成本 (COGS, 仅出餐消耗)</span>
              <span className="text-rose-700">-¥{report.consumedIngredientCost.toFixed(2)}</span>
            </div>
            
            {/* 固定经营费用与细项 */}
            <div className="border border-stone-200 rounded-lg p-2 bg-[#FAF8F5] space-y-1">
              <div className="flex justify-between items-center text-stone-900 font-bold">
                <span>(-) 每日刚性固定经营支出 (房租水电/兰兰猫粮猫砂)</span>
                <span className="text-rose-700">-¥{report.fixedOperatingCost.toFixed(2)}</span>
              </div>
              {report.fixedCostBreakdown && (
                <div className="text-[10px] text-stone-500 pl-2 space-y-0.5 border-l-2 border-stone-300">
                  <div className="flex justify-between">
                    <span>• 门面房租与物业管费</span>
                    <span>¥{report.fixedCostBreakdown.rent.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 商用水电能源与光纤宽带</span>
                    <span>¥{report.fixedCostBreakdown.utilities.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 豆哥日常餐饮与生活津贴</span>
                    <span>¥{report.fixedCostBreakdown.dougeLiving.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>• 兰兰纯肉主食罐头与营养冻干</span>
                    <span>¥{report.fixedCostBreakdown.catFood.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>• 兰兰除臭猫砂与眼耳护理</span>
                    <span>¥{report.fixedCostBreakdown.catLitter.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 店内常态消杀与绿植养护</span>
                    <span>¥{report.fixedCostBreakdown.storeHygiene.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-stone-700">
              <span>(-) 厨具设备损耗与维护折旧</span>
              <span className="text-rose-700">-¥{report.maintenanceCost.toFixed(2)}</span>
            </div>

            {(report.randomEventExpense || 0) > 0 && (
              <div className="flex justify-between items-center text-amber-900 bg-amber-50 p-1 rounded font-bold">
                <span>(-) 突发随机事件处置支出</span>
                <span className="text-rose-700">-¥{(report.randomEventExpense || 0).toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-stone-200 pt-1.5 flex justify-between items-center font-bold text-sm">
              <span className="text-stone-900">(=) 当日净利润</span>
              <span className={isProfitable ? 'text-emerald-800' : 'text-rose-800'}>
                {isProfitable ? '+' : ''}¥{report.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 现金流表 (Cash Flow) 与采购投资差异核算 */}
        <div className="p-3.5 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-2 text-xs">
          <div className="font-bold text-stone-900 border-b border-stone-200 pb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-700" />
              <span>现金流量表 (Cash Flow - 现金实际进出)</span>
            </span>
            <span className="text-stone-400 font-normal text-[11px]">采购不重复计入普通成本</span>
          </div>

          <div className="space-y-1.5 font-mono text-stone-700">
            <div className="flex justify-between items-center">
              <span>期初营运现金</span>
              <span className="font-bold text-stone-900">¥{report.openingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>(+) 今日现金收入入账</span>
              <span className="text-emerald-700">+¥{report.revenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>(-) 当日采购原料付现总额 (存货资产)</span>
              <span className="text-rose-700">-¥{report.procurementCashPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>(-) 刚性固定经营支出 (房租水电/猫粮猫砂)</span>
              <span className="text-rose-700">-¥{report.fixedOperatingCost.toFixed(2)}</span>
            </div>
            {report.equipmentCapexPaid > 0 && (
              <div className="flex justify-between items-center">
                <span>(-) 设备投资支出 (Capex 资产购置)</span>
                <span className="text-rose-700">-¥{report.equipmentCapexPaid.toFixed(2)}</span>
              </div>
            )}
            {(report.randomEventExpense || 0) > 0 && (
              <div className="flex justify-between items-center text-amber-900">
                <span>(-) 突发随机事件应急付现</span>
                <span className="text-rose-700">-¥{(report.randomEventExpense || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-stone-200 pt-1.5 flex justify-between items-center font-bold text-sm">
              <span className="text-stone-900">(=) 期末可用现金</span>
              <span className="text-stone-900 font-mono">¥{report.closingCash.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 客流、完成率与订单流失统计看板 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 bg-white border border-stone-900 rounded-lg shadow-[1px_1px_0px_#1c1917]">
            <span className="text-[10px] text-stone-500 block">订单完成率</span>
            <span className="font-bold text-emerald-800 text-sm mt-0.5 block font-mono">
              {report.completionRate ?? 100}%
            </span>
          </div>

          <div className="p-2.5 bg-white border border-stone-900 rounded-lg shadow-[1px_1px_0px_#1c1917]">
            <span className="text-[10px] text-stone-500 block">平均顾客满意度</span>
            <span className="font-bold text-blue-800 text-sm mt-0.5 block font-mono">
              {report.averageSatisfaction ?? 85} 分
            </span>
          </div>

          <div className="p-2.5 bg-white border border-stone-900 rounded-lg shadow-[1px_1px_0px_#1c1917]">
            <span className="text-[10px] text-stone-500 block">缺料 / 嫌贵流失</span>
            <span className={`font-bold text-sm mt-0.5 block font-mono ${
              (report.ordersLostStockOut + report.ordersLostHighPrice) > 0 ? 'text-amber-800' : 'text-stone-800'
            }`}>
              {(report.ordersLostStockOut || 0) + (report.ordersLostHighPrice || 0)} 单
            </span>
          </div>

          <div className="p-2.5 bg-white border border-stone-900 rounded-lg shadow-[1px_1px_0px_#1c1917]">
            <span className="text-[10px] text-stone-500 block">超时 / 主动取消</span>
            <span className={`font-bold text-sm mt-0.5 block font-mono ${
              (report.ordersLostTimeout + (report.ordersCancelled || 0)) > 0 ? 'text-rose-700' : 'text-stone-800'
            }`}>
              {(report.ordersLostTimeout || 0) + (report.ordersCancelled || 0)} 单
            </span>
          </div>
        </div>

        {/* 三大顾客类型满意度分项指标 */}
        {report.customerTypeStats && (
          <div className="p-3 bg-white border-2 border-stone-900 rounded-xl space-y-2 text-xs shadow-[2px_2px_0px_#1c1917]">
            <div className="font-bold text-stone-900 border-b border-stone-200 pb-1.5 flex items-center justify-between">
              <span>三大顾客客群接单与满意度剖析</span>
              <span className="text-[10px] text-stone-400">偏好与耐心差异</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-300">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>价格敏感型</span>
                  <span className="text-[10px] font-mono">{report.customerTypeStats.PRICE_SENSITIVE?.avgSatisfaction ?? 80}分</span>
                </div>
                <div className="text-[11px] text-emerald-900 mt-1 space-y-0.5 font-mono">
                  <div>到店意向: {report.customerTypeStats.PRICE_SENSITIVE?.arrived ?? 0} 人</div>
                  <div>出餐交付: {report.customerTypeStats.PRICE_SENSITIVE?.served ?? 0} 人</div>
                  <div>遗憾流失: {report.customerTypeStats.PRICE_SENSITIVE?.lost ?? 0} 人</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-purple-50/70 border border-purple-300">
                <div className="font-bold text-purple-950 flex items-center justify-between">
                  <span>品质追求型</span>
                  <span className="text-[10px] font-mono">{report.customerTypeStats.QUALITY_SEEKER?.avgSatisfaction ?? 85}分</span>
                </div>
                <div className="text-[11px] text-purple-900 mt-1 space-y-0.5 font-mono">
                  <div>到店意向: {report.customerTypeStats.QUALITY_SEEKER?.arrived ?? 0} 人</div>
                  <div>出餐交付: {report.customerTypeStats.QUALITY_SEEKER?.served ?? 0} 人</div>
                  <div>遗憾流失: {report.customerTypeStats.QUALITY_SEEKER?.lost ?? 0} 人</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-300">
                <div className="font-bold text-blue-950 flex items-center justify-between">
                  <span>阅读休闲型</span>
                  <span className="text-[10px] font-mono">{report.customerTypeStats.CASUAL_READER?.avgSatisfaction ?? 90}分</span>
                </div>
                <div className="text-[11px] text-blue-900 mt-1 space-y-0.5 font-mono">
                  <div>到店意向: {report.customerTypeStats.CASUAL_READER?.arrived ?? 0} 人</div>
                  <div>出餐交付: {report.customerTypeStats.CASUAL_READER?.served ?? 0} 人</div>
                  <div>遗憾流失: {report.customerTypeStats.CASUAL_READER?.lost ?? 0} 人</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 豆哥与兰兰打烊闲适时刻 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-stone-100/70 border border-stone-300 rounded-lg flex items-center gap-2 text-stone-700">
            <span className="text-base">☕</span>
            <span className="text-[11px] leading-tight">
              <strong>豆哥打烊随笔：</strong>“洗完手冲壶，终于可以窝在沙发上刷动漫短剧，再抓两把大鹅了！”
            </span>
          </div>
          <div className="p-2.5 bg-stone-100/70 border border-stone-300 rounded-lg flex items-center gap-2 text-stone-700">
            <span className="text-base">🐾</span>
            <span className="text-[11px] leading-tight">
              <strong>兰兰今日手账：</strong>“{report.catHappiestMoment || '在猫爬架顶层懒洋洋打哈欠，看着进进出出的客人们真热闹！'}”
            </span>
          </div>
        </div>

        {/* 底部进入下一天按钮 */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {onOpenEndings && (
            <button
              onClick={() => {
                playClickSound();
                onOpenEndings();
              }}
              className="w-full sm:w-auto doodle-btn px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-900 shadow-[2px_2px_0px_#1c1917]"
              title="查看经营终局倾向与全部结局演示"
            >
              <span>🏆 查看/演示经营终局</span>
            </button>
          )}

          <button
            onClick={() => {
              playPageFlipSound();
              onNextDay();
            }}
            className="w-full sm:w-auto doodle-btn doodle-btn-primary px-6 py-2.5 text-sm flex items-center justify-center gap-2 shadow-[3px_3px_0px_#1c1917] ml-auto"
          >
            <span>进入第 {report.day + 1} 经营日 (开启晨间简报)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
