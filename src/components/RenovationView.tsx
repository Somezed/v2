/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 店铺装修与经营布局视图 (RenovationView)
 * 职责：
 * 1. 8×6 网格可视化交互布局 (黑白简笔画风格，纯手绘质感线条与图标)
 * 2. 家具摆放、移动、四向旋转 (0° / 90° / 180° / 270°)、收纳与出售
 * 3. 实时碰撞检测与 BFS 寻路防堵死通道校验
 * 4. 实时经营影响反馈：客座容量、出餐加速、阅读舒适度加成、猫咪打盹点
 * 5. 家具专卖店与仓库背包管理
 */

import React, { useState } from 'react';
import {
  Grid,
  RotateCw,
  Move,
  Package,
  ShoppingBag,
  Trash2,
  CheckCircle,
  AlertCircle,
  Armchair,
  BookOpen,
  Coffee,
  Utensils,
  Sparkles,
  Info,
  DollarSign,
  Maximize2,
  Plus,
  Coins,
  ArrowRight,
  ShieldCheck,
  DoorOpen,
} from 'lucide-react';
import { DoodleFurnitureModel } from './DoodleFurnitureModel';
import { LanLanGridAvatar } from './LanLanGridAvatar';
import {
  GameSaveData,

  PlacedFurniture,
  FurnitureItem,
  FunctionalZone,
} from '../types/game';
import {
  GRID_COLS,
  GRID_ROWS,
  ENTRANCE_TILE,
  FURNITURE_CATALOG,
  getRotatedDimensions,
  validatePlacement,
  calculateStoreLayoutMetrics,
  buyFurnitureToStorage,
  sellFurnitureFromStorage,
} from '../game/engine/layoutEngine';
import { playClickSound, playCoinSound } from '../game/audio/soundEffects';

interface RenovationViewProps {
  gameState: GameSaveData;
  onUpdateState: (newState: GameSaveData) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const RenovationView: React.FC<RenovationViewProps> = ({
  gameState,
  onUpdateState,
  showToast,
}) => {
  // 当前选中的已摆放家具 instanceId
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // 待摆放模式：正在放置新家具或移动现有家具
  const [placingState, setPlacingState] = useState<{
    furnitureId: string;
    rotation: 0 | 90 | 180 | 270;
    source: 'SHOP' | 'STORAGE' | 'MOVE';
    movingInstanceId?: string;
  } | null>(null);

  // 悬停网格坐标 (用于动态实时预览与碰撞校验)
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);

  // 底部面板 Tab: 仓库背包 vs 家具商店
  const [activeBottomTab, setActiveBottomTab] = useState<'STORAGE' | 'SHOP'>('STORAGE');

  // 家具商店筛选分区
  const [shopZoneFilter, setShopZoneFilter] = useState<FunctionalZone | 'ALL'>('ALL');

  // 计算当前布局经营指标
  const metrics = calculateStoreLayoutMetrics(gameState.placedFurniture);

  // 旋转待放置或选中的家具
  const handleRotateCurrent = () => {
    playClickSound();
    if (placingState) {
      const nextRot = ((placingState.rotation + 90) % 360) as 0 | 90 | 180 | 270;
      setPlacingState({ ...placingState, rotation: nextRot });
    } else if (selectedInstanceId) {
      const item = gameState.placedFurniture.find((f) => f.instanceId === selectedInstanceId);
      if (!item) return;

      const nextRot = ((item.rotation + 90) % 360) as 0 | 90 | 180 | 270;
      const val = validatePlacement({
        furnitureId: item.furnitureId,
        x: item.x,
        y: item.y,
        rotation: nextRot,
        placedFurniture: gameState.placedFurniture,
        ignoreInstanceId: item.instanceId,
      });

      if (!val.valid) {
        showToast(val.error || '旋转后空间冲突', 'error');
        return;
      }

      const updated = gameState.placedFurniture.map((f) =>
        f.instanceId === selectedInstanceId ? { ...f, rotation: nextRot } : f
      );
      onUpdateState({ ...gameState, placedFurniture: updated });
      showToast('家具已旋转 90°', 'info');
    }
  };

  // 开始移动已摆放的家具
  const handleStartMove = (instanceId: string) => {
    playClickSound();
    const item = gameState.placedFurniture.find((f) => f.instanceId === instanceId);
    if (!item) return;

    setSelectedInstanceId(null);
    setPlacingState({
      furnitureId: item.furnitureId,
      rotation: item.rotation,
      source: 'MOVE',
      movingInstanceId: instanceId,
    });
    showToast('点击网格空位放置家具，或点击“旋转”调整方向', 'info');
  };

  // 将家具收纳到仓库背包
  const handleStoreFurniture = (instanceId: string) => {
    playClickSound();
    const item = gameState.placedFurniture.find((f) => f.instanceId === instanceId);
    if (!item) return;

    const catalogItem = FURNITURE_CATALOG[item.furnitureId];
    if (catalogItem && !catalogItem.canSell && (item.furnitureId === 'wood_order_counter' || item.furnitureId === 'pour_over_bar')) {
      showToast('点单收银台和手冲台是开业基础必需设施，建议保留摆放', 'info');
    }

    const nextPlaced = gameState.placedFurniture.filter((f) => f.instanceId !== instanceId);
    // 检查收纳后是否至少还有出入口通行
    const nextStorage = [...gameState.storedFurniture, item.furnitureId];

    setSelectedInstanceId(null);
    onUpdateState({
      ...gameState,
      placedFurniture: nextPlaced,
      storedFurniture: nextStorage,
    });
    showToast(`已将【${catalogItem?.name || '家具'}】收纳入背包`, 'success');
  };

  // 出售家具回收现金
  const handleSellFurniture = (instanceIdOrStorageId: string, fromStorage: boolean) => {
    playCoinSound();
    let furnitureIdToSell = '';

    if (fromStorage) {
      furnitureIdToSell = instanceIdOrStorageId;
      const res = sellFurnitureFromStorage(furnitureIdToSell, gameState.cash, gameState.storedFurniture);
      if (!res.success) {
        showToast(res.error || '出售失败', 'error');
        return;
      }
      onUpdateState({
        ...gameState,
        cash: res.newCash,
        storedFurniture: res.newStoredFurniture,
      });
      showToast(`已出售，回收资金 ¥${res.refund.toFixed(2)}`, 'success');
    } else {
      const placed = gameState.placedFurniture.find((f) => f.instanceId === instanceIdOrStorageId);
      if (!placed) return;
      furnitureIdToSell = placed.furnitureId;
      const catalogItem = FURNITURE_CATALOG[furnitureIdToSell];
      if (!catalogItem || !catalogItem.canSell) {
        showToast('该基础家具为非卖品', 'error');
        return;
      }

      const nextPlaced = gameState.placedFurniture.filter((f) => f.instanceId !== instanceIdOrStorageId);
      const refund = catalogItem.sellPrice;
      const newCash = Math.round((gameState.cash + refund) * 100) / 100;

      setSelectedInstanceId(null);
      onUpdateState({
        ...gameState,
        cash: newCash,
        placedFurniture: nextPlaced,
      });
      showToast(`已出售【${catalogItem.name}】，回收资金 ¥${refund.toFixed(2)}`, 'success');
    }
  };

  // 从仓库背包拿出家具准备摆放
  const handlePickFromStorage = (furnitureId: string, storageIndex: number) => {
    playClickSound();
    setSelectedInstanceId(null);
    setPlacingState({
      furnitureId,
      rotation: 0,
      source: 'STORAGE',
    });
    showToast('点击网格空位摆放家具', 'info');
  };

  // 在商店购买家具
  const handleBuyFromShop = (item: FurnitureItem) => {
    playCoinSound();
    const res = buyFurnitureToStorage(item.id, gameState.cash, gameState.storedFurniture);
    if (!res.success) {
      showToast(res.error || '购买失败', 'error');
      return;
    }

    onUpdateState({
      ...gameState,
      cash: res.newCash,
      storedFurniture: res.newStoredFurniture,
    });
    showToast(`成功购入【${item.name}】，已放入仓库背包！`, 'success');
  };

  // 点击网格单元格：摆放、移动落位或选中已有家具
  const handleTileClick = (x: number, y: number) => {
    playClickSound();

    // 1. 如果处于摆放/移动模式中
    if (placingState) {
      const val = validatePlacement({
        furnitureId: placingState.furnitureId,
        x,
        y,
        rotation: placingState.rotation,
        placedFurniture: gameState.placedFurniture,
        ignoreInstanceId: placingState.movingInstanceId,
      });

      if (!val.valid) {
        showToast(val.error || '该位置无法摆放', 'error');
        return;
      }

      if (placingState.source === 'MOVE' && placingState.movingInstanceId) {
        // 移动原家具至新位置
        const updated = gameState.placedFurniture.map((f) =>
          f.instanceId === placingState.movingInstanceId
            ? { ...f, x, y, rotation: placingState.rotation }
            : f
        );
        onUpdateState({ ...gameState, placedFurniture: updated });
        setSelectedInstanceId(placingState.movingInstanceId);
        setPlacingState(null);
        showToast('家具位置调整成功！', 'success');
      } else if (placingState.source === 'STORAGE') {
        // 从仓库中扣除一件，并添加到 placedFurniture
        const idx = gameState.storedFurniture.indexOf(placingState.furnitureId);
        const newStorage = [...gameState.storedFurniture];
        if (idx !== -1) newStorage.splice(idx, 1);

        const newInstance: PlacedFurniture = {
          instanceId: `inst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          furnitureId: placingState.furnitureId,
          x,
          y,
          rotation: placingState.rotation,
        };

        onUpdateState({
          ...gameState,
          placedFurniture: [...gameState.placedFurniture, newInstance],
          storedFurniture: newStorage,
        });
        setSelectedInstanceId(newInstance.instanceId);
        setPlacingState(null);
        showToast('家具摆放成功！', 'success');
      }
      return;
    }

    // 2. 正常浏览模式下：检查点击的格子上是否有家具
    const clickedItem = findFurnitureAtTile(x, y);
    if (clickedItem) {
      setSelectedInstanceId(clickedItem.instanceId);
    } else {
      setSelectedInstanceId(null);
    }
  };

  // 辅助函数：根据网格坐标查找占据该位置的家具
  const findFurnitureAtTile = (x: number, y: number): PlacedFurniture | null => {
    for (const placed of gameState.placedFurniture) {
      const catalogItem = FURNITURE_CATALOG[placed.furnitureId];
      if (!catalogItem) continue;
      const dims = getRotatedDimensions(catalogItem, placed.rotation);
      if (x >= placed.x && x < placed.x + dims.w && y >= placed.y && y < placed.y + dims.h) {
        return placed;
      }
    }
    return null;
  };

  // 计算当前悬停位置是否合法
  const hoverValidation = placingState && hoverTile
    ? validatePlacement({
        furnitureId: placingState.furnitureId,
        x: hoverTile.x,
        y: hoverTile.y,
        rotation: placingState.rotation,
        placedFurniture: gameState.placedFurniture,
        ignoreInstanceId: placingState.movingInstanceId,
      })
    : null;

  const selectedPlaced = gameState.placedFurniture.find((f) => f.instanceId === selectedInstanceId);
  const selectedCatalog = selectedPlaced ? FURNITURE_CATALOG[selectedPlaced.furnitureId] : null;

  return (
    <div className="space-y-4">
      {/* 头部经营指标加成 HUD */}
      <div className="doodle-box p-3 bg-white space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 border-2 border-stone-900 rounded-lg bg-stone-100">
              <Grid className="w-4 h-4 text-stone-900" />
            </span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                店铺空间网格与经营布局
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-stone-100 border border-stone-400 text-stone-600">
                  8×6 网格空间
                </span>
              </h3>
              <p className="text-[11px] text-stone-500">
                真实影响：座位直接决定店内同时容纳人数；设备激活菜单；书架提升阅读满意度；猫窝吸引兰兰。
              </p>
            </div>
          </div>

          {/* 实时经营数值反馈小卡片 */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-2.5 py-1 rounded-lg border-2 border-stone-900 bg-stone-50 flex items-center gap-1.5">
              <Armchair className="w-3.5 h-3.5 text-stone-700" />
              <span>客座容量: <strong>{metrics.totalSeatCapacity} 座</strong></span>
            </div>

            <div className="px-2.5 py-1 rounded-lg border-2 border-stone-900 bg-stone-50 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-stone-700" />
              <span>阅读加成: <strong>+{metrics.totalReadingBonus}分</strong></span>
            </div>

            <div className="px-2.5 py-1 rounded-lg border-2 border-stone-900 bg-stone-50 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-stone-700" />
              <span>猫咪活动点: <strong>{metrics.catSpots.length} 处</strong></span>
            </div>
          </div>
        </div>

        {/* 摆放操作提示 / 控制条 */}
        {placingState ? (
          <div className="p-2.5 bg-stone-100 border-2 border-stone-900 rounded-lg flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-stone-900">
                正在{placingState.source === 'MOVE' ? '移动' : '摆放'}：
                【{FURNITURE_CATALOG[placingState.furnitureId]?.name}】
              </span>
              <span className="text-stone-500 font-mono">
                ({placingState.rotation}° 角度)
              </span>
              {hoverValidation && !hoverValidation.valid && (
                <span className="text-rose-600 flex items-center gap-1 text-[11px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {hoverValidation.error}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRotateCurrent}
                className="doodle-btn px-2.5 py-1 text-xs flex items-center gap-1 bg-white"
                title="旋转 90 度"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>旋转 (90°)</span>
              </button>
              <button
                onClick={() => {
                  setPlacingState(null);
                  showToast('已取消摆放', 'info');
                }}
                className="doodle-btn px-2.5 py-1 text-xs text-stone-600 bg-white"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span>💡 提示：点击店内任意家具可进行【旋转】、【移动】、【收纳】或【出售】。</span>
            {selectedPlaced && (
              <span className="font-bold text-stone-900">已选中：{selectedCatalog?.name}</span>
            )}
          </div>
        )}
      </div>

      {/* 8×6 网格主布局交互盘 */}
      <div className="doodle-box p-4 bg-[#FAF8F5] overflow-x-auto">
        <div className="min-w-[620px] max-w-3xl mx-auto space-y-2">
          {/* 顶部标尺与大门指示 */}
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 px-8">
            <span>X 轴 → (0 ~ 7)</span>
            <span className="text-stone-600 font-sans flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5 text-stone-800" />
              左侧 (0, 2) 为书咖迎客大门，通道须保持畅通
            </span>
          </div>

          <div className="relative border-4 border-stone-900 bg-white rounded-xl shadow-[4px_4px_0px_#1c1917] p-2">
            {/* 网格行与列 */}
            <div className="grid grid-cols-8 gap-1.5 select-none">
              {Array.from({ length: GRID_ROWS }).map((_, y) =>
                Array.from({ length: GRID_COLS }).map((_, x) => {
                  const isEntrance = x === ENTRANCE_TILE.x && y === ENTRANCE_TILE.y;
                  const placedAtTile = findFurnitureAtTile(x, y);
                  const isTopLeftOfPlaced = placedAtTile && placedAtTile.x === x && placedAtTile.y === y;
                  const isSelected = placedAtTile && placedAtTile.instanceId === selectedInstanceId;

                  // 摆放预览高亮
                  let isPreviewHoverTile = false;
                  let isPreviewValid = true;
                  if (placingState && hoverTile) {
                    const catalogItem = FURNITURE_CATALOG[placingState.furnitureId];
                    if (catalogItem) {
                      const dims = getRotatedDimensions(catalogItem, placingState.rotation);
                      if (
                        x >= hoverTile.x &&
                        x < hoverTile.x + dims.w &&
                        y >= hoverTile.y &&
                        y < hoverTile.y + dims.h
                      ) {
                        isPreviewHoverTile = true;
                        isPreviewValid = hoverValidation?.valid ?? false;
                      }
                    }
                  }

                  return (
                    <div
                      key={`tile_${x}_${y}`}
                      onClick={() => handleTileClick(x, y)}
                      onMouseEnter={() => setHoverTile({ x, y })}
                      className={`relative h-18 sm:h-20 rounded-lg transition-all flex flex-col items-center justify-center p-0.5 cursor-pointer font-mono text-[10px] ${
                        isEntrance
                          ? 'border-2 border-dashed border-stone-700 bg-stone-100/80'
                          : isPreviewHoverTile
                          ? isPreviewValid
                            ? 'border-2 border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/50'
                            : 'border-2 border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/50'
                          : placedAtTile
                          ? isSelected
                            ? 'border-2 border-dashed border-stone-900 bg-amber-50/40 shadow-xs'
                            : 'border border-transparent bg-transparent hover:bg-stone-200/20'
                          : 'border border-dashed border-stone-200/80 hover:border-stone-400 bg-white/30'
                      }`}
                    >
                      {/* 网格坐标标识 (右上角浅印) */}
                      <span className="absolute top-0.5 right-1 text-[7.5px] text-stone-300 pointer-events-none select-none">
                        {x},{y}
                      </span>

                      {/* 蓝猫兰兰当前网格位置：呈现随 9 种自主行为动态变化的形象 (无外框方盒，自然生动) */}
                      {gameState.lanLan?.behavior?.position?.x === x && gameState.lanLan?.behavior?.position?.y === y && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
                          <LanLanGridAvatar
                            behavior={gameState.lanLan.behavior.currentBehavior}
                            facing={gameState.lanLan.behavior.facing}
                            dialogue={gameState.lanLan.behavior.dialogueBubble}
                          />
                        </div>
                      )}

                      {/* 毛球当前网格位置标记 */}
                      {gameState.lanLan?.behavior?.yarnBall?.x === x && gameState.lanLan?.behavior?.yarnBall?.y === y && (
                        <div className="absolute bottom-1 right-1 z-20 text-sm pointer-events-none animate-bounce" title="毛线球">
                          🧶
                        </div>
                      )}

                      {/* 大门指示 */}
                      {isEntrance && (
                        <div className="flex flex-col items-center text-stone-800 pointer-events-none">
                          <DoorOpen className="w-5 h-5 text-stone-800 stroke-[2.2]" />
                          <span className="text-[9px] font-bold font-sans mt-0.5">大门</span>
                        </div>
                      )}

                      {/* 家具手绘简笔画模型呈现 */}
                      {placedAtTile && (
                        <div className="flex flex-col items-center justify-center w-full h-full text-center pointer-events-none overflow-hidden p-0.5">
                          <DoodleFurnitureModel
                            furnitureId={placedAtTile.furnitureId}
                            rotation={placedAtTile.rotation}
                            className="w-full h-8 sm:h-9 drop-shadow-xs"
                            isSelected={!!isSelected}
                            isAnchorTile={placedAtTile.x === x && placedAtTile.y === y}
                          />
                          <span className="text-[9px] font-bold text-stone-900 line-clamp-1 font-sans leading-tight mt-0.5">
                            {FURNITURE_CATALOG[placedAtTile.furnitureId]?.name.split(' ')[0] || '家具'}
                          </span>
                          <span className="text-[7.5px] text-stone-500 font-sans leading-none">
                            {getFurnitureQuickStat(FURNITURE_CATALOG[placedAtTile.furnitureId])}
                          </span>
                        </div>
                      )}

                      {/* 待放置的预览指示 */}
                      {isPreviewHoverTile && !placedAtTile && (
                        <div className="text-[9px] font-bold font-sans text-center">
                          {isPreviewValid ? (
                            <span className="text-emerald-700">✓ 可放置</span>
                          ) : (
                            <span className="text-rose-700">✕ 冲突</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 选中家具时的快捷操作工具栏 */}
      {selectedPlaced && selectedCatalog && (
        <div className="doodle-box p-3 bg-white flex flex-wrap items-center justify-between gap-2 border-2 border-stone-900">
          <div className="flex items-center gap-3">
            <span className="p-1 border-2 border-stone-900 rounded-lg bg-stone-100 w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden">
              <DoodleFurnitureModel furnitureId={selectedPlaced.furnitureId} rotation={selectedPlaced.rotation} className="w-10 h-10" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-stone-900">{selectedCatalog.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded border border-stone-800 bg-stone-100">
                  {getZoneLabel(selectedCatalog.zone)}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  位置: ({selectedPlaced.x}, {selectedPlaced.y}) · 角度: {selectedPlaced.rotation}°
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">{selectedCatalog.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRotateCurrent}
              className="doodle-btn px-2.5 py-1.5 text-xs flex items-center gap-1"
              title="旋转 90 度"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>旋转</span>
            </button>

            <button
              onClick={() => handleStartMove(selectedPlaced.instanceId)}
              className="doodle-btn px-2.5 py-1.5 text-xs flex items-center gap-1"
              title="移动位置"
            >
              <Move className="w-3.5 h-3.5" />
              <span>移动</span>
            </button>

            <button
              onClick={() => handleStoreFurniture(selectedPlaced.instanceId)}
              className="doodle-btn px-2.5 py-1.5 text-xs flex items-center gap-1"
              title="收纳至仓库背包"
            >
              <Package className="w-3.5 h-3.5" />
              <span>收纳</span>
            </button>

            {selectedCatalog.canSell && (
              <button
                onClick={() => handleSellFurniture(selectedPlaced.instanceId, false)}
                className="doodle-btn px-2.5 py-1.5 text-xs flex items-center gap-1 text-rose-700"
                title={`出售可回收 ¥${selectedCatalog.sellPrice.toFixed(2)}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>出售 (¥{selectedCatalog.sellPrice.toFixed(0)})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 底部功能区：仓库背包 vs 家具商店 */}
      <div className="doodle-box p-3 bg-white space-y-3">
        <div className="flex border-b border-stone-200 gap-2 pb-2">
          <button
            onClick={() => {
              playClickSound();
              setActiveBottomTab('STORAGE');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 flex items-center gap-1.5 transition-colors ${
              activeBottomTab === 'STORAGE'
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>已收纳家具背包 ({gameState.storedFurniture.length})</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveBottomTab('SHOP');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 flex items-center gap-1.5 transition-colors ${
              activeBottomTab === 'SHOP'
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>家具专卖店选购</span>
          </button>
        </div>

        {/* 1. 仓库背包视图 */}
        {activeBottomTab === 'STORAGE' && (
          <div className="space-y-2">
            {gameState.storedFurniture.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 space-y-1">
                <Package className="w-8 h-8 mx-auto text-stone-300 stroke-1" />
                <p>仓库中暂无收纳的家具。</p>
                <p className="text-[11px] text-stone-400">
                  点击上方“家具专卖店”购置新桌椅、书架或猫爬架，或将店内现有家具收纳入库。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {gameState.storedFurniture.map((fid, idx) => {
                  const catItem = FURNITURE_CATALOG[fid];
                  if (!catItem) return null;
                  return (
                    <div
                      key={`storage_${fid}_${idx}`}
                      className="border-2 border-stone-900 rounded-lg p-2.5 bg-stone-50 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#1c1917]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="p-1 border border-stone-800 rounded bg-white w-12 h-10 flex items-center justify-center shrink-0 overflow-hidden">
                          <DoodleFurnitureModel furnitureId={catItem.id} className="w-10 h-8" />
                        </span>
                        <div>
                          <div className="font-bold text-xs text-stone-900">{catItem.name}</div>
                          <div className="text-[10px] text-stone-500">
                            占地 {catItem.width}×{catItem.height} · {getZoneLabel(catItem.zone)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePickFromStorage(catItem.id, idx)}
                          className="doodle-btn doodle-btn-primary px-2.5 py-1 text-xs"
                          title="取出摆放至网格"
                        >
                          摆放
                        </button>
                        {catItem.canSell && (
                          <button
                            onClick={() => handleSellFurniture(catItem.id, true)}
                            className="doodle-btn px-2 py-1 text-xs text-rose-700"
                            title={`出售回收资金 ¥${catItem.sellPrice.toFixed(0)}`}
                          >
                            出售
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. 家具专卖店视图 */}
        {activeBottomTab === 'SHOP' && (
          <div className="space-y-3">
            {/* 分区筛选标签 */}
            <div className="flex flex-wrap gap-1 text-xs">
              {(
                [
                  { id: 'ALL', label: '全部' },
                  { id: 'SEATING', label: '🪑 客座阅读区' },
                  { id: 'BOOKSHELF_AREA', label: '📚 大书架区' },
                  { id: 'CAT_ZONE', label: '🐱 猫咪乐园区' },
                  { id: 'KITCHEN_STATION', label: '🍳 简餐制作台' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setShopZoneFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded border ${
                    shopZoneFilter === tab.id
                      ? 'border-stone-900 bg-stone-900 text-white font-bold'
                      : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 家具商品卡片列表 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(FURNITURE_CATALOG)
                .filter((item) => item.canSell) // 过滤非卖开业基础必需品
                .filter((item) => shopZoneFilter === 'ALL' || item.zone === shopZoneFilter)
                .map((item) => {
                  const canAfford = gameState.cash >= item.purchaseCost;
                  return (
                    <div
                      key={`shop_${item.id}`}
                      className="border-2 border-stone-900 rounded-xl p-3 bg-white flex flex-col justify-between gap-2 shadow-[2px_2px_0px_#1c1917]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1 border border-stone-800 rounded bg-stone-50 w-12 h-10 flex items-center justify-center shrink-0 overflow-hidden">
                              <DoodleFurnitureModel furnitureId={item.id} className="w-10 h-8" />
                            </span>
                            <div>
                              <div className="font-bold text-xs text-stone-900">{item.name}</div>
                              <span className="text-[9px] text-stone-500 font-sans">
                                占地 {item.width}×{item.height} · {getZoneLabel(item.zone)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-900 text-xs shrink-0">
                            ¥{item.purchaseCost.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-stone-500 font-mono">
                          占地: {item.width}×{item.height} 格
                        </span>
                        <button
                          onClick={() => handleBuyFromShop(item)}
                          disabled={!canAfford}
                          className={`doodle-btn px-3 py-1 text-xs font-bold flex items-center gap-1 ${
                            canAfford ? 'doodle-btn-primary' : 'opacity-40 cursor-not-allowed bg-stone-200'
                          }`}
                        >
                          <Coins className="w-3 h-3" />
                          <span>{canAfford ? '购买入库' : '现金不足'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 辅助函数：根据功能分区返回对应的手绘图标
function getZoneIcon(zone?: FunctionalZone) {
  switch (zone) {
    case 'ORDER_COUNTER':
      return <Coffee className="w-4 h-4 text-stone-800" />;
    case 'BEVERAGE_STATION':
      return <Coffee className="w-4 h-4 text-stone-800" />;
    case 'KITCHEN_STATION':
      return <Utensils className="w-4 h-4 text-stone-800" />;
    case 'READING_AREA':
      return <Armchair className="w-4 h-4 text-stone-800" />;
    case 'BOOKSHELF_AREA':
      return <BookOpen className="w-4 h-4 text-stone-800" />;
    case 'CAT_ZONE':
      return <Sparkles className="w-4 h-4 text-stone-800" />;
    default:
      return <Package className="w-4 h-4 text-stone-800" />;
  }
}

function getZoneLabel(zone?: FunctionalZone) {
  switch (zone) {
    case 'ORDER_COUNTER':
      return '前台收银';
    case 'BEVERAGE_STATION':
      return '饮品工作台';
    case 'KITCHEN_STATION':
      return '简餐料理台';
    case 'READING_AREA':
      return '客座阅读区';
    case 'BOOKSHELF_AREA':
      return '落地书架区';
    case 'CAT_ZONE':
      return '猫咪活动区';
    default:
      return '普通家具';
  }
}

function getFurnitureQuickStat(item?: FurnitureItem) {
  if (!item) return '';
  if (item.seatCapacity) return `${item.seatCapacity}人座位`;
  if (item.speedBonus) return `提速+${Math.round(item.speedBonus * 100)}%`;
  if (item.readingSatisfactionBonus) return `阅读+${item.readingSatisfactionBonus}分`;
  if (item.catAttraction) return `猫咪吸引+${item.catAttraction}`;
  return '核心设施';
}
