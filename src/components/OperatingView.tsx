/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 营业中主界面 (OperatingView) - 顾客、订单与排队调度系统
 * 核心功能：
 * 1. 三种顾客类型识别 (价格敏感型 / 品质追求型 / 阅读休闲型)
 * 2. 真实订单生命周期与设备独占队列推进 (FIFO + 设备占用)
 * 3. 动态耐心衰减条与实时满意度计算
 * 4. 玩家策略调度：插队优先、取消排队订单、推荐替代商品、暂停指定商品接单
 * 5. 暂停模式下支持全盘盘点与策略调整，再继续营业
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Pause,
  Play,
  FastForward,
  UserCheck,
  UserX,
  Coffee,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Sparkles,
  StopCircle,
  ArrowUp,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  Shield,
  Star,
  BookOpen,
  AlertCircle,
  Wrench,
  HeartHandshake,
  Armchair,
} from 'lucide-react';
import {
  GameSaveData,
  ActiveCustomerOrder,
  CustomerType,
  MenuItem,
} from '../types/game';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_INGREDIENTS,
  INITIAL_EQUIPMENT,
  CUSTOMER_ARCHETYPES,
  DAILY_FIXED_OPERATING_COST,
} from '../game/config/initialData';
import {
  generateIncomingCustomerOrder,
  tickOrderQueue,
  prioritizeOrder,
  cancelWaitingOrder,
  suggestAlternativeProduct,
  summarizeDayOrderStats,
} from '../game/engine/customerEngine';
import {
  calculateStoreLayoutMetrics,
  GRID_COLS,
  GRID_ROWS,
  ENTRANCE_TILE,
  FURNITURE_CATALOG,
} from '../game/engine/layoutEngine';
import {
  tickLanLanAutonomous,
  attemptHugLanLan,
  petLanLan,
  playWithYarnBall,
  getLanLanAtmosphereBonus,
} from '../game/engine/lanlanEngine';
import { createDefaultLanLanBehaviorState } from '../game/config/lanlanData';
import {
  recordRegularCustomerVisit,
  recordAlmanacCollectible,
} from '../game/engine/growthEngine';
import { DoodleDouGe } from './DoodleDouGe';
import { DoodleLanLan } from './DoodleLanLan';
import { DoodleFurnitureModel } from './DoodleFurnitureModel';
import { LanLanGridAvatar } from './LanLanGridAvatar';
import {
  playCoinSound,
  playPageFlipSound,
  playClickSound,
  playMeowSound,
  playCatMeowMood,
} from '../game/audio/soundEffects';

interface OperatingViewProps {
  gameState: GameSaveData;
  onUpdateState: (newState: GameSaveData) => void;
  onFinishOperating: (summary: {
    revenue: number;
    consumedCost: number;
    servedCount: number;
    lostStockOut: number;
    lostHighPrice: number;
    lostTimeout: number;
    ordersCancelled: number;
    completionRate: number;
    averageSatisfaction: number;
    customerTypeStats: Record<CustomerType, { arrived: number; served: number; avgSatisfaction: number; lost: number }>;
  }) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const OperatingView: React.FC<OperatingViewProps> = ({
  gameState,
  onUpdateState,
  onFinishOperating,
  showToast,
}) => {
  // 营业日时间进度 (0 ~ 100%)
  const [dayProgress, setDayProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x or 2x

  // 当日活动订单队列
  const [orders, setOrders] = useState<ActiveCustomerOrder[]>([]);
  // 当日所有产生过的历史订单（用于统计全天完成率与满意度）
  const [allDayOrders, setAllDayOrders] = useState<ActiveCustomerOrder[]>([]);

  // 财务与指标累计
  const [dayRevenue, setDayRevenue] = useState<number>(0);
  const [dayConsumedCost, setDayConsumedCost] = useState<number>(0);
  const [lostHighPriceCount, setLostHighPriceCount] = useState<number>(0);

  // 替代商品弹窗选择状态 (orderId -> boolean)
  const [substituteModalOrderId, setSubstituteModalOrderId] = useState<string | null>(null);

  // 场景视窗模式：吧台特写 (CLOSEUP) vs 书咖实景俯瞰 (FLOOR)
  const [sceneViewMode, setSceneViewMode] = useState<'CLOSEUP' | 'FLOOR'>('CLOSEUP');

  // 即时事件日志
  const [eventLogs, setEventLogs] = useState<{ id: string; time: string; text: string; type: 'success' | 'warn' | 'info' }[]>([]);

  // 引用最新状态
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // 计算当前店铺布局经营指标
  const layoutMetrics = calculateStoreLayoutMetrics(stateRef.current.placedFurniture);

  // 记录日志
  const addLog = (text: string, type: 'success' | 'warn' | 'info' = 'info') => {
    const hours = 9 + Math.floor((dayProgress / 100) * 12);
    const mins = Math.floor(((dayProgress % 8.33) / 8.33) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    setEventLogs((prev) => [
      { id: `${Date.now()}_${Math.random()}`, time: timeStr, text, type },
      ...prev.slice(0, 16),
    ]);
  };

  // 生成新顾客进店点单
  const triggerCustomerArrival = () => {
    // 真实客座容量约束：客座坐满后允许前台等位与外带排队，严重超额时才离开
    const seatLimit = layoutMetrics.totalSeatCapacity;
    if (orders.length >= seatLimit) {
      if (Math.random() < 0.42 && orders.length >= seatLimit + 3) {
        addLog(`店里客座已满 (${orders.length}/${seatLimit} 人)，新顾客在门外望见座无虚席遗憾离开！可在准备阶段添置更多客桌。`, 'warn');
        return;
      }
    }

    const res = generateIncomingCustomerOrder({
      menuOnSale: stateRef.current.menuOnSale,
      customPricing: stateRef.current.customPricing,
      ownedEquipment: layoutMetrics.activeEquipmentIds, // 只使用已摆放到店面的活跃设备
      pausedProducts: stateRef.current.pausedProducts || [],
      inventory: stateRef.current.inventory,
      currentTick: Math.floor(dayProgress),
      weatherPreferenceCategory: stateRef.current.weather?.preferredCategory,
      weatherPatienceBonus: stateRef.current.weather?.patienceBonusSeconds,
    });

    if (res.rejectedReason === 'PRICE_TOO_HIGH') {
      setLostHighPriceCount((prev) => prev + 1);
      addLog(`某位顾客走进展台看了一眼价格单，觉得太贵转身离开了！`, 'warn');
      return;
    }

    if (res.rejectedReason === 'PAUSED') {
      addLog(`顾客想要点的商品处于暂停接单状态，改看其他或离开。`, 'info');
      return;
    }

    if (res.order) {
      let newOrder = res.order;

      // 熟客光顾概率 (25%)
      const regulars = Object.values(stateRef.current.regularCustomers || {});
      const isRegularSpawn = regulars.length > 0 && Math.random() < 0.25;
      let regularLog = '';

      if (isRegularSpawn) {
        const pickedRegular = regulars[Math.floor(Math.random() * regulars.length)];
        newOrder = {
          ...newOrder,
          customer: {
            ...newOrder.customer,
            name: `${pickedRegular.name}(熟客)`,
            type: pickedRegular.archetype,
          },
        };
        regularLog = `熟客【${pickedRegular.name}】进店：“${pickedRegular.greetingDialogue}”`;
      }

      // 经营专长【亲和待客】：所有顾客基础等待耐心额外延长 3 秒
      if (stateRef.current.growth?.selectedSpecializations?.includes('HOSPITALITY_WARMTH')) {
        newOrder.patienceMaxSeconds += 3;
        newOrder.patienceRemainingSeconds += 3;
      }

      setOrders((prev) => [...prev, newOrder]);
      setAllDayOrders((prev) => [...prev, newOrder]);

      if (regularLog) {
        addLog(regularLog, 'success');
      }

      const typeLabel = {
        PRICE_SENSITIVE: '【价格敏感型】',
        QUALITY_SEEKER: '【品质追求型】',
        CASUAL_READER: '【阅读休闲型】',
      }[newOrder.customer.type];

      addLog(
        `顾客 ${newOrder.customer.name} ${typeLabel} 进店点单【${newOrder.productName}】¥${newOrder.price.toFixed(1)}，已安排座位排队！`,
        'info'
      );
    }
  };

  // 主营业时钟循环
  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 480 / simSpeed;
    const timer = setInterval(() => {
      setDayProgress((prev) => {
        const next = prev + 0.8;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }

        // 随机客流生成 (结合天气与节假日影响，晴天/节假日客流增加，极端雨天客流减少)
        const trafficMult = stateRef.current.weather?.trafficMultiplier ?? 1.0;
        const arrivalChance = Math.min(0.92, 0.60 * trafficMult);
        const maxQueueCapacity = Math.max(8, layoutMetrics.totalSeatCapacity + 4);
        if (Math.random() < arrivalChance && orders.length < maxQueueCapacity) {
          triggerCustomerArrival();
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, simSpeed, orders.length, layoutMetrics.totalSeatCapacity]);

  // 当日时间结束时自动打烊
  useEffect(() => {
    if (dayProgress >= 100) {
      handleFinalizeDay();
    }
  }, [dayProgress]);

  // 订单队列 Tick 驱动（每秒推进 0.5s 物理时间，模拟出餐与耐心消耗）
  useEffect(() => {
    if (isPaused) return;

    const queueTimer = setInterval(() => {
      if (orders.length === 0) return;

      const deltaSeconds = 0.5 * simSpeed;
      const tickRes = tickOrderQueue({
        orders,
        deltaSeconds,
        ownedEquipment: layoutMetrics.activeEquipmentIds, // 仅网格上摆放就绪的工作台可制作
        equipmentDb: INITIAL_EQUIPMENT,
        inventory: stateRef.current.inventory,
        lanLan: stateRef.current.lanLan,
        speedMultiplier: 1.0 + layoutMetrics.totalSpeedBonus, // 装修设施提供制作提速
      });

      // 处理出餐交付
      if (tickRes.deliveredOrders.length > 0) {
        let batchCashGain = 0;
        let batchCost = 0;

        for (const delivered of tickRes.deliveredOrders) {
          playCoinSound();

          // 阅读休闲型顾客享受书架与阅读座位舒适度加成
          if (delivered.customer.type === 'CASUAL_READER' && layoutMetrics.totalReadingBonus > 0) {
            const readingBonus = Math.floor(layoutMetrics.totalReadingBonus / 3);
            delivered.satisfactionScore = Math.min(100, delivered.satisfactionScore + readingBonus);
          }

      // 蓝猫兰兰治愈氛围与设施微加成
          if (stateRef.current.lanLan?.behavior) {
            const catAtmosphere = getLanLanAtmosphereBonus(stateRef.current.lanLan.behavior);
            delivered.satisfactionScore = Math.min(100, delivered.satisfactionScore + catAtmosphere.satisfactionBonus);
            if (Math.random() < catAtmosphere.tipChanceBonus) {
              delivered.tip += 1;
            }
          }

          const totalEarned = delivered.price + delivered.tip;
          batchCashGain += totalEarned;
          batchCost += delivered.unitCost;

          addLog(
            `出餐交付！【${delivered.productName}】交付给 ${delivered.customer.name}，入账 ¥${totalEarned.toFixed(1)} (满意度 ${delivered.satisfactionScore}分${delivered.tip > 0 ? `，小费 ¥${delivered.tip}` : ''})`,
            'success'
          );
        }

        setDayRevenue((r) => r + batchCashGain);
        setDayConsumedCost((c) => c + batchCost);

        // 同步更新所有已交付订单至历史记录 allDayOrders
        const deliveredIds = new Set(tickRes.deliveredOrders.map((d) => d.id));
        const deliveredMap = new Map(tickRes.deliveredOrders.map((d) => [d.id, d]));
        setAllDayOrders((prev) =>
          prev.map((o) => (deliveredIds.has(o.id) ? deliveredMap.get(o.id)! : o))
        );

        // 更新全局现金与出餐灵感
        const newCash = Math.round((stateRef.current.cash + batchCashGain) * 100) / 100;
        const inspirationGained = tickRes.deliveredOrders.length * 2;
        onUpdateState({
          ...stateRef.current,
          cash: newCash,
          inventory: tickRes.updatedInventory,
          douGe: {
            ...stateRef.current.douGe,
            life: {
              ...stateRef.current.douGe.life,
              inspirationPoints: stateRef.current.douGe.life.inspirationPoints + inspirationGained,
            },
          },
        });
      }

      // 处理耐心耗尽流失
      if (tickRes.lostTimeoutOrders.length > 0) {
        const timeoutIds = new Set(tickRes.lostTimeoutOrders.map((l) => l.id));
        const timeoutMap = new Map(tickRes.lostTimeoutOrders.map((l) => [l.id, l]));

        // 同步更新流失订单至历史记录 allDayOrders
        setAllDayOrders((prev) =>
          prev.map((o) => (timeoutIds.has(o.id) ? timeoutMap.get(o.id)! : o))
        );

        for (const lost of tickRes.lostTimeoutOrders) {
          addLog(
            `顾客 ${lost.customer.name} 等待时间过长，失去耐心生气离店！`,
            'warn'
          );
        }
      }

      // 同步库存与订单
      setOrders(tickRes.updatedOrders);
      // 同步全局库存
      if (JSON.stringify(tickRes.updatedInventory) !== JSON.stringify(stateRef.current.inventory)) {
        onUpdateState({
          ...stateRef.current,
          inventory: tickRes.updatedInventory,
        });
      }
    }, 450);

    return () => clearInterval(queueTimer);
  }, [isPaused, simSpeed, orders]);

  // 蓝猫兰兰自主生活驱动时钟 (仿生时钟推进，自然状态机演化)
  useEffect(() => {
    if (isPaused) return;

    const catTimer = setInterval(() => {
      const currentLanLan = stateRef.current.lanLan;
      const currentBehaviorState = currentLanLan?.behavior || createDefaultLanLanBehaviorState();
      const prevBehavior = currentBehaviorState.currentBehavior;

      const nextBehaviorState = tickLanLanAutonomous(
        currentBehaviorState,
        stateRef.current.placedFurniture,
        1 * simSpeed,
        { x: 1, y: 1 }
      );

      // 状态切换时在日志中记录猫咪生活
      if (nextBehaviorState.currentBehavior !== prevBehavior) {
        const catLogs: Record<string, string> = {
          SLEEPING: '🐱 兰兰蜷成一个圆圆的蓝灰色毛球，雷打不动地开始睡大觉 zZ',
          STRETCHING: '🐱 兰兰睡醒啦！前爪下压翘起屁股，伸了个大大的懒腰~',
          RESTING: '🐱 兰兰揣起小肉垫，大圆脸暗中观察客人们',
          WALKING: '🐱 兰兰迈着轻柔猫步在书咖领地巡视踱步',
          ZOOMING: '⚡ 嗖！兰兰突然毫无预兆起飞短跑，一阵蓝灰色小旋风掠过！',
          OBSERVING: '👀 兰兰突然刹车停下，圆圆的铜琥珀大眼好奇打量四周',
          APPROACHING: '❤️ 兰兰走到吧台，在豆哥裤腿边蹭蹭贴贴，发出呼噜声~',
          PLAYING_YARN: '🧶 兰兰发现了毛球玩具！举起粉嫩肉垫小爪爪啪啪拍打追击！',
        };
        const logMsg = catLogs[nextBehaviorState.currentBehavior];
        if (logMsg) {
          addLog(logMsg, 'info');
        }

        // 触发兰兰情绪叫声 (根据动作播放惬意、慵懒、欢快或傲娇声)
        if (nextBehaviorState.currentBehavior === 'APPROACHING') {
          playCatMeowMood('COZY');
        } else if (nextBehaviorState.currentBehavior === 'SLEEPING') {
          playCatMeowMood('LAZY');
        } else if (nextBehaviorState.currentBehavior === 'REFUSING_HUG') {
          playCatMeowMood('GRUMPY');
        } else if (nextBehaviorState.currentBehavior === 'ZOOMING' || Math.random() < 0.3) {
          playCatMeowMood('SWEET');
        }
      }

      onUpdateState({
        ...stateRef.current,
        lanLan: {
          ...currentLanLan,
          behavior: nextBehaviorState,
        },
      });
    }, 1000 / simSpeed);

    return () => clearInterval(catTimer);
  }, [isPaused, simSpeed]);

  // 玩家互动：抚摸兰兰下巴
  const handlePetLanLan = () => {
    const currentBehaviorState = stateRef.current.lanLan?.behavior || createDefaultLanLanBehaviorState();
    const { nextState, message } = petLanLan(currentBehaviorState);
    onUpdateState({
      ...stateRef.current,
      lanLan: {
        ...stateRef.current.lanLan,
        behavior: nextState,
      },
    });
    addLog(`抚摸互动：${message}`, 'success');
    showToast(message, 'info');
  };

  // 玩家互动：尝试抱起兰兰 (必定触发傲娇拒绝)
  const handleHugLanLan = () => {
    const currentBehaviorState = stateRef.current.lanLan?.behavior || createDefaultLanLanBehaviorState();
    const { nextState, message } = attemptHugLanLan(currentBehaviorState, stateRef.current.placedFurniture);
    onUpdateState({
      ...stateRef.current,
      lanLan: {
        ...stateRef.current.lanLan,
        behavior: nextState,
      },
    });
    addLog(`尝试抱抱：${message}`, 'warn');
    showToast(message, 'info');
  };

  // 玩家互动：推毛球给兰兰玩
  const handlePlayYarnLanLan = () => {
    const currentBehaviorState = stateRef.current.lanLan?.behavior || createDefaultLanLanBehaviorState();
    const { nextState, message } = playWithYarnBall(currentBehaviorState, stateRef.current.placedFurniture);
    onUpdateState({
      ...stateRef.current,
      lanLan: {
        ...stateRef.current.lanLan,
        behavior: nextState,
      },
    });
    addLog(`玩耍毛球：${message}`, 'success');
    showToast(message, 'info');
  };

  // 玩家操作：插队优先
  const handlePrioritize = (orderId: string) => {
    playClickSound();
    const res = prioritizeOrder(orders, orderId);
    if (res.success) {
      setOrders(res.newOrders);
      showToast('已将该订单优先插队至等待队列前列！', 'success');
    } else {
      showToast(res.error || '无法插队', 'error');
    }
  };

  // 玩家操作：主动取消等待中的订单
  const handleCancelOrder = (orderId: string) => {
    playClickSound();
    const res = cancelWaitingOrder(orders, orderId);
    if (res.success) {
      setOrders(res.newOrders);
      if (res.cancelledOrder) {
        // 更新历史记录为已取消
        setAllDayOrders((prev) =>
          prev.map((o) => (o.id === orderId ? res.cancelledOrder! : o))
        );
        addLog(`店长主动取消了顾客 ${res.cancelledOrder.customer.name} 的排队订单。`, 'info');
      }
      showToast('订单已取消，未扣减食材与产生收入', 'info');
    } else {
      showToast(res.error || '无法取消', 'error');
    }
  };

  // 玩家操作：打开替代商品选择器
  const handleOpenSubstitute = (orderId: string) => {
    playClickSound();
    setSubstituteModalOrderId(orderId);
  };

  // 玩家操作：执行推荐替代商品
  const handleConfirmSubstitute = (altProductId: string) => {
    if (!substituteModalOrderId) return;
    const res = suggestAlternativeProduct({
      orders,
      orderId: substituteModalOrderId,
      alternativeProductId: altProductId,
      inventory: stateRef.current.inventory,
      customPricing: stateRef.current.customPricing,
    });

    setOrders(res.newOrders);
    setSubstituteModalOrderId(null);

    if (res.accepted) {
      playPageFlipSound();
      showToast(res.message, 'success');
      addLog(res.message, 'success');
    } else {
      showToast(res.message, 'info');
      addLog(res.message, 'warn');
    }
  };

  // 玩家操作：切换某个商品的“暂停接单 / 恢复接单”
  const handleTogglePauseProduct = (productId: string) => {
    playClickSound();
    const currentPaused = stateRef.current.pausedProducts || [];
    const isPausedNow = currentPaused.includes(productId);
    const updatedPaused = isPausedNow
      ? currentPaused.filter((id) => id !== productId)
      : [...currentPaused, productId];

    const updated: GameSaveData = {
      ...stateRef.current,
      pausedProducts: updatedPaused,
    };
    onUpdateState(updated);
    const item = INITIAL_MENU_ITEMS[productId];
    showToast(
      isPausedNow
        ? `【${item?.name}】已恢复正常接单`
        : `【${item?.name}】已暂停接单，新顾客将不再点此菜品`,
      'info'
    );
  };

  // 打烊结算并汇总满意度
  const handleFinalizeDay = () => {
    playPageFlipSound();

    // 汇总当日所有订单结果
    const dayStats = summarizeDayOrderStats(allDayOrders);

    let servedCount = 0;
    let lostStockOutCount = 0;
    let lostTimeoutCount = 0;
    let cancelledCount = 0;

    for (const o of allDayOrders) {
      if (o.status === 'SERVED' || o.finalOutcome === 'DELIVERED') {
        servedCount++;
      } else if (o.finalOutcome === 'LOST_OUT_OF_STOCK' || o.status === 'OUT_OF_STOCK') {
        lostStockOutCount++;
      } else if (o.finalOutcome === 'LOST_TIMEOUT' || o.status === 'ABANDONED_PATIENCE') {
        lostTimeoutCount++;
      } else if (o.finalOutcome === 'CANCELLED_BY_PLAYER' || o.status === 'CANCELLED') {
        cancelledCount++;
      }
    }

    onFinishOperating({
      revenue: Math.round(dayRevenue * 100) / 100,
      consumedCost: Math.round(dayConsumedCost * 100) / 100,
      servedCount,
      lostStockOut: lostStockOutCount,
      lostHighPrice: lostHighPriceCount,
      lostTimeout: lostTimeoutCount,
      ordersCancelled: cancelledCount,
      completionRate: dayStats.completionRate,
      averageSatisfaction: dayStats.averageSatisfaction,
      customerTypeStats: dayStats.typeStats,
    });
  };

  // 统计当前已被正在制作 (IN_PROGRESS) 占用的设备，同时识别是否已在网格摆放
  const equipmentStatusMap: Record<string, { busy: boolean; orderName?: string; isPlaced: boolean }> = {};
  for (const eqId of stateRef.current.ownedEquipment) {
    const isPlaced = layoutMetrics.activeEquipmentIds.includes(eqId);
    equipmentStatusMap[eqId] = { busy: false, isPlaced };
  }
  for (const o of orders) {
    if (o.status === 'IN_PROGRESS' && equipmentStatusMap[o.requiredEquipmentId]) {
      equipmentStatusMap[o.requiredEquipmentId].busy = true;
      equipmentStatusMap[o.requiredEquipmentId].orderName = o.productName;
    }
  }

  // 计算当前虚拟经营时间点
  const currentHour = 9 + Math.floor((dayProgress / 100) * 12);
  const currentMinute = Math.floor(((dayProgress % 8.33) / 8.33) * 60);

  return (
    <div className="space-y-4">
      
      {/* 替代商品选择弹窗 */}
      {substituteModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
          <div className="doodle-box w-full max-w-md bg-white p-5 space-y-3.5 border-2 border-stone-900 shadow-[6px_6px_0px_#1c1917]">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-amber-700" />
                <span>为缺货订单推荐替代餐品</span>
              </h3>
              <button
                onClick={() => setSubstituteModalOrderId(null)}
                className="w-6 h-6 rounded border border-stone-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600">
              请选择一款店内库存充足的在售商品推荐给顾客，顾客将根据自身偏好决定是否改单：
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {Object.values(INITIAL_MENU_ITEMS).map((item) => {
                const onSale = stateRef.current.menuOnSale[item.id] ?? false;
                const hasEq = stateRef.current.ownedEquipment.includes(item.requiredEquipmentId);
                const price = stateRef.current.customPricing[item.id] ?? item.basePrice;

                return (
                  <button
                    key={item.id}
                    disabled={!onSale || !hasEq}
                    onClick={() => handleConfirmSubstitute(item.id)}
                    className="w-full text-left p-2.5 rounded-lg border border-stone-900 bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-between text-xs disabled:opacity-40"
                  >
                    <div>
                      <div className="font-bold text-stone-900">{item.name}</div>
                      <div className="text-[10px] text-stone-500">
                        售价: ¥{price.toFixed(1)} · 制作耗时 {item.prepTimeSeconds}s
                      </div>
                    </div>
                    <span className="doodle-btn px-2.5 py-1 text-[11px] bg-stone-900 text-white font-bold">
                      推荐此款
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSubstituteModalOrderId(null)}
                className="doodle-btn px-4 py-1.5 text-xs text-stone-600"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 营业时间与总控操作栏 */}
      <div className="doodle-box p-3.5 sm:p-4 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base font-doodle text-stone-900">
                营业进行中 · {currentHour.toString().padStart(2, '0')}:{currentMinute.toString().padStart(2, '0')}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  isPaused
                    ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                }`}
              >
                {isPaused ? '模拟已暂停 (可调整策略)' : '自动营业中'}
              </span>

              {gameState.weather && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border border-stone-800 bg-[#FAF8F5] text-stone-800 shadow-[1px_1px_0px_#1c1917]">
                  <span>{gameState.weather.icon}</span>
                  <span>{gameState.weather.name} ({gameState.weather.temperature}°C)</span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    客流{gameState.weather.trafficMultiplier > 1.0 ? '+' : ''}{Math.round((gameState.weather.trafficMultiplier - 1.0) * 100)}%
                  </span>
                </span>
              )}
            </div>
            {/* 时间进度条 */}
            <div className="w-48 sm:w-64 bg-stone-200 h-2 rounded-full overflow-hidden mt-1.5 border border-stone-800">
              <div
                className="bg-stone-900 h-full transition-all duration-300"
                style={{ width: `${dayProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 营业控制按键 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playClickSound();
              setIsPaused(!isPaused);
            }}
            className={`doodle-btn px-3 py-1.5 text-xs flex items-center gap-1 font-bold ${
              isPaused ? 'bg-amber-100 text-amber-950 border-amber-800' : ''
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span>{isPaused ? '继续营业' : '暂停整理'}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setSimSpeed(simSpeed === 1 ? 2 : 1);
            }}
            className={`doodle-btn px-2.5 py-1.5 text-xs flex items-center gap-1 font-mono font-bold ${
              simSpeed === 2 ? 'bg-stone-900 text-white' : ''
            }`}
            title="切换 1x / 2x 倍速"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{simSpeed}x</span>
          </button>

          <button
            onClick={handleFinalizeDay}
            className="doodle-btn doodle-btn-primary px-3 py-1.5 text-xs flex items-center gap-1 bg-rose-950 text-white border-rose-950"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>提前打烊</span>
          </button>
        </div>
      </div>

      {/* 实时营业指标仪表板 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 bg-white border-1.5 border-stone-900 rounded-xl shadow-[1.5px_1.5px_0px_#1c1917]">
          <span className="text-[10px] text-stone-500 block">今日实时销售额</span>
          <span className="font-mono font-bold text-base text-emerald-800">
            ¥{dayRevenue.toFixed(1)}
          </span>
        </div>

        <div className="p-2.5 bg-white border-1.5 border-stone-900 rounded-xl shadow-[1.5px_1.5px_0px_#1c1917]">
          <span className="text-[10px] text-stone-500 block">已消耗原料成本 (COGS)</span>
          <span className="font-mono font-bold text-base text-stone-800">
            ¥{dayConsumedCost.toFixed(1)}
          </span>
        </div>

        <div className="p-2.5 bg-white border-1.5 border-stone-900 rounded-xl shadow-[1.5px_1.5px_0px_#1c1917]">
          <span className="text-[10px] text-stone-500 block">客座占用 / 店内容量</span>
          <span className="font-mono font-bold text-base text-stone-900 flex items-center gap-1">
            <Armchair className="w-3.5 h-3.5 text-blue-600" />
            {orders.length} / {layoutMetrics.totalSeatCapacity} 座
          </span>
        </div>

        <div className="p-2.5 bg-white border-1.5 border-stone-900 rounded-xl shadow-[1.5px_1.5px_0px_#1c1917]">
          <span className="text-[10px] text-stone-500 block">嫌贵流失顾客</span>
          <span className="font-mono font-bold text-base text-rose-700 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5" />
            {lostHighPriceCount} 人
          </span>
        </div>
      </div>

      {/* 设备运行状态槽 (让设备能力约束与排队物理可见) */}
      <div className="doodle-box p-3 bg-white space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-stone-200 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-stone-700" />
            <span>后厨设备状态槽 (设备独占排队机制 · 布局提速 +{Math.round(layoutMetrics.totalSpeedBonus * 100)}%)</span>
          </div>
          <span className="text-[10px] text-stone-400 font-normal">
            同种设备同时只能制作 1 份餐品，超额将自动在队列中等候
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stateRef.current.ownedEquipment.map((eqId) => {
            const eq = INITIAL_EQUIPMENT[eqId];
            const status = equipmentStatusMap[eqId];
            if (!eq) return null;

            if (!status?.isPlaced) {
              return (
                <div
                  key={eqId}
                  className="px-2.5 py-1 rounded-lg border border-dashed border-stone-400 bg-stone-100 text-stone-400 text-xs flex items-center gap-2 font-mono"
                  title="未在店铺网格中摆放对应料理台，暂不可用"
                >
                  <span>{eq.name}:</span>
                  <span className="text-[10px] text-stone-500">未摆放到店面</span>
                </div>
              );
            }

            return (
              <div
                key={eqId}
                className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-2 font-mono ${
                  status?.busy
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                    : 'bg-stone-50 border-stone-300 text-stone-600'
                }`}
              >
                <span>{eq.name}:</span>
                {status?.busy ? (
                  <span className="text-amber-800 animate-pulse text-[11px]">
                    ● 制作中【{status.orderName}】
                  </span>
                ) : (
                  <span className="text-emerald-700 text-[11px]">○ 空闲待命</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 暂停接单控制条 */}
      <div className="doodle-box p-3 bg-[#FAF8F5] space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-stone-200 pb-1.5">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-700" />
            <span>菜品临时接单控制 (玩家可随时暂停指定餐品接单)</span>
          </div>
          <span className="text-[10px] text-stone-400 font-normal">点击切换接单状态</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {Object.values(INITIAL_MENU_ITEMS).map((item) => {
            const onSale = stateRef.current.menuOnSale[item.id] ?? false;
            const hasEq = stateRef.current.ownedEquipment.includes(item.requiredEquipmentId);
            if (!onSale || !hasEq) return null;

            const isPausedNow = (stateRef.current.pausedProducts || []).includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleTogglePauseProduct(item.id)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isPausedNow
                    ? 'bg-rose-100 text-rose-950 border-rose-400'
                    : 'bg-white text-stone-800 border-stone-900 shadow-[1px_1px_0px_#1c1917]'
                }`}
              >
                <span>{item.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isPausedNow ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isPausedNow ? '已暂停接单' : '接单中'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 主界面：左侧订单排队队列，右侧豆哥场景与营业事件日志 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* 左侧：订单与排队队列管理区 */}
        <div className="md:col-span-7 doodle-box p-4 bg-white space-y-3">
          
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-stone-900" />
              <span className="font-bold text-sm text-stone-900">
                实时顾客订单与排队队列 ({orders.length} 单)
              </span>
            </div>
            <span className="text-xs text-stone-400">先来先服务 · 支持插队调序</span>
          </div>

          {/* 订单卡片列表 */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {orders.length > 0 ? (
              orders.map((ord, idx) => {
                const isInProgress = ord.status === 'IN_PROGRESS';
                const isOutOfStock = ord.status === 'OUT_OF_STOCK';
                const patienceRatio = ord.patienceRemainingSeconds / ord.patienceMaxSeconds;

                // 顾客类型标识
                const customerTypeConfig = {
                  PRICE_SENSITIVE: {
                    badge: 'bg-emerald-100 text-emerald-900 border-emerald-400',
                    icon: <Shield className="w-3 h-3 text-emerald-700" />,
                    text: '价格敏感型',
                  },
                  QUALITY_SEEKER: {
                    badge: 'bg-purple-100 text-purple-900 border-purple-400',
                    icon: <Star className="w-3 h-3 text-purple-700" />,
                    text: '品质追求型',
                  },
                  CASUAL_READER: {
                    badge: 'bg-blue-100 text-blue-900 border-blue-400',
                    icon: <BookOpen className="w-3 h-3 text-blue-700" />,
                    text: '阅读休闲型',
                  },
                }[ord.customer.type];

                return (
                  <div
                    key={ord.id}
                    className={`p-3 rounded-xl border-2 border-stone-900 transition-all ${
                      isInProgress
                        ? 'bg-amber-50/80 shadow-[3px_3px_0px_#1c1917]'
                        : isOutOfStock
                        ? 'bg-rose-50/80 shadow-[2px_2px_0px_#1c1917]'
                        : 'bg-white shadow-[2px_2px_0px_#1c1917]'
                    }`}
                  >
                    {/* 卡片头部 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-stone-900">
                            #{idx + 1} {ord.customer.name}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full flex items-center gap-1 ${customerTypeConfig.badge}`}>
                            {customerTypeConfig.icon}
                            <span>{customerTypeConfig.text}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-600">
                          <span className="font-bold text-stone-900">{ord.productName}</span>
                          <span className="font-mono text-emerald-800 font-bold">¥{ord.price.toFixed(1)}</span>
                          {ord.alternativeOfferedFrom && (
                            <span className="text-[10px] px-1 bg-amber-200 text-amber-900 rounded">
                              原点: {ord.alternativeOfferedFrom}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 订单状态徽标 */}
                      <div>
                        {isInProgress ? (
                          <span className="px-2 py-0.8 bg-amber-200 text-amber-950 font-bold text-xs rounded-lg border border-stone-900 flex items-center gap-1 animate-pulse">
                            <Coffee className="w-3.5 h-3.5" />
                            制作中
                          </span>
                        ) : isOutOfStock ? (
                          <span className="px-2 py-0.8 bg-rose-200 text-rose-950 font-bold text-xs rounded-lg border border-stone-900 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            缺料挂起
                          </span>
                        ) : (
                          <span className="px-2 py-0.8 bg-stone-100 text-stone-700 font-bold text-xs rounded-lg border border-stone-400">
                            排队候机
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 制作中进度条 或 耐心衰减条 */}
                    <div className="mt-2 space-y-1">
                      {isInProgress ? (
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-600">
                            <span>烹饪制作进度</span>
                            <span className="font-bold">{Math.floor(ord.cookProgress)}%</span>
                          </div>
                          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden border border-stone-800 mt-0.5">
                            <div
                              className="bg-emerald-600 h-full transition-all duration-200"
                              style={{ width: `${ord.cookProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500">
                            <span>顾客剩余耐心</span>
                            <span className={patienceRatio < 0.3 ? 'text-rose-700 font-bold' : ''}>
                              {Math.max(0, Math.ceil(ord.patienceRemainingSeconds))}s / {ord.patienceMaxSeconds}s
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                            <div
                              className={`h-full transition-all duration-300 ${
                                patienceRatio > 0.5
                                  ? 'bg-emerald-600'
                                  : patienceRatio > 0.25
                                  ? 'bg-amber-500'
                                  : 'bg-rose-600'
                              }`}
                              style={{ width: `${patienceRatio * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 玩家管理操作栏 (插队 / 取消 / 推荐替代) */}
                    <div className="mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-stone-400 font-mono">
                        已等待 {Math.floor(ord.waitTimeElapsedSeconds)}s
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* 优先插队按键 */}
                        {!isInProgress && idx > 0 && (
                          <button
                            onClick={() => handlePrioritize(ord.id)}
                            className="doodle-btn px-2 py-0.5 text-[11px] flex items-center gap-1 bg-stone-100 hover:bg-stone-200"
                            title="将此订单优先插队至等待队列前列"
                          >
                            <ArrowUp className="w-3 h-3 text-stone-800" />
                            <span>优先制作</span>
                          </button>
                        )}

                        {/* 缺料替代按键 */}
                        {isOutOfStock && (
                          <button
                            onClick={() => handleOpenSubstitute(ord.id)}
                            className="doodle-btn px-2 py-0.5 text-[11px] flex items-center gap-1 bg-amber-100 text-amber-950 font-bold"
                            title="为缺货顾客推荐店内其他在售替代品"
                          >
                            <RefreshCw className="w-3 h-3 text-amber-800" />
                            <span>推荐替代</span>
                          </button>
                        )}

                        {/* 取消订单按键 */}
                        {!isInProgress && (
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="doodle-btn px-2 py-0.5 text-[11px] flex items-center gap-1 text-rose-700 hover:bg-rose-50"
                            title="取消此排队订单"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>取消订单</span>
                          </button>
                        )}

                        {isInProgress && (
                          <span className="text-[10px] text-stone-400 italic">
                            (制作中不可打断)
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-8 border-2 border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-400">
                当前暂无待办订单，豆哥正在收拾吧台，等待新顾客步入书咖...
              </div>
            )}
          </div>

        </div>

        {/* 右侧：豆哥与兰兰吧台现场 / 书咖全景走廊 + 营业事件流日志 */}
        <div className="md:col-span-5 doodle-box p-4 bg-white space-y-3 flex flex-col justify-between">
          
          <div className="space-y-3">
            {/* 视窗切换栏 */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-bold text-xs text-stone-900 font-doodle flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>书咖现场实景</span>
              </span>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-300 text-[11px] font-bold">
                <button
                  onClick={() => {
                    playClickSound();
                    setSceneViewMode('CLOSEUP');
                  }}
                  className={`px-2 py-0.5 rounded transition-all ${
                    sceneViewMode === 'CLOSEUP'
                      ? 'bg-white text-stone-900 border border-stone-800 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  吧台特写
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setSceneViewMode('FLOOR');
                  }}
                  className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                    sceneViewMode === 'FLOOR'
                      ? 'bg-white text-stone-900 border border-stone-800 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span>全景俯瞰</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </button>
              </div>
            </div>

            {/* 1. 吧台特写视窗 */}
            {sceneViewMode === 'CLOSEUP' ? (
              <div className="p-3.5 bg-[#FAF8F5] border-2 border-stone-900 rounded-xl flex items-center justify-around gap-2 relative overflow-hidden animate-in fade-in">
                <DoodleDouGe
                  action={orders.some((o) => o.status === 'IN_PROGRESS') ? 'BREWING' : 'IDLE'}
                  energy={gameState.douGe.energy}
                  mood={gameState.douGe.mood}
                  activeNailId={gameState.douGe.life.activeNailId}
                  showPhotoBadge={false}
                />

                <div className="flex flex-col items-center">
                  <DoodleLanLan
                    behaviorState={gameState.lanLan.behavior}
                    isPurring={gameState.lanLan.isPurring}
                    onPet={handlePetLanLan}
                    onAttemptHug={handleHugLanLan}
                    onPlayYarn={handlePlayYarnLanLan}
                    showPhotoBadge={false}
                  />
                  <span className="text-[10px] text-stone-600 font-sans mt-1">
                    {gameState.lanLan.behavior?.isNearDouGe
                      ? '🐱 正在豆哥脚边蹭蹭贴贴'
                      : gameState.lanLan.behavior?.currentBehavior === 'SLEEPING'
                      ? `🐱 睡懒觉中 · 累计 ${Math.round(gameState.lanLan.behavior?.dailySleepingMinutes ?? 0)} 分钟`
                      : `🐱 巡游中 · 坐标 (${gameState.lanLan.behavior?.position.x ?? 3}, ${gameState.lanLan.behavior?.position.y ?? 3})`}
                  </span>
                </div>
              </div>
            ) : (
              /* 2. 书咖全景走廊俯瞰视窗 (无外框方盒家具 + 兰兰动态走动形象) */
              <div className="p-2.5 bg-[#FAF8F5] border-2 border-stone-900 rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] text-stone-500 px-1 font-mono">
                  <span>8×6 店铺全景 · 兰兰自主生活中</span>
                  <span>点击猫咪可听专属情绪叫声</span>
                </div>

                <div className="grid grid-cols-8 gap-0.5 bg-white p-1 rounded-lg border border-stone-300 paper-pattern">
                  {Array.from({ length: GRID_ROWS }).map((_, y) =>
                    Array.from({ length: GRID_COLS }).map((_, x) => {
                      const placedAtTile = stateRef.current.placedFurniture.find(
                        (f) => f.x === x && f.y === y
                      );
                      const isLanLanHere =
                        gameState.lanLan?.behavior?.position?.x === x &&
                        gameState.lanLan?.behavior?.position?.y === y;
                      const isEntrance = ENTRANCE_TILE.x === x && ENTRANCE_TILE.y === y;
                      const isDouGeSpot = x === 1 && y === 1;

                      return (
                        <div
                          key={`mini_${x}_${y}`}
                          className="relative h-10 rounded transition-all flex items-center justify-center p-0.5 border border-transparent hover:bg-stone-100/40"
                        >
                          {/* 极简网格点 */}
                          <span className="absolute top-0.5 right-0.5 text-[6px] text-stone-200 pointer-events-none select-none">
                            {x},{y}
                          </span>

                          {/* 大门指示 */}
                          {isEntrance && (
                            <span className="text-[8px] font-bold text-stone-400 select-none pointer-events-none">
                              🚪门
                            </span>
                          )}

                          {/* 豆哥工作位指示 */}
                          {isDouGeSpot && !isLanLanHere && (
                            <span className="text-[7.5px] font-bold text-stone-800 bg-amber-100 px-0.5 rounded border border-stone-700 pointer-events-none">
                              ☕豆哥
                            </span>
                          )}

                          {/* 家具手绘线稿模型呈现 (无方框容器，自然摆放在地面上) */}
                          {placedAtTile && (
                            <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none">
                              <DoodleFurnitureModel
                                furnitureId={placedAtTile.furnitureId}
                                rotation={placedAtTile.rotation}
                                className="w-full h-7 drop-shadow-xs"
                                isAnchorTile={true}
                              />
                            </div>
                          )}

                          {/* 蓝猫兰兰根据自主行为动态展示的线稿 (无方盒) */}
                          {isLanLanHere && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
                              <LanLanGridAvatar
                                behavior={gameState.lanLan.behavior.currentBehavior}
                                facing={gameState.lanLan.behavior.facing}
                                dialogue={gameState.lanLan.behavior.dialogueBubble}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 实时营业事件流 */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                <span className="font-bold text-xs text-stone-900">店内实时营业事件流</span>
                <span className="text-[10px] text-stone-400">真实排队日志</span>
              </div>

              <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {eventLogs.length > 0 ? (
                  eventLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-lg text-xs border leading-relaxed flex items-start gap-2 ${
                        log.type === 'success'
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : log.type === 'warn'
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-stone-500 shrink-0 mt-0.5">
                        {log.time}
                      </span>
                      <span className="text-[11px]">{log.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-stone-400 text-xs">
                    书咖门铃清脆，晨光熹微，等待客人到访...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部经营提醒栏 */}
          <div className="p-2.5 bg-[#FAF8F5] border border-stone-800 rounded-lg text-[11px] text-stone-600 flex items-center justify-between">
            <span>固定成本: ¥{DAILY_FIXED_OPERATING_COST}/天</span>
            <span className="text-stone-500">按时交付可收获小费与好评</span>
          </div>

        </div>

      </div>

    </div>
  );
};
