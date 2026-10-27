/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 智能自动补货配置面板 (AutoRestockModal)
 * 核心合规机制：
 * 1. 每日采购预算上限控制 (dailyBudget)
 * 2. 单原料最低库存触发 (minThreshold) 与补足目标 (targetStock)
 * 3. 单次最大采购批次上限 (maxBatchQty)，防止单品买爆
 * 4. 严格遵守原料物理库存上限 (maxStock)
 * 5. 现金不足自动截断安全保护，绝不自动借款，绝不产生负数
 * 6. 玩家随时可开启/暂停自动补货总开关
 */

import React, { useState } from 'react';
import {
  AutoRestockConfig,
  AutoRestockRule,
  Ingredient,
} from '../types/game';
import { INITIAL_INGREDIENTS } from '../game/config/initialData';
import { playClickSound, playCoinSound } from '../game/audio/soundEffects';
import {
  RefreshCw,
  Sliders,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  Package,
  CheckCircle2,
  Power,
} from 'lucide-react';

interface AutoRestockModalProps {
  isOpen: boolean;
  config: AutoRestockConfig;
  currentCash: number;
  currentInventory: Record<string, number>;
  onClose: () => void;
  onSaveConfig: (newConfig: AutoRestockConfig) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const AutoRestockModal: React.FC<AutoRestockModalProps> = ({
  isOpen,
  config,
  currentCash,
  currentInventory,
  onClose,
  onSaveConfig,
  showToast,
}) => {
  const [localConfig, setLocalConfig] = useState<AutoRestockConfig>(() => ({
    ...config,
    rules: { ...config.rules },
  }));

  if (!isOpen) return null;

  // 切换总开关
  const handleToggleGlobal = () => {
    playClickSound();
    setLocalConfig((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  // 调整每日预算
  const handleBudgetChange = (amount: number) => {
    playClickSound();
    setLocalConfig((prev) => ({
      ...prev,
      dailyBudget: Math.max(10, Math.min(500, amount)),
    }));
  };

  // 切换单个原料规则启用
  const handleToggleRule = (ingredientId: string) => {
    playClickSound();
    const existingRule = localConfig.rules[ingredientId] || {
      ingredientId,
      enabled: false,
      minThreshold: 3,
      targetStock: 10,
      maxBatchQty: 5,
    };

    setLocalConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ingredientId]: {
          ...existingRule,
          enabled: !existingRule.enabled,
        },
      },
    }));
  };

  // 修改单个原料数值
  const handleUpdateRuleValue = (
    ingredientId: string,
    field: 'minThreshold' | 'targetStock' | 'maxBatchQty',
    val: number
  ) => {
    const existingRule = localConfig.rules[ingredientId] || {
      ingredientId,
      enabled: true,
      minThreshold: 3,
      targetStock: 10,
      maxBatchQty: 5,
    };

    const ing = INITIAL_INGREDIENTS[ingredientId];
    const maxAllowed = ing ? ing.maxStock : 20;

    let sanitized = val;
    if (field === 'minThreshold') sanitized = Math.max(1, Math.min(existingRule.targetStock - 1, val));
    if (field === 'targetStock') sanitized = Math.max(existingRule.minThreshold + 1, Math.min(maxAllowed, val));
    if (field === 'maxBatchQty') sanitized = Math.max(1, Math.min(maxAllowed, val));

    setLocalConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ingredientId]: {
          ...existingRule,
          [field]: sanitized,
        },
      },
    }));
  };

  // 保存并生效
  const handleSave = () => {
    playCoinSound();
    onSaveConfig(localConfig);
    onClose();
    showToast(
      localConfig.enabled
        ? `自动补货已启用！每日预算上限 ¥${localConfig.dailyBudget}，将在每日晨间自动补充低库存原料。`
        : '自动补货功能已暂停。',
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#1c1917] overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="p-4 sm:p-5 border-b-2 border-stone-900 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-doodle tracking-wide text-stone-900">
                  智能自动补货策略
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-900 font-bold bg-amber-100 text-amber-950 font-mono">
                  Lv.3 专属自动化
                </span>
              </div>
              <p className="text-xs text-stone-500">
                晨间自动检测缺料 · 严守预算与库存底线 · 绝不自动透支
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

        {/* 主体配置内容区 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-800">
          
          {/* 总开关与每日预算配置卡 */}
          <div className="p-4 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Power className="w-4 h-4 text-stone-700" />
                  <span>自动补货总调度开关</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  开启后，每天从晨间简报进入经营准备时自动执行合规采购
                </p>
              </div>

              <button
                onClick={handleToggleGlobal}
                className={`doodle-btn px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  localConfig.enabled
                    ? 'bg-emerald-600 text-white border-emerald-950 shadow-[2px_2px_0px_#064e3b]'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <span>{localConfig.enabled ? '● 自动补货已激活' : '○ 处于暂停待命状态'}</span>
              </button>
            </div>

            {/* 每日采购预算上限 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                <span className="font-bold text-stone-900 block text-xs">
                  每日采购支出预算上限：
                </span>
                <span className="text-[11px] text-stone-500">
                  单日累计自动采购支出绝不会超出此预算，防止资金耗尽
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[50, 100, 150, 200].map((b) => (
                  <button
                    key={b}
                    onClick={() => handleBudgetChange(b)}
                    className={`doodle-btn px-2.5 py-1 text-xs font-mono font-bold ${
                      localConfig.dailyBudget === b ? 'bg-stone-900 text-white' : 'bg-white text-stone-700'
                    }`}
                  >
                    ¥{b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 六条安全红线合规提示 */}
          <div className="p-3 bg-emerald-50/80 border border-stone-900 rounded-xl text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>经营安全铁律保障：</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-stone-700 pl-1">
              <li>若现金不足或达到预算上限，补货立即截断并提示，<strong>绝不自动借款</strong>。</li>
              <li>严格遵守单次采购上限与原料最大库存容量，严防买爆仓库。</li>
            </ul>
          </div>

          {/* 各原料细项补货规则表 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1 text-xs font-bold text-stone-700">
              <span>原料补货规则设定</span>
              <span className="text-[11px] text-stone-400 font-normal">单价 · 阈值 · 目标库存 · 单次上限</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {Object.values(INITIAL_INGREDIENTS).map((ing) => {
                const rule = localConfig.rules[ing.id] || {
                  ingredientId: ing.id,
                  enabled: false,
                  minThreshold: 3,
                  targetStock: 10,
                  maxBatchQty: 5,
                };
                const currentStock = currentInventory[ing.id] || 0;

                return (
                  <div
                    key={ing.id}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rule.enabled
                        ? 'border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917]'
                        : 'border-stone-300 bg-stone-50/60 text-stone-400'
                    }`}
                  >
                    {/* 左侧：原料基本信息与启用开关 */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(ing.id)}
                        className="w-4 h-4 rounded border-2 border-stone-900 accent-stone-900 cursor-pointer"
                        id={`check_${ing.id}`}
                      />
                      <label htmlFor={`check_${ing.id}`} className="cursor-pointer space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs sm:text-sm ${rule.enabled ? 'text-stone-900' : 'text-stone-400'}`}>
                            {ing.name}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            ¥{ing.costPrice.toFixed(1)}/份
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          当前库存: <strong className="font-mono text-stone-800">{currentStock}</strong> / {ing.maxStock} {ing.unit}
                        </div>
                      </label>
                    </div>

                    {/* 右侧：补货参数调节 (阈值、目标、单次批次) */}
                    {rule.enabled ? (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono shrink-0">
                        <div className="text-center">
                          <span className="text-[10px] text-stone-500 block font-sans">触发阈值(&lt;)</span>
                          <input
                            type="number"
                            min="1"
                            max={rule.targetStock - 1}
                            value={rule.minThreshold}
                            onChange={(e) => handleUpdateRuleValue(ing.id, 'minThreshold', parseInt(e.target.value) || 1)}
                            className="w-12 text-center p-1 border border-stone-800 rounded bg-stone-50 font-bold"
                          />
                        </div>

                        <span className="text-stone-400">➔</span>

                        <div className="text-center">
                          <span className="text-[10px] text-stone-500 block font-sans">补足到</span>
                          <input
                            type="number"
                            min={rule.minThreshold + 1}
                            max={ing.maxStock}
                            value={rule.targetStock}
                            onChange={(e) => handleUpdateRuleValue(ing.id, 'targetStock', parseInt(e.target.value) || 10)}
                            className="w-12 text-center p-1 border border-stone-800 rounded bg-stone-50 font-bold"
                          />
                        </div>

                        <div className="text-center">
                          <span className="text-[10px] text-stone-500 block font-sans">单次上限</span>
                          <input
                            type="number"
                            min="1"
                            max={ing.maxStock}
                            value={rule.maxBatchQty}
                            onChange={(e) => handleUpdateRuleValue(ing.id, 'maxBatchQty', parseInt(e.target.value) || 5)}
                            className="w-12 text-center p-1 border border-stone-800 rounded bg-stone-50 font-bold"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 italic font-sans">
                        手动采购模式
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 底部保存按键 */}
        <div className="p-4 sm:p-5 border-t-2 border-stone-900 bg-white flex items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            可用现金: <strong className="font-mono text-emerald-800">¥{currentCash.toFixed(2)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="doodle-btn px-4 py-2 text-xs text-stone-600 bg-stone-100"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="doodle-btn doodle-btn-primary px-5 py-2 text-xs font-bold"
            >
              保存补货策略
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
