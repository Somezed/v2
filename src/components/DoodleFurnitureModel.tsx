/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 布局系统手绘简笔画家具模型组件 (DoodleFurnitureModel)
 * 将网格中的抽象方块全面替换为清晰、生动的黑白手绘简笔画模型
 * 包含：吧台、手冲台、电热锅、炒灶、冷餐中岛、双人阅读方桌、单人沙发、大书架、绘本书架、猫爬架、猫窝、毛球垫等
 */

import React from 'react';

interface DoodleFurnitureModelProps {
  furnitureId: string;
  rotation?: 0 | 90 | 180 | 270;
  isSelected?: boolean;
  isAnchorTile?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const DoodleFurnitureModel: React.FC<DoodleFurnitureModelProps> = ({
  furnitureId,
  rotation = 0,
  isSelected = false,
  isAnchorTile = true,
  width = 1,
  height = 1,
  className = '',
}) => {
  // 根据家具 ID 渲染专属手绘线稿模型
  const renderModelSvg = () => {
    switch (furnitureId) {
      // 1. 温润原木点单收银台 (2x1)
      case 'wood_order_counter':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 吧台台面木纹 */}
            <rect x="6" y="8" width="88" height="34" rx="4" fill="#FFFFFF" />
            <line x1="6" y1="16" x2="94" y2="16" strokeWidth="1.5" strokeDasharray="3 2" />
            {/* 木栅格纹理 */}
            <line x1="16" y1="16" x2="16" y2="42" strokeWidth="1.5" />
            <line x1="26" y1="16" x2="26" y2="42" strokeWidth="1.5" />
            <line x1="74" y1="16" x2="74" y2="42" strokeWidth="1.5" />
            <line x1="84" y1="16" x2="84" y2="42" strokeWidth="1.5" />
            {/* 复古收银机 */}
            <rect x="36" y="12" width="28" height="24" rx="2" fill="#FAF8F5" />
            <rect x="42" y="16" width="16" height="8" rx="1" fill="#1c1917" />
            <circle cx="43" cy="28" r="1.5" fill="#1c1917" />
            <circle cx="49" cy="28" r="1.5" fill="#1c1917" />
            <circle cx="55" cy="28" r="1.5" fill="#1c1917" />
            {/* 点单叮当铃 */}
            <path d="M72 26 C72 22 78 22 78 26 Z" fill="#1c1917" />
            <line x1="71" y1="26" x2="79" y2="26" strokeWidth="2" />
            {/* 咖啡杯 */}
            <ellipse cx="20" cy="26" rx="5" ry="3.5" fill="#FAF8F5" />
            <path d="M15 26 Q20 31 25 26" />
            <path d="M25 24 Q28 26 25 28" />
          </svg>
        );

      // 2. 手冲与慢煮青瓷工作台 (2x1)
      case 'pour_over_bar':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="8" width="88" height="34" rx="4" fill="#FFFFFF" />
            {/* 沥水接水盘 */}
            <rect x="12" y="12" width="40" height="26" rx="2" fill="#FAF8F5" />
            <line x1="16" y1="16" x2="48" y2="16" strokeWidth="1.2" strokeDasharray="2 2" />
            <line x1="16" y1="22" x2="48" y2="22" strokeWidth="1.2" strokeDasharray="2 2" />
            <line x1="16" y1="28" x2="48" y2="28" strokeWidth="1.2" strokeDasharray="2 2" />
            {/* 手冲细口壶 */}
            <path d="M22 34 L26 18 L34 18 L38 34 Z" fill="#FFFFFF" />
            <path d="M22 22 C14 20 16 12 24 16" strokeWidth="1.8" />
            <path d="M34 22 Q40 24 37 30" strokeWidth="1.8" />
            {/* 青瓷慢煮茶壶 */}
            <ellipse cx="72" cy="25" rx="14" ry="11" fill="#FAF8F5" />
            <ellipse cx="72" cy="18" rx="7" ry="3" fill="#1c1917" />
            <circle cx="72" cy="15" r="2" fill="#FFFFFF" />
            <path d="M58 24 Q52 22 56 18" strokeWidth="2" />
            <path d="M86 20 Q92 25 86 30" strokeWidth="2" />
          </svg>
        );

      // 3. 不锈钢轻食料理台 (2x1)
      case 'snack_prep_counter':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="8" width="88" height="34" rx="3" fill="#FFFFFF" />
            {/* 实木切配案板 */}
            <rect x="14" y="13" width="38" height="24" rx="2" fill="#FAF8F5" />
            {/* 三明治三角切块 */}
            <polygon points="20,30 36,30 28,18" fill="#FFFFFF" strokeWidth="1.8" />
            <line x1="22" y1="26" x2="34" y2="26" strokeWidth="1.5" />
            {/* 厨师刀 */}
            <path d="M42 16 L50 28" strokeWidth="2.5" />
            <rect x="48" y="27" width="5" height="4" fill="#1c1917" />
            {/* 调料罐排架 */}
            <circle cx="68" cy="22" r="5" fill="#FAF8F5" />
            <circle cx="82" cy="22" r="5" fill="#FAF8F5" />
            <rect x="62" y="31" width="26" height="6" rx="1" fill="#FFFFFF" />
          </svg>
        );

      // 4. 多功能快煮电热台 (2x1)
      case 'electric_cooker_station':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="8" width="88" height="34" rx="3" fill="#FFFFFF" />
            {/* 电磁炉线圈盘 */}
            <circle cx="32" cy="25" r="14" fill="#FAF8F5" />
            <circle cx="32" cy="25" r="8" strokeDasharray="3 2" />
            {/* 煮面汤锅 */}
            <ellipse cx="32" cy="24" rx="11" ry="8" fill="#FFFFFF" />
            <path d="M21 24 Q32 30 43 24" strokeWidth="1.5" />
            <line x1="19" y1="22" x2="16" y2="22" strokeWidth="2" />
            <line x1="45" y1="22" x2="48" y2="22" strokeWidth="2" />
            {/* 蒸汽 */}
            <path d="M30 14 Q32 8 30 4" strokeWidth="1.5" stroke="#9ca3af" />
            <path d="M35 15 Q37 9 35 5" strokeWidth="1.5" stroke="#9ca3af" />
            {/* 右侧数字控温屏与调料盒 */}
            <rect x="60" y="14" width="28" height="18" rx="2" fill="#FAF8F5" />
            <text x="66" y="27" fontSize="9" fontWeight="bold" fill="#1c1917" stroke="none" fontFamily="monospace">100°</text>
            <circle cx="68" cy="36" r="2.5" fill="#1c1917" />
            <circle cx="80" cy="36" r="2.5" fill="#1c1917" />
          </svg>
        );

      // 5. 铸铁煎炒多功能灶台 (2x1)
      case 'saute_stove_station':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="8" width="88" height="34" rx="3" fill="#FFFFFF" />
            {/* 铸铁燃气灶支架 */}
            <circle cx="36" cy="25" r="15" fill="#FAF8F5" />
            <line x1="21" y1="25" x2="51" y2="25" strokeWidth="2" />
            <line x1="36" y1="10" x2="36" y2="40" strokeWidth="2" />
            {/* 弧底炒锅与木柄 */}
            <ellipse cx="36" cy="24" rx="12" ry="9" fill="#1c1917" />
            <ellipse cx="36" cy="23" rx="10" ry="7" fill="#FFFFFF" />
            <path d="M47 21 L62 14" strokeWidth="3.2" stroke="#1c1917" />
            {/* 锅铲 */}
            <line x1="74" y1="18" x2="86" y2="34" strokeWidth="2.5" />
            <polygon points="84,33 90,32 87,37" fill="#1c1917" />
          </svg>
        );

      // 6. 低温保鲜冷藏料理中岛 (2x1)
      case 'cold_prep_counter_station':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="8" width="88" height="34" rx="3" fill="#FFFFFF" />
            {/* 嵌入式保鲜沙拉凹槽 */}
            <rect x="14" y="14" width="22" height="22" rx="2" fill="#FAF8F5" />
            <rect x="40" y="14" width="22" height="22" rx="2" fill="#FAF8F5" />
            <rect x="66" y="14" width="22" height="22" rx="2" fill="#FAF8F5" />
            {/* 生鲜果蔬与海鲜点缀 */}
            <circle cx="25" cy="25" r="5" fill="#FFFFFF" />
            <path d="M22 25 Q25 21 28 25" strokeWidth="1.5" />
            <polygon points="46,28 56,28 51,20" fill="#FFFFFF" />
            <circle cx="77" cy="25" r="6" fill="#1c1917" />
            <circle cx="77" cy="25" r="4" fill="#FFFFFF" />
          </svg>
        );

      // 7. 白橡木双人阅读方桌 (2x1, 2座)
      case 'oak_double_table':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 左侧靠背椅 */}
            <path d="M12 12 Q8 25 12 38 L16 38 Q13 25 16 12 Z" fill="#FAF8F5" />
            <rect x="16" y="18" width="7" height="14" rx="2" fill="#FFFFFF" />
            {/* 中间实木阅读长桌 */}
            <rect x="26" y="10" width="48" height="30" rx="3" fill="#FFFFFF" />
            {/* 桌上翻开的厚精装书 */}
            <path d="M42 22 Q48 18 54 22 Q60 18 66 22 L66 32 Q60 28 54 32 Q48 28 42 32 Z" fill="#FAF8F5" />
            <line x1="54" y1="21" x2="54" y2="32" strokeWidth="1.8" />
            {/* 暖心双咖啡杯 */}
            <circle cx="34" cy="20" r="3.5" fill="#FFFFFF" />
            <circle cx="34" cy="20" r="2" fill="#1c1917" />
            <circle cx="34" cy="30" r="3.5" fill="#FFFFFF" />
            <circle cx="34" cy="30" r="2" fill="#1c1917" />
            {/* 右侧靠背椅 */}
            <path d="M88 12 Q92 25 88 38 L84 38 Q87 25 84 12 Z" fill="#FAF8F5" />
            <rect x="77" y="18" width="7" height="14" rx="2" fill="#FFFFFF" />
          </svg>
        );

      // 8. 布艺单人深陷抱枕沙发 (1x1, 1座)
      case 'cozy_single_sofa':
        return (
          <svg viewBox="0 0 50 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 沙发扶手与深陷坐垫 */}
            <rect x="7" y="12" width="36" height="30" rx="6" fill="#FFFFFF" />
            {/* 厚靠背 */}
            <path d="M11 12 C11 8 39 8 39 12 L39 20 C39 20 11 20 11 20 Z" fill="#FAF8F5" />
            {/* 柔软抱枕 */}
            <rect x="16" y="18" width="18" height="12" rx="3" fill="#FFFFFF" />
            <line x1="20" y1="24" x2="30" y2="24" strokeWidth="1.5" strokeDasharray="2 1" />
            {/* 坐垫凹陷皱褶 */}
            <path d="M15 34 Q25 38 35 34" strokeWidth="1.5" />
          </svg>
        );

      // 9. 阳光双人吧台高脚桌 (2x1, 2座)
      case 'window_counter_seats':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 沿窗细长高脚条桌 */}
            <rect x="14" y="8" width="72" height="16" rx="2" fill="#FFFFFF" />
            <line x1="14" y1="12" x2="86" y2="12" strokeWidth="1.2" strokeDasharray="3 2" />
            {/* 桌上台灯 */}
            <path d="M50 12 L50 4 Q50 2 46 2" strokeWidth="1.8" />
            <polygon points="43,2 49,2 46,6" fill="#1c1917" />
            {/* 2 张圆垫高脚吧台凳 */}
            <ellipse cx="30" cy="34" rx="9" ry="6" fill="#FAF8F5" />
            <line x1="24" y1="36" x2="24" y2="44" strokeWidth="1.8" />
            <line x1="36" y1="36" x2="36" y2="44" strokeWidth="1.8" />
            <ellipse cx="70" cy="34" rx="9" ry="6" fill="#FAF8F5" />
            <line x1="64" y1="36" x2="64" y2="44" strokeWidth="1.8" />
            <line x1="76" y1="36" x2="76" y2="44" strokeWidth="1.8" />
          </svg>
        );

      // 10. 暖光白松落地大书架 (2x1)
      case 'tall_pine_bookshelf':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 落地书架外框 */}
            <rect x="8" y="8" width="84" height="34" rx="2" fill="#FFFFFF" />
            {/* 中间立柱与层板 */}
            <line x1="50" y1="8" x2="50" y2="42" strokeWidth="2" />
            <line x1="8" y1="25" x2="92" y2="25" strokeWidth="2" />
            {/* 第一层书脊阵列 */}
            <rect x="12" y="11" width="5" height="12" fill="#1c1917" />
            <rect x="19" y="13" width="6" height="10" fill="#FAF8F5" />
            <rect x="27" y="10" width="5" height="13" fill="#FFFFFF" />
            <rect x="34" y="12" width="7" height="11" fill="#FAF8F5" />
            <polygon points="42,12 47,15 45,23 40,23" fill="#FFFFFF" />
            {/* 第二层书籍与书立 */}
            <rect x="54" y="11" width="6" height="12" fill="#FAF8F5" />
            <rect x="62" y="13" width="8" height="10" fill="#1c1917" />
            <rect x="72" y="10" width="6" height="13" fill="#FFFFFF" />
            <circle cx="84" cy="18" r="4" fill="#FAF8F5" strokeWidth="1.5" />
            {/* 底层厚重书籍 */}
            <rect x="14" y="27" width="8" height="13" fill="#FAF8F5" />
            <rect x="24" y="27" width="6" height="13" fill="#1c1917" />
            <rect x="56" y="27" width="7" height="13" fill="#FFFFFF" />
            <rect x="65" y="27" width="9" height="13" fill="#FAF8F5" />
          </svg>
        );

      // 11. 矮柜展示绘本书架 (1x1)
      case 'low_comic_bookcase':
        return (
          <svg viewBox="0 0 50 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="10" width="38" height="32" rx="2" fill="#FFFFFF" />
            <line x1="6" y1="26" x2="44" y2="26" strokeWidth="2" />
            {/* 封面朝外展示的书本 */}
            <rect x="10" y="13" width="14" height="11" rx="1" fill="#FAF8F5" />
            <circle cx="17" cy="18" r="2.5" fill="#1c1917" />
            <rect x="27" y="13" width="13" height="11" rx="1" fill="#FFFFFF" />
            <line x1="30" y1="16" x2="37" y2="16" strokeWidth="1.5" />
            <line x1="30" y1="20" x2="37" y2="20" strokeWidth="1.5" />
            {/* 下层立放绘本 */}
            <rect x="10" y="28" width="4" height="12" fill="#1c1917" />
            <rect x="16" y="30" width="5" height="10" fill="#FAF8F5" />
            <rect x="23" y="28" width="6" height="12" fill="#FFFFFF" />
            <rect x="31" y="29" width="4" height="11" fill="#1c1917" />
          </svg>
        );

      // 12. 剑麻缠绕四层猫爬架 (1x1)
      case 'sisal_cat_tree':
        return (
          <svg viewBox="0 0 50 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 稳固实木底座 */}
            <rect x="8" y="38" width="34" height="6" rx="2" fill="#FAF8F5" />
            {/* 剑麻抓柱 */}
            <rect x="21" y="10" width="8" height="28" fill="#FFFFFF" />
            <line x1="21" y1="16" x2="29" y2="16" strokeWidth="1.2" strokeDasharray="2 1" />
            <line x1="21" y1="22" x2="29" y2="22" strokeWidth="1.2" strokeDasharray="2 1" />
            <line x1="21" y1="28" x2="29" y2="28" strokeWidth="1.2" strokeDasharray="2 1" />
            <line x1="21" y1="34" x2="29" y2="34" strokeWidth="1.2" strokeDasharray="2 1" />
            {/* 中间眺望台 */}
            <ellipse cx="16" cy="24" rx="9" ry="4.5" fill="#FAF8F5" />
            {/* 顶层猫头形状眺望窝 */}
            <ellipse cx="25" cy="10" rx="14" ry="6" fill="#FAF8F5" />
            <polygon points="13,9 11,3 17,7" fill="#1c1917" />
            <polygon points="37,9 39,3 33,7" fill="#1c1917" />
            {/* 悬挂的小毛球 */}
            <line x1="14" y1="13" x2="14" y2="19" strokeWidth="1.5" />
            <circle cx="14" cy="20" r="2.5" fill="#1c1917" />
          </svg>
        );

      // 13. 羊羔绒软蓬蓬猫窝 (1x1)
      case 'soft_fluffy_cat_bed':
        return (
          <svg viewBox="0 0 50 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 软蓬蓬云朵边缘 */}
            <ellipse cx="25" cy="27" rx="18" ry="14" fill="#FFFFFF" />
            {/* 深陷柔软内圈 */}
            <ellipse cx="25" cy="28" rx="12" ry="9" fill="#FAF8F5" />
            {/* 踩奶内陷褶皱 */}
            <path d="M18 28 Q25 33 32 28" strokeWidth="1.8" />
            {/* 猫耳软枕头 */}
            <circle cx="25" cy="18" r="4.5" fill="#FFFFFF" />
            <polygon points="21,17 19,13 23,15" fill="#1c1917" />
            <polygon points="29,17 31,13 27,15" fill="#1c1917" />
            {/* 呼噜爱心 */}
            <path d="M37 14 C35 11 32 14 34 16 L37 19 L40 16 C42 14 39 11 37 14 Z" fill="#1c1917" stroke="none" transform="scale(0.8) translate(7, -2)" />
          </svg>
        );

      // 14. 天然麻绳猫抓垫与毛球 (1x1)
      case 'yarn_scratching_mat':
        return (
          <svg viewBox="0 0 50 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* 椭圆剑麻抓垫 */}
            <ellipse cx="25" cy="27" rx="18" ry="12" fill="#FFFFFF" />
            <ellipse cx="25" cy="27" rx="13" ry="8" strokeDasharray="3 2" fill="#FAF8F5" />
            {/* 爪爪抓痕 */}
            <line x1="20" y1="24" x2="24" y2="28" strokeWidth="1.8" />
            <line x1="24" y1="23" x2="27" y2="28" strokeWidth="1.8" />
            <line x1="28" y1="24" x2="31" y2="28" strokeWidth="1.8" />
            {/* 滚动的毛线球与散开的线 */}
            <circle cx="34" cy="16" r="6" fill="#FFFFFF" strokeWidth="2.2" />
            <path d="M31 14 Q34 18 37 14" strokeWidth="1.5" />
            <path d="M30 18 Q35 22 41 18" strokeWidth="1.5" />
          </svg>
        );

      // 默认兜底家具简笔画
      default:
        return (
          <svg viewBox="0 0 50 50" className="w-full h-full" fill="none" stroke="#1c1917" strokeWidth="2.2">
            <rect x="8" y="10" width="34" height="30" rx="4" fill="#FFFFFF" />
            <circle cx="25" cy="25" r="7" fill="#FAF8F5" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`w-full h-full flex items-center justify-center p-1 pointer-events-none select-none transition-transform duration-150 ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {renderModelSvg()}
    </div>
  );
};
