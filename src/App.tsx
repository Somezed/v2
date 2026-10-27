/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》- 第一个可玩版本：经营闭环
 * 完整经营日流程：
 * 1. 晨间简报 (Morning Briefing)
 * 2. 经营准备 (Preparation: 手动采购、菜单选择、自定售价)
 * 3. 开始营业 (Operating: 顾客进店、价格弹性校验、库存扣减、豆哥出餐交付)
 * 4. 营业结算 (Settlement: 严谨核算损益表 P&L 与现金流量表 Cash Flow)
 * 5. 店铺发展 (进入下一经营日 / 设备购置)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Coffee,
  Coins,
  Heart,
  Volume2,
  VolumeX,
  FileText,
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Award,
  BookOpen,
  AlertTriangle,
  Sliders,
  Trophy,
} from 'lucide-react';

import {
  GameSaveData,
  DailyReport,
  CURRENT_SAVE_VERSION,
} from './types/game';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_INGREDIENTS,
  INITIAL_EQUIPMENT,
  DAILY_FIXED_OPERATING_COST,
  DEFAULT_FIXED_COST_BREAKDOWN,
} from './game/config/initialData';
import {
  calculateEquipmentMaintenance,
  compileDailySettlement,
} from './game/engine/economy';
import {
  loadGameFromStorage,
  saveGameToStorage,
  exportSaveToJSON,
  importSaveFromJSON,
  resetStorageGame,
} from './game/engine/saveManager';
import {
  executeAutoRestock,
  addStoreExp,
  accrueLoanDailyInterest,
  assessStoreFinancialHealth,
} from './game/engine/growthEngine';
import {
  generateDailyWeather,
} from './game/engine/weatherEngine';
import {
  evaluateDailyRandomEvent,
  resolveRandomEventChoice,
} from './game/engine/eventEngine';
import {
  playCoinSound,
  playPageFlipSound,
  playClickSound,
  setSoundMuted,
  getSoundMuted,
  startAmbience,
  stopAmbience,
} from './game/audio/soundEffects';

import { MorningBriefingModal } from './components/MorningBriefingModal';
import { PreparationView } from './components/PreparationView';
import { OperatingView } from './components/OperatingView';
import { SettlementModal } from './components/SettlementModal';
import { RulesSpecificationModal } from './components/RulesSpecificationModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { StoreGrowthModal } from './components/StoreGrowthModal';
import { AutoRestockModal } from './components/AutoRestockModal';
import { FinancialCrisisModal } from './components/FinancialCrisisModal';
import { LifeAlmanacModal } from './components/LifeAlmanacModal';
import { AmbienceSoundBar } from './components/AmbienceSoundBar';
import { RandomEventModal } from './components/RandomEventModal';
import { EndingsShowcaseModal } from './components/EndingsShowcaseModal';
import { EndingId, GAME_ENDINGS_CATALOG } from './game/config/endingData';
import { checkNaturalEndingTrigger } from './game/engine/endingEngine';

export default function App() {
  // 核心持久化游戏状态
  const [gameState, setGameState] = useState<GameSaveData>(() => {
    const { data } = loadGameFromStorage();
    return data;
  });

  // 当日营业前的期初现金与采购支出记录 (用于日结核对)
  const [dayOpeningCash, setDayOpeningCash] = useState<number>(gameState.cash);
  const [dayProcurementPaid, setDayProcurementPaid] = useState<number>(0);
  const [dayCapexPaid, setDayCapexPaid] = useState<number>(0);

  // 当日结算报告 (打烊时生成，支持刷新持久化还原)
  const [currentSettlementReport, setCurrentSettlementReport] = useState<DailyReport | null>(() => {
    if (gameState.dailyReports && gameState.dailyReports.length > 0) {
      return gameState.dailyReports[gameState.dailyReports.length - 1];
    }
    return null;
  });

  // 界面辅助状态
  const [isMuted, setIsMutedState] = useState<boolean>(getSoundMuted());
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showGrowthModal, setShowGrowthModal] = useState<boolean>(false);
  const [showAlmanacModal, setShowAlmanacModal] = useState<boolean>(false);
  const [showCrisisModal, setShowCrisisModal] = useState<boolean>(false);
  const [showAutoRestockModal, setShowAutoRestockModal] = useState<boolean>(false);
  const [showRandomEventModal, setShowRandomEventModal] = useState<boolean>(false);
  const [showEndingsModal, setShowEndingsModal] = useState<boolean>(false);
  const [initialEndingForModal, setInitialEndingForModal] = useState<EndingId | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 确保老存档天气与白噪声配置平滑初始就绪
  useEffect(() => {
    if (!gameState.weather) {
      const initWeather = generateDailyWeather(gameState.currentDay);
      updateGameState({
        ...gameState,
        weather: initWeather,
      });
    }
  }, []);

  // 导入文件引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 弹出轻提示
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 状态变更与自动本地持久化
  const updateGameState = (nextState: GameSaveData) => {
    setGameState(nextState);
    saveGameToStorage(nextState);
  };

  // 切换静音
  const toggleSound = () => {
    const next = !isMuted;
    setSoundMuted(next);
    setIsMutedState(next);
    if (!next) {
      playClickSound();
    }
    showToast(next ? '已开启静音' : '音效已开启', 'info');
  };

  // 从晨间简报进入经营准备
  const handleProceedToPreparation = () => {
    let nextCash = gameState.cash;
    let nextInventory = { ...gameState.inventory };
    let nextTxHistory = [...gameState.transactionHistory];
    let autoRestockNotice = '';

    // 检查并执行晨间智能自动补货 (遵守预算、物理上限、当前现金)
    if (gameState.autoRestock && gameState.autoRestock.enabled) {
      const hasDiscount = gameState.growth?.selectedSpecializations?.includes('SUPPLY_CHAIN_SAVVY') || false;
      const restockResult = executeAutoRestock(
        gameState.autoRestock,
        nextCash,
        nextInventory,
        INITIAL_INGREDIENTS,
        hasDiscount
      );
      if (restockResult.itemsPurchased.length > 0) {
        nextCash = restockResult.newCash;
        nextInventory = restockResult.newInventory;

        const purchasedDesc = restockResult.itemsPurchased
          .map((item) => `${item.name}x${item.quantity}`)
          .join(', ');

        nextTxHistory = [
          {
            id: `tx_auto_${Date.now()}`,
            day: gameState.currentDay,
            type: 'EXPENSE',
            category: 'INGREDIENT_PROCUREMENT',
            amount: restockResult.totalSpent,
            note: `晨间自动补货 ${purchasedDesc}`,
            timestamp: Date.now(),
          },
          ...nextTxHistory.slice(0, 19),
        ];

        const totalQty = restockResult.itemsPurchased.reduce((sum, item) => sum + item.quantity, 0);
        autoRestockNotice = `自动补货：已补进 ${totalQty} 份原料 (支出现金 ¥${restockResult.totalSpent.toFixed(2)})`;
      }
    }

    const nextState: GameSaveData = {
      ...gameState,
      cash: nextCash,
      inventory: nextInventory,
      transactionHistory: nextTxHistory,
      dailyPhase: 'PREPARATION',
    };
    // 锁定今日期初现金
    setDayOpeningCash(nextCash);
    setDayProcurementPaid(0);
    setDayCapexPaid(0);
    updateGameState(nextState);

    if (autoRestockNotice) {
      showToast(autoRestockNotice, 'success');
    }
  };

  // 从经营准备进入营业中
  const handleStartOperating = () => {
    // 精确从今日流水中分类统计采购支出与设备投资支出
    const todayTxs = gameState.transactionHistory.filter((t) => t.day === gameState.currentDay);
    const procPaid = todayTxs
      .filter((t) => t.category === 'INGREDIENT_PROCUREMENT')
      .reduce((sum, t) => sum + t.amount, 0);
    const capexPaid = todayTxs
      .filter((t) => t.category === 'EQUIPMENT_CAPEX')
      .reduce((sum, t) => sum + t.amount, 0);

    setDayProcurementPaid(procPaid);
    setDayCapexPaid(capexPaid);

    const nextState: GameSaveData = {
      ...gameState,
      dailyPhase: 'OPERATING',
    };
    updateGameState(nextState);
    showToast('书咖正式开门营业！顾客即将进店。', 'success');
  };

  // 营业结束处理并生成日结报告
  const handleFinishOperating = (summary: {
    revenue: number;
    consumedCost: number;
    servedCount: number;
    lostStockOut: number;
    lostHighPrice: number;
    lostTimeout: number;
    ordersCancelled: number;
    completionRate: number;
    averageSatisfaction: number;
    customerTypeStats: Record<import('./types/game').CustomerType, { arrived: number; served: number; avgSatisfaction: number; lost: number }>;
  }) => {
    // 设备维护折旧费
    const maintenanceCost = calculateEquipmentMaintenance(
      gameState.ownedEquipment,
      INITIAL_EQUIPMENT
    );

    // 严谨会计日结汇总 (P&L 损益表 + 现金流表)
    const eventPaidToday = gameState.pendingRandomEvent?.isResolved ? (gameState.pendingRandomEvent.costPaid || 0) : 0;
    const report = compileDailySettlement({
      day: gameState.currentDay,
      openingCash: dayOpeningCash,
      revenue: summary.revenue,
      consumedIngredientCost: summary.consumedCost,
      procurementCashPaid: dayProcurementPaid,
      fixedOperatingCost: DEFAULT_FIXED_COST_BREAKDOWN.total,
      fixedCostBreakdown: DEFAULT_FIXED_COST_BREAKDOWN,
      maintenanceCost,
      equipmentCapexPaid: dayCapexPaid,
      randomEventExpense: eventPaidToday,
      ordersAttempted: summary.servedCount + summary.lostStockOut + summary.lostHighPrice + summary.lostTimeout + summary.ordersCancelled,
      ordersServed: summary.servedCount,
      ordersLostStockOut: summary.lostStockOut,
      ordersLostHighPrice: summary.lostHighPrice,
      ordersLostTimeout: summary.lostTimeout,
      ordersCancelled: summary.ordersCancelled,
      completionRate: summary.completionRate,
      averageSatisfaction: summary.averageSatisfaction,
      customerTypeStats: summary.customerTypeStats,
      weather: gameState.weather,
      triggeredEvent: gameState.pendingRandomEvent || undefined,
      catHappiestMoment: (gameState.lanLan.mood ?? 85) >= 80 ? '在阳光斑驳的窗台享受顾客温柔的抚摸' : '蜷在猫窝里安睡',
    });

    // 增加声誉 (每成功出餐一单 +1 声誉)
    const updatedReputation = Math.min(1000, gameState.reputation + summary.servedCount);

    // 计算经营成长经验 (有效经营成长机制)
    const baseExp = summary.servedCount * 15;
    const completionBonus = summary.completionRate >= 0.8 ? 20 : 0;
    const satisfactionBonus = summary.averageSatisfaction >= 85 ? 25 : 0;
    const profitBonus = report.netProfit > 0 ? 15 : 0;
    const earnedExp = baseExp + completionBonus + satisfactionBonus + profitBonus;

    const growthResult = addStoreExp(gameState.growth, earnedExp);
    if (growthResult.didLevelUp) {
      showToast(`🎉 恭喜！书咖经营升级至 Lv.${growthResult.nextGrowth.level}！新商品与设施已解锁！`, 'success');
    }

    // 计算应急贷款计息 (每日 3% 息，不滚雪球借款)
    const updatedLoan = accrueLoanDailyInterest(gameState.loan);

    const nextState: GameSaveData = {
      ...gameState,
      cash: report.closingCash, // 严格保持账实相符
      reputation: updatedReputation,
      growth: growthResult.nextGrowth,
      loan: updatedLoan,
      dailyPhase: 'SETTLEMENT',
      dailyReports: [...gameState.dailyReports, report],
    };

    setCurrentSettlementReport(report);
    updateGameState(nextState);

    // 检查是否自然达成终局结局里程碑
    const naturalEnding = checkNaturalEndingTrigger(nextState);
    if (naturalEnding) {
      const naturalCfg = GAME_ENDINGS_CATALOG[naturalEnding];
      showToast(`🎉 书咖达成【${naturalCfg.title}】终章条件！点击顶部【终章结局】可举行通关典礼。`, 'success');
    }
  };

  // 一键载入终局世界存档进行体验
  const handleLoadEndingSave = (newSave: GameSaveData, endingTitle: string) => {
    updateGameState(newSave);
    setCurrentSettlementReport(null);
    setDayOpeningCash(newSave.cash);
    setDayProcurementPaid(0);
    setDayCapexPaid(0);
    showToast(`已成功载入【${endingTitle}】终局世界存档！尽情体验吧！`, 'success');
  };

  // 解决突发随机事件应对方案
  const handleResolveRandomEvent = (choiceId: string) => {
    if (!gameState.pendingRandomEvent) return;
    const { nextState, choice } = resolveRandomEventChoice(
      gameState,
      gameState.pendingRandomEvent,
      choiceId
    );
    updateGameState(nextState);
    setShowRandomEventModal(false);
    showToast(`已落实方案【${choice.label}】，实付应急金 ¥${choice.cost.toFixed(2)}`, 'info');
  };

  // 结算完成后进入下一经营日
  const handleProceedToNextDay = () => {
    const nextDay = gameState.currentDay + 1;
    const nextWeather = generateDailyWeather(nextDay);
    
    // 检查是否触发晨间随机突发事件 (适度频率，消耗资金，增强策略)
    const potentialEvent = evaluateDailyRandomEvent({
      ...gameState,
      currentDay: nextDay,
    });

    // 若白噪声设置了随天气联动且已开启
    if (gameState.ambience?.enabled && gameState.ambience?.autoSyncWeather && nextWeather.recommendedAmbience) {
      startAmbience(nextWeather.recommendedAmbience, gameState.ambience.volume);
    }

    const nextState: GameSaveData = {
      ...gameState,
      currentDay: nextDay,
      dailyPhase: 'MORNING_BRIEFING',
      weather: nextWeather,
      pendingRandomEvent: potentialEvent,
    };
    setCurrentSettlementReport(null);
    setDayOpeningCash(nextState.cash);
    setDayProcurementPaid(0);
    setDayCapexPaid(0);
    if (potentialEvent) {
      setShowRandomEventModal(true);
    }
    updateGameState(nextState);
    playPageFlipSound();
    showToast(`欢迎进入第 ${nextDay} 经营日！`, 'success');
  };

  // 导出 JSON 存档
  const handleExportJSON = () => {
    playCoinSound();
    const jsonStr = exportSaveToJSON(gameState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `douge_cat_cafe_day${gameState.currentDay}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('存档已成功导出至本地 JSON 文件', 'success');
  };

  // 触发导入 JSON
  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importSaveFromJSON(content);
      if (res.success && res.data) {
        updateGameState(res.data);
        showToast('外部 JSON 存档导入并验证成功！', 'success');
      } else {
        showToast(res.error || '导入失败', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 彻底重置游戏至第 1 天
  const handleConfirmReset = () => {
    const fresh = resetStorageGame();
    setGameState(fresh);
    setCurrentSettlementReport(null);
    setDayOpeningCash(fresh.cash);
    setDayProcurementPaid(0);
    setDayCapexPaid(0);
    setShowResetModal(false);
    showToast('已彻底重置为第 1 天初始状态（¥2,000 启动金）', 'info');
  };

  // 视口容器模拟宽度
  const viewModeStyles = {
    mobile: 'max-w-sm',
    tablet: 'max-w-2xl',
    desktop: 'max-w-5xl',
  }[viewMode];

  return (
    <div className="min-h-screen bg-[#FAF7F2] paper-pattern text-stone-900 pb-16 flex flex-col items-center select-none">
      
      {/* 隐藏的文件上传 input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* 消息提示浮层 */}
      {toastMessage && (
        <div
          className={`fixed top-4 z-50 px-4 py-2.5 rounded-xl border-2 border-stone-900 text-xs sm:text-sm font-bold shadow-[4px_4px_0px_#1c1917] animate-in fade-in slide-in-from-top-4 flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-100 text-emerald-950'
              : toastMessage.type === 'error'
              ? 'bg-rose-100 text-rose-950'
              : 'bg-white text-stone-900'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-700" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-700" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-stone-700" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 规范与路线图弹窗 */}
      <RulesSpecificationModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* 存档重置确认弹窗 */}
      <ResetConfirmModal
        isOpen={showResetModal}
        currentDay={gameState.currentDay}
        currentCash={gameState.cash}
        onClose={() => setShowResetModal(false)}
        onConfirmReset={handleConfirmReset}
        onExportBackup={handleExportJSON}
      />

      {/* 经营等级与里程碑专长弹窗 */}
      <StoreGrowthModal
        isOpen={showGrowthModal}
        growth={gameState.growth}
        onClose={() => setShowGrowthModal(false)}
        onUpdateGrowth={(newGrowth) => updateGameState({ ...gameState, growth: newGrowth })}
        showToast={showToast}
      />

      {/* 智能自动补货配置弹窗 */}
      <AutoRestockModal
        isOpen={showAutoRestockModal}
        config={gameState.autoRestock}
        currentCash={gameState.cash}
        currentInventory={gameState.inventory}
        onClose={() => setShowAutoRestockModal(false)}
        onSaveConfig={(newConfig) => {
          updateGameState({ ...gameState, autoRestock: newConfig });
          showToast('智能自动补货配置已更新并生效！', 'success');
        }}
        showToast={showToast}
      />

      {/* 经营风险与应急互助借款弹窗 */}
      <FinancialCrisisModal
        isOpen={showCrisisModal}
        cash={gameState.cash}
        loanState={gameState.loan}
        currentDay={gameState.currentDay}
        onClose={() => setShowCrisisModal(false)}
        onUpdateLoanAndCash={(newLoan, newCash, note) => {
          updateGameState({
            ...gameState,
            loan: newLoan,
            cash: newCash,
            transactionHistory: [
              {
                id: `tx_loan_${Date.now()}`,
                day: gameState.currentDay,
                type: note.includes('借款') ? 'INCOME' : 'EXPENSE',
                category: 'LOAN_AID',
                amount: Math.abs(newCash - gameState.cash),
                note,
                timestamp: Date.now(),
              },
              ...gameState.transactionHistory.slice(0, 19),
            ],
          });
        }}
        showToast={showToast}
      />

      {/* 生活总图鉴与长线收藏馆 */}
      <LifeAlmanacModal
        isOpen={showAlmanacModal}
        almanac={gameState.almanac}
        douGeLife={gameState.douGe.life}
        regularCustomers={gameState.regularCustomers}
        onClose={() => setShowAlmanacModal(false)}
      />

      {/* 终章结局演示中心与纪念馆 */}
      <EndingsShowcaseModal
        isOpen={showEndingsModal}
        gameState={gameState}
        initialEndingId={initialEndingForModal}
        onClose={() => {
          setShowEndingsModal(false);
          setInitialEndingForModal(null);
        }}
        onLoadEndingSave={handleLoadEndingSave}
        showToast={showToast}
      />

      {/* 突发随机经营事件应对决策弹窗 */}
      {showRandomEventModal && gameState.pendingRandomEvent && !gameState.pendingRandomEvent.isResolved && (
        <RandomEventModal
          event={gameState.pendingRandomEvent}
          currentCash={gameState.cash}
          onResolveChoice={handleResolveRandomEvent}
        />
      )}

      {/* 顶部全局状态栏 */}
      <header className="w-full bg-white border-b-2 border-stone-900 py-2 px-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo 与主标题 */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border-2 border-stone-900 bg-[#FAF7F2] flex items-center justify-center shadow-[1.5px_1.5px_0px_#1c1917]">
              <Coffee className="w-5 h-5 text-stone-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base sm:text-lg font-doodle tracking-wide">
                  豆哥的猫咪书咖
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded border border-stone-800 bg-stone-100 font-bold font-mono">
                  v{CURRENT_SAVE_VERSION}.0 闭环版
                </span>
              </div>
              <p className="text-[10px] text-stone-500 hidden sm:block">
                六类商品 · 价格弹性 · 严格COGS核算 · 真实库存经营
              </p>
            </div>
          </div>

          {/* 经营状态指标条 */}
          <div className="flex items-center gap-2 sm:gap-4 bg-[#FAF8F5] border-1.5 border-stone-900 px-3 py-1 rounded-xl text-xs shadow-[1.5px_1.5px_0px_#1c1917]">
            <div className="flex items-center gap-1">
              <span className="text-stone-500">营业日:</span>
              <span className="font-bold">第 {gameState.currentDay} 天</span>
            </div>
            <div className="w-px h-3 bg-stone-300" />
            <div className="flex items-center gap-1 text-emerald-800">
              <Coins className="w-3.5 h-3.5" />
              <span className="font-bold font-mono">¥{gameState.cash.toFixed(2)}</span>
            </div>
            <div className="w-px h-3 bg-stone-300" />
            <div className="flex items-center gap-1 text-amber-800">
              <Heart className="w-3.5 h-3.5" />
              <span className="font-bold">声誉 {gameState.reputation}</span>
            </div>
            <div className="w-px h-3 bg-stone-300" />
            <button
              onClick={() => {
                playClickSound();
                setShowGrowthModal(true);
              }}
              className="flex items-center gap-1 hover:bg-stone-200/60 px-1 py-0.5 rounded transition-colors text-stone-900"
              title="查看经营等级里程碑与专长"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold">Lv.{gameState.growth.level}</span>
            </button>
          </div>

          {/* 控制按钮集群 */}
          <div className="flex items-center gap-1.5">
            {/* 终章结局演示中心 */}
            <button
              onClick={() => {
                playClickSound();
                setInitialEndingForModal(null);
                setShowEndingsModal(true);
              }}
              className="doodle-btn px-2.5 py-1 text-xs flex items-center gap-1.5 font-bold bg-amber-100 text-amber-950 border-amber-900 shadow-[1.5px_1.5px_0px_#1c1917] hover:bg-amber-200 transition-colors"
              title="查看与演示玩到最后的6大终章结局"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-800" />
              <span>终章结局</span>
              <span className="text-[9px] px-1 bg-amber-300 rounded text-amber-900 font-mono hidden sm:inline">演示</span>
            </button>

            {/* 生活图鉴总馆 */}
            <button
              onClick={() => {
                playClickSound();
                setShowAlmanacModal(true);
              }}
              className="doodle-btn px-2.5 py-1 text-xs flex items-center gap-1 font-bold bg-white"
              title="查看书咖生活图鉴与长线收藏馆"
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-800" />
              <span className="hidden sm:inline">生活图鉴</span>
            </button>

            {/* 财务危机预警与应急借款 */}
            {(() => {
              const lastReport = gameState.dailyReports[gameState.dailyReports.length - 1];
              const lastProfit = lastReport ? lastReport.netProfit : 0;
              const finHealth = assessStoreFinancialHealth(gameState.cash, lastProfit);
              if (finHealth.status !== 'HEALTHY' || gameState.loan.hasActiveLoan) {
                return (
                  <button
                    onClick={() => {
                      playClickSound();
                      setShowCrisisModal(true);
                    }}
                    className={`doodle-btn px-2 py-1 text-xs flex items-center gap-1 font-bold ${
                      finHealth.status === 'CRISIS'
                        ? 'bg-rose-100 text-rose-900 border-rose-800 animate-pulse'
                        : 'bg-amber-100 text-amber-900 border-amber-800'
                    }`}
                    title="查看财务危机与应急借款援助"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{finHealth.status === 'CRISIS' ? '破产警报' : '资金紧张'}</span>
                  </button>
                );
              }
              return null;
            })()}

            {/* 视口设备切换 */}
            <div className="hidden md:flex items-center border border-stone-900 rounded-lg p-0.5 bg-stone-100">
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1 rounded ${viewMode === 'mobile' ? 'bg-white shadow-xs font-bold' : 'text-stone-500'}`}
                title="手机视口模拟"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`p-1 rounded ${viewMode === 'tablet' ? 'bg-white shadow-xs font-bold' : 'text-stone-500'}`}
                title="平板 iPad 视口模拟"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1 rounded ${viewMode === 'desktop' ? 'bg-white shadow-xs font-bold' : 'text-stone-500'}`}
                title="桌面 PC 视口"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 治愈系背景白噪声控制器 */}
            <AmbienceSoundBar
              currentType={gameState.ambience?.currentType || 'OFF'}
              volume={gameState.ambience?.volume ?? 0.28}
              autoSyncWeather={gameState.ambience?.autoSyncWeather ?? true}
              weather={gameState.weather}
              onUpdateAmbience={(cfg) => {
                updateGameState({
                  ...gameState,
                  ambience: cfg,
                });
              }}
              showToast={showToast}
            />

            {/* 音效开关 */}
            <button
              onClick={toggleSound}
              className="doodle-btn px-2 py-1 text-xs flex items-center gap-1"
              title={isMuted ? '开启音效' : '静音'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-stone-400" /> : <Volume2 className="w-3.5 h-3.5 text-stone-900" />}
            </button>

            {/* 存档备份与重置 */}
            <button
              onClick={handleExportJSON}
              className="doodle-btn px-2 py-1 text-xs"
              title="导出当前存档 JSON 备份"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleTriggerImport}
              className="doodle-btn px-2 py-1 text-xs"
              title="导入外部存档 JSON"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                playClickSound();
                setShowResetModal(true);
              }}
              className="doodle-btn px-2 py-1 text-xs text-rose-700 font-bold flex items-center gap-1 border-rose-900/60 hover:bg-rose-50"
              title="重置当前存档并重新开店"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">重置</span>
            </button>

            {/* 项目规范 */}
            <button
              onClick={() => {
                playClickSound();
                setShowRulesModal(true);
              }}
              className="doodle-btn doodle-btn-primary px-2.5 py-1 text-xs flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">规范与路线图</span>
            </button>
          </div>

        </div>
      </header>

      {/* 流程节点导览状态条 */}
      <div className="w-full bg-[#FAF8F5] border-b border-stone-200 py-1.5 px-4 text-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between font-mono">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-[11px] sm:text-xs">
            <span className={`px-2 py-0.5 rounded-full border ${
              gameState.dailyPhase === 'MORNING_BRIEFING' ? 'bg-stone-900 text-white font-bold border-stone-900' : 'bg-white text-stone-500 border-stone-300'
            }`}>
              1. 晨间简报
            </span>
            <span className="text-stone-300">→</span>
            <span className={`px-2 py-0.5 rounded-full border ${
              gameState.dailyPhase === 'PREPARATION' ? 'bg-stone-900 text-white font-bold border-stone-900' : 'bg-white text-stone-500 border-stone-300'
            }`}>
              2. 经营准备 (采购/定价)
            </span>
            <span className="text-stone-300">→</span>
            <span className={`px-2 py-0.5 rounded-full border ${
              gameState.dailyPhase === 'OPERATING' ? 'bg-stone-900 text-white font-bold border-stone-900' : 'bg-white text-stone-500 border-stone-300'
            }`}>
              3. 开始营业 (出餐接单)
            </span>
            <span className="text-stone-300">→</span>
            <span className={`px-2 py-0.5 rounded-full border ${
              gameState.dailyPhase === 'SETTLEMENT' ? 'bg-stone-900 text-white font-bold border-stone-900' : 'bg-white text-stone-500 border-stone-300'
            }`}>
              4. 打烊结算 (损益财报)
            </span>
          </div>

          <div className="text-[11px] text-stone-500 hidden md:block">
            固定成本: ¥{DEFAULT_FIXED_COST_BREAKDOWN.total.toFixed(0)}/天 (房租水电+兰兰口粮) · 离线不损耗
          </div>
        </div>
      </div>

      {/* 主体响应式视口容器 */}
      <main className={`w-full ${viewModeStyles} transition-all duration-300 p-3 sm:p-5 space-y-4`}>
        
        {/* 视口模拟提示条 */}
        {viewMode !== 'desktop' && (
          <div className="p-2 bg-stone-200/80 border border-stone-800 rounded-lg text-center text-xs text-stone-700 font-mono">
            📱 当前处于 [{viewMode === 'mobile' ? '手机端 375px' : '平板 iPad 768px'}] 视口模拟模式，验证移动端操作与自适应体验。
          </div>
        )}

        {/* 阶段 1：晨间简报模态窗 */}
        {gameState.dailyPhase === 'MORNING_BRIEFING' && (
          <MorningBriefingModal
            gameState={gameState}
            onProceedToPreparation={handleProceedToPreparation}
            onTriggerEventModal={() => setShowRandomEventModal(true)}
          />
        )}

        {/* 阶段 2：经营准备主界面 (采购、菜单与定价、设备升级、熟客、日常) */}
        {gameState.dailyPhase === 'PREPARATION' && (
          <PreparationView
            gameState={gameState}
            onUpdateState={updateGameState}
            onStartOperating={handleStartOperating}
            showToast={showToast}
            onOpenAutoRestockModal={() => setShowAutoRestockModal(true)}
            onOpenCrisisModal={() => setShowCrisisModal(true)}
          />
        )}

        {/* 阶段 3：开始营业现场模拟 (顾客到店、弹性校验、库存扣减、出餐) */}
        {gameState.dailyPhase === 'OPERATING' && (
          <OperatingView
            gameState={gameState}
            onUpdateState={updateGameState}
            onFinishOperating={handleFinishOperating}
            showToast={showToast}
          />
        )}

        {/* 阶段 4：打烊营业结算面板 (损益与现金流双重核算、进入下一日) */}
        {gameState.dailyPhase === 'SETTLEMENT' && (
          currentSettlementReport ? (
            <SettlementModal
              report={currentSettlementReport}
              onNextDay={handleProceedToNextDay}
              onOpenEndings={() => {
                setInitialEndingForModal(null);
                setShowEndingsModal(true);
              }}
            />
          ) : (
            <div className="doodle-box p-6 bg-white text-center space-y-3">
              <div className="font-bold text-stone-900 text-base">当日经营已打烊归档</div>
              <p className="text-xs text-stone-500">账单已妥善归档，点击下方按钮开启新的一天：</p>
              <button
                onClick={handleProceedToNextDay}
                className="doodle-btn doodle-btn-primary px-5 py-2 text-xs font-bold"
              >
                开启下一经营日
              </button>
            </div>
          )
        )}

      </main>

      {/* 底部持久化与存档快速操作栏 */}
      <footer className={`w-full ${viewModeStyles} transition-all duration-300 px-3 sm:px-5 pb-8`}>
        <div className="bg-white/90 border-2 border-stone-900 rounded-xl p-3 shadow-[2px_2px_0px_#1c1917] flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-stone-900 animate-pulse"></span>
            <span className="font-mono text-stone-700">存档自动同步至本地 (localStorage: douge_cat_cafe_save_v1)</span>
          </div>
          <div className="flex items-center gap-3 font-semibold">
            <button
              onClick={handleExportJSON}
              className="hover:underline text-stone-800 flex items-center gap-1"
              title="下载存档至本地文件"
            >
              <Download className="w-3.5 h-3.5" /> 导出 JSON
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={handleTriggerImport}
              className="hover:underline text-stone-800 flex items-center gap-1"
              title="导入外部 JSON 存档文件"
            >
              <Upload className="w-3.5 h-3.5" /> 导入存档
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={() => {
                playClickSound();
                setShowResetModal(true);
              }}
              className="hover:underline text-rose-700 flex items-center gap-1 font-bold"
              title="重置当前存档回到第 1 天"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 重置存档 (重开新档)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
