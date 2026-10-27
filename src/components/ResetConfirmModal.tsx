/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》存档重置与新建确认模态窗
 */

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { playClickSound } from '../game/audio/soundEffects';

interface ResetConfirmModalProps {
  isOpen: boolean;
  currentDay: number;
  currentCash: number;
  onClose: () => void;
  onConfirmReset: () => void;
  onExportBackup: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  currentDay,
  currentCash,
  onClose,
  onConfirmReset,
  onExportBackup,
}) => {
  const [hasBackedUp, setHasBackedUp] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-md flex flex-col shadow-[6px_6px_0px_#1c1917] overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="p-4 sm:p-5 border-b-2 border-stone-900 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border-2 border-rose-900 text-rose-700 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-doodle tracking-wide text-rose-950">
                重置经营存档
              </h2>
              <p className="text-xs text-stone-500">重开新档 · 恢复初始经营状态</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-lg border-2 border-stone-900 flex items-center justify-center font-bold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 核心内容区 */}
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm text-stone-800">
          
          <div className="p-3.5 bg-rose-50 border-2 border-rose-900/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>注意：此操作将清除当前全部进度</span>
            </div>
            <p className="text-stone-700 text-xs leading-relaxed">
              确定要重置《豆哥的猫咪书咖》吗？重置后：
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-600 pl-1 font-mono">
              <li>营业进度重回：<strong>第 1 天 晨间简报</strong></li>
              <li>当前资金 ¥{currentCash.toFixed(2)} 恢复为 <strong>¥2,000.00</strong> 初始启动金</li>
              <li>清空当前原料库存、进货记录与历史财报</li>
              <li>重置店铺家具布局与陈列</li>
              <li>重置豆哥穿戴甲工坊、抓大鹅战报与动漫手账</li>
            </ul>
          </div>

          {/* 备份提示 */}
          <div className="p-3 bg-stone-100 border border-stone-800 rounded-xl flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="font-bold text-stone-900 text-xs">先备份当前存档（推荐）</div>
              <p className="text-[11px] text-stone-500">
                导出一个 JSON 文件保存在电脑/手机中，日后随时可导入恢复
              </p>
            </div>
            <button
              onClick={() => {
                playClickSound();
                onExportBackup();
                setHasBackedUp(true);
              }}
              className="doodle-btn px-2.5 py-1.5 text-xs font-bold shrink-0 flex items-center gap-1.5 bg-white"
            >
              {hasBackedUp ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-800">已导出备份</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>导出 JSON</span>
                </>
              )}
            </button>
          </div>

          <p className="text-stone-500 text-[11px] text-center">
            当前处于第 {currentDay} 天 · 存档键名: <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">douge_cat_cafe_save_v1</code>
          </p>

        </div>

        {/* 底部确认操作按钮 */}
        <div className="p-4 sm:p-5 border-t-2 border-stone-900 bg-white flex items-center justify-end gap-3">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="doodle-btn px-4 py-2 text-xs font-bold flex items-center gap-1 text-stone-700 bg-stone-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            取消返回
          </button>
          <button
            onClick={() => {
              playClickSound();
              onConfirmReset();
            }}
            className="doodle-btn px-4 py-2 text-xs font-bold flex items-center gap-1 bg-rose-600 text-white border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917] hover:bg-rose-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            确认彻底重置新档
          </button>
        </div>

      </div>
    </div>
  );
};
