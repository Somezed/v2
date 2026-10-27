/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》开发规范、阶段路线图与验收标准面板
 */

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Award, Terminal } from 'lucide-react';
import { playClickSound } from '../game/audio/soundEffects';

interface RulesSpecificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesSpecificationModal: React.FC<RulesSpecificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'RULES' | 'ROADMAP' | 'CHECKLIST' | 'STANDARDS'>('RULES');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#1c1917] overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="p-4 sm:p-5 border-b-2 border-stone-900 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-doodle tracking-wide">
                项目规则、开发规范与实施路线图
              </h2>
              <p className="text-xs text-stone-500">《豆哥的猫咪书咖》工程架构基石与质量红线</p>
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

        {/* 标签栏 */}
        <div className="flex border-b-2 border-stone-900 bg-stone-100 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('RULES');
            }}
            className={`px-4 py-2.5 flex items-center gap-2 border-r-2 border-stone-900 whitespace-nowrap transition-colors ${
              activeTab === 'RULES' ? 'bg-[#FAF8F5] text-stone-900 font-bold border-b-2 border-b-[#FAF8F5] -mb-[2px]' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            开发底线与六大禁止项
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('ROADMAP');
            }}
            className={`px-4 py-2.5 flex items-center gap-2 border-r-2 border-stone-900 whitespace-nowrap transition-colors ${
              activeTab === 'ROADMAP' ? 'bg-[#FAF8F5] text-stone-900 font-bold border-b-2 border-b-[#FAF8F5] -mb-[2px]' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            六阶段系统实施规划
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('CHECKLIST');
            }}
            className={`px-4 py-2.5 flex items-center gap-2 border-r-2 border-stone-900 whitespace-nowrap transition-colors ${
              activeTab === 'CHECKLIST' ? 'bg-[#FAF8F5] text-stone-900 font-bold border-b-2 border-b-[#FAF8F5] -mb-[2px]' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            阶段 0 验收核对清单
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('STANDARDS');
            }}
            className={`px-4 py-2.5 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'STANDARDS' ? 'bg-[#FAF8F5] text-stone-900 font-bold border-b-2 border-b-[#FAF8F5] -mb-[2px]' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Award className="w-4 h-4" />
            架构解耦与测试规范
          </button>
        </div>

        {/* 内容展示区 */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-800 text-sm leading-relaxed">
          {activeTab === 'RULES' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border-2 border-stone-900 rounded-xl shadow-[3px_3px_0px_#1c1917]">
                <h3 className="font-bold text-base flex items-center gap-2 text-stone-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  核心开发准则（必须严格遵守）
                </h3>
                <ul className="mt-3 space-y-2 list-disc list-inside text-stone-700 text-xs sm:text-sm">
                  <li><strong>真实可玩系统：</strong>必须具备真实的财务流水、库存扣减、猫咪情绪、声誉成长，禁止做空壳 UI。</li>
                  <li><strong>阶段递进原则：</strong>每次只开发当前指定阶段，绝不越级提前堆砌半成品代码。</li>
                  <li><strong>工作前检查：</strong>每次开始前检查现有代码，列出新增/修改模块与验收标准，尽量复用已有资产。</li>
                  <li><strong>完成后验收：</strong>实际编译运行、跑通自动化单元测试，若未通过验收坚决不虚假宣称完成。</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50/70 border-2 border-stone-900 rounded-xl shadow-[3px_3px_0px_#1c1917]">
                <h3 className="font-bold text-base flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                  六项禁止行为（严禁触碰红线）
                </h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="p-2.5 bg-white border border-stone-900 rounded-lg flex items-start gap-2">
                    <span className="font-bold text-red-600">✕</span>
                    <span><strong>禁止仅生界面：</strong>界面元素背后必须有真实的数值与逻辑支撑。</span>
                  </div>
                  <div className="p-2.5 bg-white border border-stone-900 rounded-lg flex items-start gap-2">
                    <span className="font-bold text-red-600">✕</span>
                    <span><strong>禁止假数据伪装：</strong>禁止用 Math.random() 静态数字假装经营成功。</span>
                  </div>
                  <div className="p-2.5 bg-white border border-stone-900 rounded-lg flex items-start gap-2">
                    <span className="font-bold text-red-600">✕</span>
                    <span><strong>禁止装饰性空按钮：</strong>UI 上的每一个按钮都必须有实际反馈与功能。</span>
                  </div>
                  <div className="p-2.5 bg-white border border-stone-900 rounded-lg flex items-start gap-2">
                    <span className="font-bold text-red-600">✕</span>
                    <span><strong>禁止跳过经营规则：</strong>不为走捷径跳过库存核算、原料扣减与设备折旧。</span>
                  </div>
                  <div className="p-2.5 bg-white border border-stone-900 rounded-lg flex items-start gap-2">
                    <span className="font-bold text-red-600">✕</span>
                    <span><strong>禁止引入付费服务：</strong>不依赖必须付费的网络 API，保证离线纯净可用。</span>
                  </div>
                  <div className="p-2.5 bg-white border border-stone-900 rounded-lg flex items-start gap-2">
                    <span className="font-bold text-red-600">✕</span>
                    <span><strong>禁止每次推翻重做：</strong>坚持模块化演进，保护已有代码与存档稳定性。</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ROADMAP' && (
            <div className="space-y-3">
              {[
                {
                  phase: '阶段 0',
                  title: '建立项目规则与开发规范',
                  status: '✓ 已完成',
                  color: 'bg-emerald-100 text-emerald-800 border-emerald-900',
                  desc: '建立领域类型模型、数据配置驱动层、纯函数经济计算引擎、LocalStorage 版本化存档与导出导入，Vitest 自动化测试。',
                },
                {
                  phase: '阶段 1',
                  title: '经营闭环与严格财务核算',
                  status: '✓ 已完成',
                  color: 'bg-emerald-100 text-emerald-800 border-emerald-900',
                  desc: '晨间简报、采购与定价、六类商品配方、损益表(P&L COGS已消耗成本)与现金流表双重勾稽。',
                },
                {
                  phase: '阶段 2',
                  title: '顾客画像、订单队列与排队系统',
                  status: '✓ 已完成',
                  color: 'bg-emerald-100 text-emerald-800 border-emerald-900',
                  desc: '三类基础顾客(价格敏感/品质追求/阅读休闲)、完整订单生命周期、先来先服务排队插队、缺货替代餐品。',
                },
                {
                  phase: '阶段 3',
                  title: '店铺网格装修与经营布局系统',
                  status: '✓ 已完成',
                  color: 'bg-emerald-100 text-emerald-800 border-emerald-900',
                  desc: '8x6 网格家具摆放、旋转收纳、BFS 连通性阻挡判定、座位容量与出餐提速经营效果。',
                },
                {
                  phase: '阶段 4',
                  title: '豆哥日常生活系统 (三大爱好与手账)',
                  status: '✓ 已完成',
                  color: 'bg-emerald-100 text-emerald-800 border-emerald-900',
                  desc: '10款原创手绘穿戴甲收藏与佩戴、微信小游戏《抓大鹅》战报与陪伴互动、6部原创动漫短剧与衍生周边、低频可选日常随笔与手账回放。',
                },
                {
                  phase: '阶段 5',
                  title: '蓝猫兰兰自主行为系统 (核心习性与自主陪伴)',
                  status: '✓ 已完成',
                  color: 'bg-emerald-100 text-emerald-800 border-emerald-900',
                  desc: '兰兰完全自主行为体系：9种自主行为状态（睡觉/伸懒腰/休息/走动/短跑/观察/主动亲近/玩毛球/拒绝被抱）、网格真实避障、无人理会时主动靠近蹭豆哥、不喜欢被抱傲娇滑脱、拍打毛线球、顾客治愈微加成、零日常强制打卡负担。',
                },
              ].map((item, i) => (
                <div key={i} className="p-3.5 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{item.phase}：{item.title}</span>
                      <span className={`px-2 py-0.5 text-[11px] font-bold border rounded-full ${item.color}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'CHECKLIST' && (
            <div className="space-y-3">
              <div className="p-4 bg-white border-2 border-stone-900 rounded-xl shadow-[3px_3px_0px_#1c1917]">
                <h3 className="font-bold text-sm text-stone-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  阶段 0 交付核验项状态
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  {[
                    { title: '项目环境与依赖体检', detail: '检查 React 19 + TypeScript + Vite + Tailwind，安装 Vitest', checked: true },
                    { title: '核心领域模型与数据契约', detail: '建立 /src/types/game.ts，定义 GameSaveData, DouGeState, LanLanState 等', checked: true },
                    { title: '数据配置驱动层', detail: '建立 /src/game/config/initialData.ts，配置饮品、原料、图书、设备数据', checked: true },
                    { title: '经营计算与界面完全解耦', detail: '建立 /src/game/engine/economy.ts，提供纯函数核算成本、毛利、库存与日报', checked: true },
                    { title: '稳定版本化存档与导入导出', detail: '建立 /src/game/engine/saveManager.ts，支持校验、迁移、JSON 导出导入', checked: true },
                    { title: '自动化测试套件 (11/11 通关)', detail: '编写 economy.test.ts 与 saveManager.test.ts，验证核心算法与容灾机制', checked: true },
                    { title: '黑白手绘风视觉与音效系统', detail: '手绘豆哥与兰兰 SVG 形象，Web Audio 程序化翻书、猫叫、金币与点击音效', checked: true },
                  ].map((chk, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-300">
                      <span className="text-emerald-700 font-bold text-base">✓</span>
                      <div>
                        <div className="font-bold text-stone-900">{chk.title}</div>
                        <div className="text-stone-500 text-xs">{chk.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'STANDARDS' && (
            <div className="space-y-3">
              <div className="p-4 bg-white border-2 border-stone-900 rounded-xl shadow-[3px_3px_0px_#1c1917]">
                <h3 className="font-bold text-sm text-stone-900 mb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  工程目录结构与分层职责
                </h3>
                <pre className="p-3 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
{`src/
├── types/
│   └── game.ts              # 核心数据模型、保存契约与接口定义
├── game/
│   ├── config/
│   │   └── initialData.ts   # 原材料/饮品/图书/设备/初始数据配置
│   ├── engine/
│   │   ├── economy.ts       # 纯函数经济核算、利润与库存校验
│   │   ├── saveManager.ts   # 本地持久化、Schema校验、迁移与导入导出
│   │   └── tests/           # 自动化测试用例 (Vitest)
│   └── audio/
│       └── soundEffects.ts  # Web Audio 零依赖程序化合成音效
├── components/
│   ├── DoodleDouGe.tsx      # 店长豆哥黑白简笔画矢量组件
│   ├── DoodleLanLan.tsx     # 蓝猫兰兰黑白简笔画矢量组件
│   └── RulesSpecificationModal.tsx # 本开发规范与路线图弹窗
└── App.tsx                  # 游戏外壳与阶段验证控制台`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t-2 border-stone-900 bg-white flex justify-end">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="doodle-btn doodle-btn-primary px-5 py-2 text-sm"
          >
            我已充分理解规范，返回工作台
          </button>
        </div>

      </div>
    </div>
  );
};
