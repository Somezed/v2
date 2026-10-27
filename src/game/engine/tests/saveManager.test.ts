/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 自动化测试：存档系统验证、导出导入、版本兼容与容错恢复
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSaveData,
  migrateSaveData,
  exportSaveToJSON,
  importSaveFromJSON,
} from '../saveManager';
import { createInitialGameState } from '../../config/initialData';
import { CURRENT_SAVE_VERSION } from '../../../types/game';

describe('存档系统与数据契约测试', () => {
  it('正确验证合法初始存档结构', () => {
    const initialState = createInitialGameState();
    const result = validateSaveData(initialState);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('严格拒绝损坏或缺失必要字段的伪造存档', () => {
    // 空对象
    expect(validateSaveData(null).isValid).toBe(false);
    expect(validateSaveData({}).isValid).toBe(false);

    // 缺少版本号
    const noVersion = createInitialGameState() as any;
    delete noVersion.version;
    expect(validateSaveData(noVersion).isValid).toBe(false);

    // 资金为负数
    const negativeCash = { ...createInitialGameState(), cash: -100 };
    expect(validateSaveData(negativeCash).isValid).toBe(false);

    // 缺失库存
    const noInventory = createInitialGameState() as any;
    delete noInventory.inventory;
    expect(validateSaveData(noInventory).isValid).toBe(false);

    // 缺失兰兰状态
    const noCat = createInitialGameState() as any;
    delete noCat.lanLan;
    expect(validateSaveData(noCat).isValid).toBe(false);
  });

  it('平滑升级低版本或扩增字段的存档', () => {
    const legacySave = {
      version: 0,
      cash: 888,
      currentDay: 5,
      inventory: { coffee_beans: 20 },
      douGe: { name: '豆哥', energy: 80 },
      lanLan: { name: '兰兰', satiety: 70 },
    };

    const migrated = migrateSaveData(legacySave);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.cash).toBe(888);
    expect(migrated.currentDay).toBe(5);
    // 补齐的默认字段
    expect(migrated.storeName).toBe('豆哥的猫咪书咖');
    expect(migrated.douGe.maxEnergy).toBe(100);
    expect(migrated.lanLan.breed).toBe('英国短毛猫 (蓝猫)');
  });

  it('存档序列化导出与逆向反序列化导入无损一致', () => {
    const original = createInitialGameState();
    original.cash = 1234.5;
    original.inventory.coffee_beans = 42;

    const exportedJSON = exportSaveToJSON(original);
    expect(typeof exportedJSON).toBe('string');
    expect(exportedJSON).toContain('1234.5');

    const importResult = importSaveFromJSON(exportedJSON);
    expect(importResult.success).toBe(true);
    expect(importResult.data?.cash).toBe(1234.5);
    expect(importResult.data?.inventory.coffee_beans).toBe(42);
  });

  it('导入畸形或非 JSON 文本时安全报错并返回清晰错误信息', () => {
    const badJson = '这是非法的文本内容无法被解析';
    const result = importSaveFromJSON(badJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON');

    const invalidSchemaJson = JSON.stringify({ note: '我是攻击脚本', cash: '一百万' });
    const schemaResult = importSaveFromJSON(invalidSchemaJson);
    expect(schemaResult.success).toBe(false);
    expect(schemaResult.error).toContain('校验失败');
  });
});
