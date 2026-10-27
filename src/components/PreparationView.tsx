/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 经营准备阶段视图 (PreparationView)
 * 职责：
 * 1. 原料手动采购（采购金额预估、剩余现金计算、防超上限、防透支）
 * 2. 菜单管理与价格制定（调整自定售价、在售开关、设备依赖检查、价格弹性意愿指示）
 * 3. 基础厨具与设备选购升级（投资性支出购置）
 * 4. 一键开门营业
 */

import React, { useState } from 'react';
import {
  Package,
  Coffee,
  Wrench,
  Play,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Coins,
  Grid,
  Users,
  Sliders,
  AlertOctagon,
} from 'lucide-react';
import { GameSaveData, MenuItem, EquipmentItem } from '../types/game';
import {
  INITIAL_INGREDIENTS,
  INITIAL_MENU_ITEMS,
  INITIAL_EQUIPMENT,
} from '../game/config/initialData';
import {
  calculateProductMargin,
  evaluatePurchaseWillingness,
  checkEquipmentRequirement,
  restockIngredient,
  purchaseEquipment,
} from '../game/engine/economy';
import { calculateStoreLayoutMetrics } from '../game/engine/layoutEngine';
import { RenovationView } from './RenovationView';
import { DouGeLifeView } from './DouGeLifeView';
import { LanLanLifeView } from './LanLanLifeView';
import { RegularCustomersView } from './RegularCustomersView';
import {
  checkAndTriggerDailyLifeEvent,
  acceptDailyLifeEvent,
  skipDailyLifeEvent,
} from '../game/engine/douGeLifeEngine';
import { playClickSound, playCoinSound, playPageFlipSound } from '../game/audio/soundEffects';

interface PreparationViewProps {
  gameState: GameSaveData;
  onUpdateState: (newState: GameSaveData) => void;
  onStartOperating: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onOpenAutoRestockModal?: () => void;
  onOpenCrisisModal?: () => void;
}

export const PreparationView: React.FC<PreparationViewProps> = ({
  gameState,
  onUpdateState,
  onStartOperating,
  showToast,
  onOpenAutoRestockModal,
  onOpenCrisisModal,
}) => {
  const [activePrepTab, setActivePrepTab] = useState<'PROCUREMENT' | 'MENU_PRICING' | 'EQUIPMENT' | 'RENOVATION' | 'DOUGE_LIFE' | 'LANLAN_LIFE' | 'REGULARS'>('MENU_PRICING');
  const layoutMetrics = calculateStoreLayoutMetrics(gameState.placedFurniture);

  // 采购单临时购物车计数器 (ingredientId -> 采购份数)
  const [procureCart, setProcureCart] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const key of Object.keys(INITIAL_INGREDIENTS)) {
      init[key] = 0;
    }
    return init;
  });

  // 计算当前采购清单的总开销与采购后预计剩余现金
  const totalProcureCost = Object.entries(procureCart).reduce((sum, [id, qty]) => {
    const ing = INITIAL_INGREDIENTS[id];
    return sum + (ing ? ing.costPrice * qty : 0);
  }, 0);
  const projectedRemainingCash = gameState.cash - totalProcureCost;

  // 调整采购数量
  const handleCartQtyChange = (ingredientId: string, delta: number) => {
    playClickSound();
    const current = procureCart[ingredientId] || 0;
    const ing = INITIAL_INGREDIENTS[ingredientId];
    if (!ing) return;

    const currentStock = gameState.inventory[ingredientId] || 0;
    const maxCanAdd = ing.maxStock - currentStock;

    const next = Math.max(0, Math.min(maxCanAdd, current + delta));
    setProcureCart({ ...procureCart, [ingredientId]: next });
  };

  // 确认执行采购
  const handleExecuteProcure = () => {
    const toBuy = Object.entries(procureCart).filter(([_, qty]) => qty > 0);
    if (toBuy.length === 0) {
      showToast('未选择任何采购原料数量', 'info');
      return;
    }

    if (totalProcureCost > gameState.cash) {
      showToast(`资金不足！本次采购需 ¥${totalProcureCost.toFixed(2)}，超出可用现金`, 'error');
      return;
    }

    let runningCash = gameState.cash;
    let runningInventory = { ...gameState.inventory };
    let successCount = 0;

    for (const [id, qty] of toBuy) {
      const res = restockIngredient(id, qty, runningCash, runningInventory, INITIAL_INGREDIENTS);
      if (res.success) {
        runningCash = res.newCash;
        runningInventory = res.newInventory;
        successCount++;
      } else {
        showToast(res.error || '部分原料采购失败', 'error');
        return;
      }
    }

    const updated: GameSaveData = {
      ...gameState,
      cash: runningCash,
      inventory: runningInventory,
      transactionHistory: [
        {
          id: `tx_${Date.now()}`,
          day: gameState.currentDay,
          type: 'EXPENSE',
          category: 'INGREDIENT_PROCUREMENT',
          amount: totalProcureCost,
          note: `晨间采购原料 ${toBuy.map(([id, q]) => `${INITIAL_INGREDIENTS[id]?.name}x${q}`).join(', ')}`,
          timestamp: Date.now(),
        },
        ...gameState.transactionHistory.slice(0, 19),
      ],
    };

    onUpdateState(updated);
    playCoinSound();
    showToast(`采购成功！进货 ${toBuy.length} 类原料，支出现金 ¥${totalProcureCost.toFixed(2)}`, 'success');
    
    // 重置购物车
    const cleared: Record<string, number> = {};
    for (const k of Object.keys(INITIAL_INGREDIENTS)) cleared[k] = 0;
    setProcureCart(cleared);
  };

  // 切换商品在售状态
  const handleToggleOnSale = (item: MenuItem) => {
    playClickSound();
    const isCurrentlyOnSale = gameState.menuOnSale[item.id] ?? false;
    
    // 如果想要开启在售，必须检查所需设备是否已拥有
    if (!isCurrentlyOnSale) {
      const eqCheck = checkEquipmentRequirement(item, gameState.ownedEquipment);
      if (!eqCheck.satisfied) {
        const eqName = INITIAL_EQUIPMENT[eqCheck.requiredEquipmentId]?.name || eqCheck.requiredEquipmentId;
        showToast(`尚未购置【${eqName}】，无法上架 ${item.name}！请先前往“设备升级”选购。`, 'error');
        return;
      }
    }

    const nextOnSale = !isCurrentlyOnSale;
    const updated: GameSaveData = {
      ...gameState,
      menuOnSale: {
        ...gameState.menuOnSale,
        [item.id]: nextOnSale,
      },
    };
    onUpdateState(updated);
    showToast(`${item.name} 已${nextOnSale ? '开启在售' : '暂停在售'}`, 'info');
  };

  // 调整商品自定售价
  const handlePriceChange = (item: MenuItem, delta: number) => {
    playClickSound();
    const currentPrice = gameState.customPricing[item.id] ?? item.basePrice;
    const newPrice = Math.max(item.minPrice, Math.min(item.maxPrice, Math.round((currentPrice + delta) * 10) / 10));

    const updated: GameSaveData = {
      ...gameState,
      customPricing: {
        ...gameState.customPricing,
        [item.id]: newPrice,
      },
    };
    onUpdateState(updated);
  };

  // 购买设备 (投资性资本支出)
  const handleBuyEquipment = (eq: EquipmentItem) => {
    playClickSound();
    const res = purchaseEquipment(eq.id, gameState.cash, gameState.ownedEquipment, INITIAL_EQUIPMENT);
    if (!res.success) {
      showToast(res.error || '购置失败', 'error');
      return;
    }

    // 映射对应家具工作台
    const stationMap: Record<string, string> = {
      electric_cooker: 'electric_cooker_station',
      saute_stove: 'saute_stove_station',
      cold_prep_counter: 'cold_prep_counter_station',
    };
    const stationId = stationMap[eq.id];
    let nextStoredFurniture = [...gameState.storedFurniture];
    const isAlreadyPlaced = gameState.placedFurniture.some((p) => p.furnitureId === stationId);
    if (stationId && !isAlreadyPlaced && !nextStoredFurniture.includes(stationId)) {
      nextStoredFurniture.push(stationId);
    }

    const updated: GameSaveData = {
      ...gameState,
      cash: res.newCash,
      ownedEquipment: res.newOwnedEquipment,
      storedFurniture: nextStoredFurniture,
      reputation: gameState.reputation + eq.reputationBonus,
      transactionHistory: [
        {
          id: `capex_${Date.now()}`,
          day: gameState.currentDay,
          type: 'EXPENSE',
          category: 'EQUIPMENT_CAPEX',
          amount: res.purchaseCost,
          note: `购置店铺设备【${eq.name}】`,
          timestamp: Date.now(),
        },
        ...gameState.transactionHistory.slice(0, 19),
      ],
    };
    onUpdateState(updated);
    playCoinSound();
    showToast(`恭喜！成功购置【${eq.name}】，声誉 +${eq.reputationBonus}！可在“店铺装修”中将工作台摆放进店内。`, 'success');
  };

  // 检查当前至少有一种商品在售且设备齐全
  const onSaleItemsCount = Object.values(INITIAL_MENU_ITEMS).filter((item) => {
    const onSale = gameState.menuOnSale[item.id] ?? false;
    const eqCheck = checkEquipmentRequirement(item, gameState.ownedEquipment);
    return onSale && eqCheck.satisfied;
  }).length;

  return (
    <div className="space-y-4">
      
      {/* 准备阶段顶部横幅 */}
      <div className="doodle-box p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-doodle text-lg sm:text-xl font-bold text-stone-900">
              经营准备 · 第 {gameState.currentDay} 天
            </span>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-md border border-stone-800">
              备货与定价
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            检查 6 类商品的在售状态与价格弹性，采购充足原材料，备妥后点击开门营业。
          </p>
        </div>

        {/* 开始营业按钮 */}
        <button
          onClick={() => {
            if (onSaleItemsCount === 0) {
              showToast('请至少在菜单中开启一款在售商品！', 'error');
              return;
            }
            playPageFlipSound();
            onStartOperating();
          }}
          className="doodle-btn doodle-btn-primary px-5 py-2.5 text-sm flex items-center justify-center gap-2 self-stretch sm:self-auto shadow-[3px_3px_0px_#1c1917]"
        >
          <Play className="w-4 h-4 fill-white text-white" />
          <span className="font-bold">开门营业 (开始客流模拟)</span>
        </button>
      </div>

      {/* 豆哥今日日常低频偶发事件浮层 (完全可选、可跳过、无惩罚、绝不扣减营业资金) */}
      {(() => {
        const dailyEventCheck = checkAndTriggerDailyLifeEvent(gameState.douGe, gameState.currentDay);
        if (!dailyEventCheck.hasEvent || !dailyEventCheck.event) return null;
        const ev = dailyEventCheck.event;

        return (
          <div className="p-3 bg-amber-50/90 border-2 border-stone-900 rounded-xl shadow-[3px_3px_0px_#1c1917] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-stone-900 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">豆哥今日生活随笔: 【{ev.title}】</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-stone-400 font-mono">
                    +{ev.inspirationReward}灵感
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] mt-0.5 line-clamp-1">{ev.preview}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => {
                  const nextDouGe = acceptDailyLifeEvent(gameState.douGe, ev, gameState.currentDay);
                  onUpdateState({ ...gameState, douGe: nextDouGe });
                  setActivePrepTab('DOUGE_LIFE');
                  showToast(`已参与生活互动：${ev.actionText}，获得 ${ev.inspirationReward} 点灵感！`, 'success');
                }}
                className="doodle-btn doodle-btn-primary px-3 py-1 text-xs font-bold"
              >
                {ev.actionText}
              </button>
              <button
                onClick={() => {
                  const nextDouGe = skipDailyLifeEvent(gameState.douGe, gameState.currentDay);
                  onUpdateState({ ...gameState, douGe: nextDouGe });
                  showToast('已跳过今日生活事件，随时可在【豆哥日常】标签页回看', 'info');
                }}
                className="doodle-btn px-2.5 py-1 text-xs text-stone-500 hover:text-stone-900"
                title="完全跳过，无任何资金与体力惩罚"
              >
                稍后 / 跳过
              </button>
            </div>
          </div>
        );
      })()}

      {/* 准备阶段 Tab 选择器 */}
      <div className="flex border-2 border-stone-900 rounded-xl bg-white p-1 gap-1 shadow-[2px_2px_0px_#1c1917] text-xs sm:text-sm font-semibold flex-wrap">
        <button
          onClick={() => {
            playClickSound();
            setActivePrepTab('MENU_PRICING');
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-w-[130px] ${
            activePrepTab === 'MENU_PRICING' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>菜单与定价 ({onSaleItemsCount}款)</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActivePrepTab('PROCUREMENT');
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-w-[110px] ${
            activePrepTab === 'PROCUREMENT' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>原料采购</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActivePrepTab('EQUIPMENT');
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-w-[110px] ${
            activePrepTab === 'EQUIPMENT' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>设备选购 ({gameState.ownedEquipment.length})</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActivePrepTab('RENOVATION');
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-w-[130px] ${
            activePrepTab === 'RENOVATION' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>装修布局 ({layoutMetrics.totalSeatCapacity}座)</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActivePrepTab('DOUGE_LIFE');
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-w-[130px] ${
            activePrepTab === 'DOUGE_LIFE' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>豆哥日常 ({gameState.douGe.life.ownedNailIds.length}款甲)</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActivePrepTab('LANLAN_LIFE');
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-w-[120px] ${
            activePrepTab === 'LANLAN_LIFE' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span>🐱</span>
          <span>兰兰日常</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActivePrepTab('REGULARS');
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors min-w-[120px] ${
            activePrepTab === 'REGULARS' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>熟客档案</span>
        </button>
      </div>

      {/* TAB 1: 菜单与定价 */}
      {activePrepTab === 'MENU_PRICING' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50/70 border border-stone-900 rounded-xl text-xs text-stone-700 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>价格弹性提示：</strong>售价低于基准价时，顾客购买意愿高达 95%+；售价高于基准价时，顾客容易嫌贵走人（产生“嫌贵流失单”）。建议根据食材成本合理定价。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {Object.values(INITIAL_MENU_ITEMS).map((item) => {
              const customPrice = gameState.customPricing[item.id] ?? item.basePrice;
              const isOnSale = gameState.menuOnSale[item.id] ?? false;
              const eqCheck = checkEquipmentRequirement(item, gameState.ownedEquipment);
              const margin = calculateProductMargin(item, customPrice, INITIAL_INGREDIENTS);
              const willingness = evaluatePurchaseWillingness(item, customPrice);
              const requiredEq = INITIAL_EQUIPMENT[item.requiredEquipmentId];

              // 价格弹性标签样式
              const badgeStyles = {
                VERY_CHEAP: 'bg-emerald-100 text-emerald-900 border-emerald-400',
                FAIR: 'bg-blue-100 text-blue-900 border-blue-400',
                SLIGHTLY_EXPENSIVE: 'bg-amber-100 text-amber-900 border-amber-400',
                OVERPRICED: 'bg-rose-100 text-rose-900 border-rose-400',
              }[willingness.evaluation];

              const badgeTexts = {
                VERY_CHEAP: '超值实惠 (意向 98%)',
                FAIR: '公道合理 (意向 85%)',
                SLIGHTLY_EXPENSIVE: '略微溢价 (意向 50%)',
                OVERPRICED: '严重虚高 (顾客嫌贵)',
              }[willingness.evaluation];

              return (
                <div
                  key={item.id}
                  className={`doodle-box p-3.5 bg-white space-y-2.5 transition-opacity ${
                    !isOnSale ? 'opacity-70 bg-stone-50/80' : ''
                  }`}
                >
                  {/* 卡片头部 */}
                  <div className="flex items-start justify-between gap-2 border-b border-stone-200 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-stone-900">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded border border-stone-700 bg-stone-100">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>

                    {/* 在售状态切换按键 */}
                    <button
                      onClick={() => handleToggleOnSale(item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border-1.5 border-stone-900 transition-colors ${
                        isOnSale
                          ? 'bg-emerald-700 text-white shadow-[1.5px_1.5px_0px_#1c1917]'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isOnSale ? '在售中' : '已停售'}
                    </button>
                  </div>

                  {/* 设备检查状态 */}
                  <div className="text-xs">
                    {eqCheck.satisfied ? (
                      <span className="text-emerald-700 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已具备设备【{requiredEq?.name}】</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 text-[11px] flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>缺设备【{requiredEq?.name}】，请先购置安装</span>
                      </span>
                    )}
                  </div>

                  {/* 成本与毛利率指标栏 */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono p-1.5 bg-stone-50 rounded-lg border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 block">单份原料成本</span>
                      <span className="font-bold text-stone-900">¥{margin.unitCost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">单份毛利</span>
                      <span className="font-bold text-emerald-700">¥{margin.grossProfit.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">毛利率</span>
                      <span className="font-bold text-blue-700">{margin.grossMarginRate}%</span>
                    </div>
                  </div>

                  {/* 价格调整控件与价格弹性徽标 */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-600 font-semibold">自定售价:</span>
                      <button
                        onClick={() => handlePriceChange(item, -1.0)}
                        className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-stone-800 hover:bg-stone-100"
                        title="降价 1 元"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-base text-stone-900 w-14 text-center">
                        ¥{customPrice.toFixed(1)}
                      </span>
                      <button
                        onClick={() => handlePriceChange(item, 1.0)}
                        className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-stone-800 hover:bg-stone-100"
                        title="提价 1 元"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 购买意向 */}
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${badgeStyles}`}>
                      {badgeTexts}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 原料采购 */}
      {activePrepTab === 'PROCUREMENT' && (
        <div className="doodle-box p-4 bg-white space-y-4">
          
          {/* 自动补货与经营风险快捷功能条 */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl border border-stone-800 bg-stone-50 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${gameState.autoRestock.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
              <span className="font-bold text-stone-800">
                自动补货: {gameState.autoRestock.enabled ? `已启用 (每日预算 ¥${gameState.autoRestock.dailyBudget})` : '未开启 (手动采购中)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenAutoRestockModal && (
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenAutoRestockModal();
                  }}
                  className="doodle-btn px-3 py-1 text-xs font-bold flex items-center gap-1.5 bg-white"
                >
                  <Sliders className="w-3.5 h-3.5 text-stone-700" />
                  <span>配置智能自动补货</span>
                </button>
              )}
              {gameState.cash < 80 && onOpenCrisisModal && (
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenCrisisModal();
                  }}
                  className="doodle-btn px-2.5 py-1 text-xs font-bold flex items-center gap-1 bg-rose-50 text-rose-700 border-rose-800"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  <span>资金预警/应急援助</span>
                </button>
              )}
            </div>
          </div>

          {/* 采购总控与即时核算卡 */}
          <div className="p-3.5 bg-[#FAF8F5] border-2 border-stone-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#1c1917]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-stone-800" />
                <span className="font-bold text-sm text-stone-900">采购预算实时核算器</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-stone-500">当前可用现金: </span>
                  <span className="font-bold text-stone-900">¥{gameState.cash.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-stone-500">本次进货总额: </span>
                  <span className="font-bold text-rose-700">¥{totalProcureCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-stone-500">采购后预估剩余: </span>
                  <span className={`font-bold ${projectedRemainingCash < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    ¥{projectedRemainingCash.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleExecuteProcure}
              disabled={totalProcureCost <= 0 || projectedRemainingCash < 0}
              className="doodle-btn doodle-btn-primary px-5 py-2 text-xs flex items-center justify-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              <span>确认采购并入库 (扣除现金)</span>
            </button>
          </div>

          {/* 各原材料清单与增减器 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(INITIAL_INGREDIENTS).map((ing) => {
              const currentStock = gameState.inventory[ing.id] || 0;
              const cartQty = procureCart[ing.id] || 0;
              const isFull = currentStock + cartQty >= ing.maxStock;

              return (
                <div
                  key={ing.id}
                  className="p-3 rounded-xl border-1.5 border-stone-900 bg-white shadow-[1.5px_1.5px_0px_#1c1917] space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="font-bold text-stone-900">{ing.name}</div>
                      <div className="text-[11px] text-stone-500">
                        采购单价: ¥{ing.costPrice.toFixed(2)} / {ing.unit}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-stone-500 text-[10px]">当前库存 / 上限</div>
                      <div className="font-bold text-stone-900">
                        {currentStock} / {ing.maxStock} {ing.unit}
                      </div>
                    </div>
                  </div>

                  {/* 进度条展示库存占用 */}
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-stone-900 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((currentStock + cartQty) / ing.maxStock) * 100)}%` }}
                    />
                  </div>

                  {/* 采购份数调节 */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-500">
                      小计: ¥{(cartQty * ing.costPrice).toFixed(2)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCartQtyChange(ing.id, -5)}
                        className="px-1.5 py-0.5 rounded border border-stone-800 bg-stone-100 font-bold text-[10px]"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleCartQtyChange(ing.id, -1)}
                        className="w-5 h-5 rounded border border-stone-800 bg-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm">
                        +{cartQty}
                      </span>
                      <button
                        onClick={() => handleCartQtyChange(ing.id, 1)}
                        disabled={isFull}
                        className="w-5 h-5 rounded border border-stone-800 bg-white flex items-center justify-center font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleCartQtyChange(ing.id, 5)}
                        disabled={isFull}
                        className="px-1.5 py-0.5 rounded border border-stone-800 bg-stone-100 font-bold text-[10px] disabled:opacity-30"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 3: 设备选购 */}
      {activePrepTab === 'EQUIPMENT' && (
        <div className="space-y-3">
          <div className="p-3 bg-stone-100 border border-stone-900 rounded-xl text-xs text-stone-700 flex items-start gap-2">
            <Wrench className="w-4 h-4 text-stone-800 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>资本性支出 (Capex) 规则：</strong>设备购置是一次性资产投资，扣除现金但不会计入当日日常经营消耗成本。设备购置后可解锁对应的正餐、热食与沙拉商品，并永久提升声誉与出餐速度。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(INITIAL_EQUIPMENT).map((eq) => {
              const isOwned = gameState.ownedEquipment.includes(eq.id);
              const canAfford = gameState.cash >= eq.purchaseCost;

              return (
                <div
                  key={eq.id}
                  className={`doodle-box p-3.5 bg-white space-y-2.5 flex flex-col justify-between ${
                    isOwned ? 'border-emerald-700 bg-emerald-50/20' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-900">{eq.name}</span>
                      {isOwned && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-bold rounded">
                          已在店内
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-normal">
                      {eq.description}
                    </p>

                    <div className="space-y-1 text-[11px] text-stone-600 font-mono pt-1">
                      <div>每日维护耗损: ¥{eq.dailyMaintenanceCost.toFixed(2)}/天</div>
                      {eq.speedBonus > 0 && <div className="text-emerald-700">制作提速: +{eq.speedBonus * 100}%</div>}
                      <div className="text-amber-800">声誉加成: +{eq.reputationBonus} 点</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    <div className="font-mono font-bold text-sm text-stone-900">
                      {eq.purchaseCost === 0 ? '初始自带' : `¥${eq.purchaseCost.toFixed(2)}`}
                    </div>

                    {!isOwned && (
                      <button
                        onClick={() => handleBuyEquipment(eq)}
                        disabled={!canAfford}
                        className="doodle-btn doodle-btn-primary px-3 py-1 text-xs"
                      >
                        {canAfford ? '购置安装' : '现金不足'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: 店铺装修与经营布局 */}
      {activePrepTab === 'RENOVATION' && (
        <RenovationView
          gameState={gameState}
          onUpdateState={onUpdateState}
          showToast={showToast}
        />
      )}

      {/* TAB 5: 豆哥日常生活系统 (穿戴甲、抓大鹅、动漫短剧、手账日记) */}
      {activePrepTab === 'DOUGE_LIFE' && (
        <DouGeLifeView
          gameState={gameState}
          onUpdateState={onUpdateState}
          showToast={showToast}
        />
      )}

      {/* TAB 6: 蓝猫兰兰自主生活系统 (睡觉、短跑、观察、玩毛球、拒绝被抱) */}
      {activePrepTab === 'LANLAN_LIFE' && (
        <LanLanLifeView
          gameState={gameState}
          onUpdateState={onUpdateState}
          showToast={showToast}
        />
      )}

      {/* TAB 7: 熟客档案与回忆故事 */}
      {activePrepTab === 'REGULARS' && (
        <RegularCustomersView
          regularCustomers={gameState.regularCustomers}
          currentDay={gameState.currentDay}
        />
      )}

    </div>
  );
};
