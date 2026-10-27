/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》存档管理器 (SaveManager)
 * 职责：
 * 1. 本地存储 (localStorage) 读写与自动备份
 * 2. 存档结构完整性校验 (Schema Validation)
 * 3. 跨版本自动平滑迁移机制 (Data Migration)
 * 4. 存档 JSON 导出与导入校验（防止无效/恶意损坏文件）
 * 5. 错误与缺失容错恢复
 */

import {
  GameSaveData,
  CURRENT_SAVE_VERSION,
  SAVE_STORAGE_KEY,
  SaveValidationResult,
} from '../../types/game';
import { createInitialGameState } from '../config/initialData';

/**
 * 校验存档数据结构的基本完整性
 */
export function validateSaveData(data: unknown): SaveValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: '存档数据为空或非合法对象' };
  }

  const obj = data as Partial<GameSaveData>;

  if (typeof obj.version !== 'number' || obj.version < 1) {
    return { isValid: false, error: '缺少有效的存档版本号 (version)' };
  }

  if (typeof obj.cash !== 'number' || isNaN(obj.cash) || obj.cash < 0) {
    return { isValid: false, error: '资金数据异常或为负数' };
  }

  if (typeof obj.currentDay !== 'number' || obj.currentDay < 1) {
    return { isValid: false, error: '经营天数数据不正确' };
  }

  if (!obj.inventory || typeof obj.inventory !== 'object') {
    return { isValid: false, error: '缺少有效的库存数据对象' };
  }

  if (!obj.douGe || typeof obj.douGe !== 'object') {
    return { isValid: false, error: '缺少店长豆哥的状态数据' };
  }

  if (!obj.lanLan || typeof obj.lanLan !== 'object') {
    return { isValid: false, error: '缺少猫咪兰兰的状态数据' };
  }

  return { isValid: true };
}

/**
 * 存档版本升级迁移通道
 */
export function migrateSaveData(data: Record<string, unknown>): GameSaveData {
  const version = typeof data.version === 'number' ? data.version : 0;
  const defaults = createInitialGameState();

  const douGeData = (data.douGe && typeof data.douGe === 'object') ? (data.douGe as Record<string, unknown>) : {};
  const lanLanData = (data.lanLan && typeof data.lanLan === 'object') ? (data.lanLan as Record<string, unknown>) : {};
  const settingsData = (data.settings && typeof data.settings === 'object') ? (data.settings as Record<string, unknown>) : {};
  const inventoryData = (data.inventory && typeof data.inventory === 'object') ? (data.inventory as Record<string, number>) : {};
  const customPricingData = (data.customPricing && typeof data.customPricing === 'object') ? (data.customPricing as Record<string, number>) : {};
  const menuOnSaleData = (data.menuOnSale && typeof data.menuOnSale === 'object') ? (data.menuOnSale as Record<string, boolean>) : {};

  return {
    ...defaults,
    ...data,
    version: CURRENT_SAVE_VERSION,
    dailyPhase: (data.dailyPhase as any) || defaults.dailyPhase,
    customPricing: { ...defaults.customPricing, ...customPricingData },
    menuOnSale: { ...defaults.menuOnSale, ...menuOnSaleData },
    douGe: {
      ...defaults.douGe,
      ...douGeData,
      life: {
        ...defaults.douGe.life,
        ...((douGeData.life as Record<string, unknown>) || {}),
      },
    },
    lanLan: {
      ...defaults.lanLan,
      ...lanLanData,
      behavior: {
        ...defaults.lanLan.behavior,
        ...((lanLanData.behavior as Record<string, unknown>) || {}),
      },
    },
    // 长线系统数据容错与平滑升级
    growth: (data.growth && typeof data.growth === 'object')
      ? { ...defaults.growth, ...(data.growth as Record<string, unknown>) }
      : defaults.growth,
    regularCustomers: (data.regularCustomers && typeof data.regularCustomers === 'object')
      ? { ...defaults.regularCustomers, ...(data.regularCustomers as Record<string, unknown>) }
      : defaults.regularCustomers,
    autoRestock: (data.autoRestock && typeof data.autoRestock === 'object')
      ? {
          ...defaults.autoRestock,
          ...(data.autoRestock as Record<string, unknown>),
          rules: {
            ...defaults.autoRestock.rules,
            ...(((data.autoRestock as Record<string, unknown>).rules as Record<string, unknown>) || {}),
          },
        }
      : defaults.autoRestock,
    loan: (data.loan && typeof data.loan === 'object')
      ? { ...defaults.loan, ...(data.loan as Record<string, unknown>) }
      : defaults.loan,
    almanac: (data.almanac && typeof data.almanac === 'object')
      ? { ...defaults.almanac, ...(data.almanac as Record<string, unknown>) }
      : defaults.almanac,

    settings: { ...defaults.settings, ...settingsData },
    inventory: { ...defaults.inventory, ...inventoryData },
    pausedProducts: Array.isArray(data.pausedProducts) ? data.pausedProducts : defaults.pausedProducts,
    unlockedProducts: Array.isArray(data.unlockedProducts) ? data.unlockedProducts : defaults.unlockedProducts,
    ownedEquipment: Array.isArray(data.ownedEquipment) ? data.ownedEquipment : defaults.ownedEquipment,
    // 天气与环境白噪声
    weather: (data.weather && typeof data.weather === 'object') ? (data.weather as any) : defaults.weather,
    ambience: (data.ambience && typeof data.ambience === 'object')
      ? { ...defaults.ambience, ...(data.ambience as Record<string, unknown>) }
      : defaults.ambience,

    // 随机事件系统
    pendingRandomEvent: (data.pendingRandomEvent !== undefined) ? (data.pendingRandomEvent as any) : defaults.pendingRandomEvent,
    resolvedEvents: Array.isArray(data.resolvedEvents) ? data.resolvedEvents : defaults.resolvedEvents,
    lastEventDay: typeof data.lastEventDay === 'number' ? data.lastEventDay : defaults.lastEventDay,

    placedFurniture: Array.isArray(data.placedFurniture) ? data.placedFurniture : defaults.placedFurniture,
    storedFurniture: Array.isArray(data.storedFurniture) ? data.storedFurniture : defaults.storedFurniture,
    transactionHistory: Array.isArray(data.transactionHistory) ? data.transactionHistory : defaults.transactionHistory,
    dailyReports: Array.isArray(data.dailyReports) ? data.dailyReports : defaults.dailyReports,
  } as GameSaveData;
}

/**
 * 从 localStorage 加载存档
 */
export function loadGameFromStorage(): {
  data: GameSaveData;
  isNewGame: boolean;
  recoveredFromError: boolean;
  errorMessage?: string;
} {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) {
      // 首次进入游戏，创建初始存档
      const newGame = createInitialGameState();
      saveGameToStorage(newGame);
      return { data: newGame, isNewGame: true, recoveredFromError: false };
    }

    const parsed = JSON.parse(raw);
    const validation = validateSaveData(parsed);

    if (!validation.isValid) {
      console.warn('存档校验未通过，正在尝试容错平滑迁移:', validation.error);
      const migrated = migrateSaveData(parsed);
      saveGameToStorage(migrated);
      return {
        data: migrated,
        isNewGame: false,
        recoveredFromError: true,
        errorMessage: validation.error,
      };
    }

    const finalData = migrateSaveData(parsed);
    return { data: finalData, isNewGame: false, recoveredFromError: false };
  } catch (err) {
    console.error('加载本地存档严重失败，安全重置为初始状态:', err);
    const freshGame = createInitialGameState();
    return {
      data: freshGame,
      isNewGame: true,
      recoveredFromError: true,
      errorMessage: err instanceof Error ? err.message : '未知解析错误',
    };
  }
}

/**
 * 将游戏状态持久化至 localStorage
 */
export function saveGameToStorage(state: GameSaveData): { success: boolean; error?: string } {
  try {
    const toSave: GameSaveData = {
      ...state,
      saveTimestamp: Date.now(),
      version: CURRENT_SAVE_VERSION,
    };
    const jsonStr = JSON.stringify(toSave);
    localStorage.setItem(SAVE_STORAGE_KEY, jsonStr);
    return { success: true };
  } catch (err) {
    console.error('保存至 localStorage 失败:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '无法写入本地存储',
    };
  }
}

/**
 * 导出存档为 JSON 字符串
 */
export function exportSaveToJSON(state: GameSaveData): string {
  const exportPayload = {
    ...state,
    saveTimestamp: Date.now(),
    app: '豆哥的猫咪书咖 (Brother Dou Cat Book Cafe)',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * 从导入的 JSON 字符串中还原并校验存档
 */
export function importSaveFromJSON(jsonString: string): {
  success: boolean;
  data?: GameSaveData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateSaveData(parsed);

    if (!validation.isValid) {
      return {
        success: false,
        error: `存档文件校验失败: ${validation.error}`,
      };
    }

    const migrated = migrateSaveData(parsed);
    return {
      success: true,
      data: migrated,
    };
  } catch (err) {
    return {
      success: false,
      error: `JSON 格式解析错误: ${err instanceof Error ? err.message : '无法解析'}`,
    };
  }
}

/**
 * 清除本地存档并重置为初始新游戏
 */
export function resetStorageGame(): GameSaveData {
  const fresh = createInitialGameState();
  try {
    localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // 忽略清除异常
  }
  saveGameToStorage(fresh);
  return fresh;
}
