/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 豆哥 (Brother Dou) 手绘简笔画矢量组件 - 真实照片原型定制版
 * 根据真实照片精准还原视觉特征：
 * 1. 标志性黑色针织冷帽，帽檐绣有白色手写体 "Call"
 * 2. 标志性大圆框纤细金属眼镜
 * 3. 乌黑柔顺长发垂落于肩侧
 * 4. 浅粉色高领拉链羽绒冬装，悬挂标志性粉色拉链飘带
 * 5. 休闲时双手捧着浅粉色手机浏览美甲、玩抓大鹅
 * 6. 支持点击查看真实原型照片对比弹窗
 */

import React from 'react';
import { DouGeActionType } from '../types/game';
import { PRESS_ON_NAILS } from '../game/config/douGeLifeData';

interface DoodleDouGeProps {
  action?: DouGeActionType | 'BREWING' | 'TENDING_CAT' | 'ORGANIZING_BOOKS';
  energy?: number;
  mood?: number;
  activeNailId?: string | null;
  className?: string;
  speechText?: string;
  onClick?: () => void;
  showPhotoBadge?: boolean;
}

export const DoodleDouGe: React.FC<DoodleDouGeProps> = ({
  action = 'IDLE',
  energy = 100,
  mood = 90,
  activeNailId = null,
  className = '',
  speechText,
  onClick,
}) => {
  const activeNail = activeNailId ? PRESS_ON_NAILS.find((n) => n.id === activeNailId) : null;

  // 动作文本标签
  const getActionLabel = () => {
    switch (action) {
      case 'BROWSING_NAILS':
        return '💅 挑穿戴甲';
      case 'PLAYING_GOOSE':
        return '🪿 抓大鹅中';
      case 'WATCHING_ANIME':
        return '🎬 追短剧中';
      case 'COOKING':
      case 'BREWING':
        return '☕ 制作出餐';
      case 'PREPARING':
        return '📋 盘点备料';
      case 'RESTING':
        return '🍵 偷闲休息';
      default:
        return '📖 温暖看店';
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`relative inline-flex flex-col items-center select-none cursor-pointer group ${className}`}
        title="店长豆哥 (点击互动或查看日常生活)"
      >
        {/* 顶部随笔小对话气泡 (如有) */}
        {speechText && (
          <div className="absolute -top-12 z-20 px-3 py-1.5 max-w-[210px] text-center bg-white border-2 border-stone-900 rounded-xl text-[11px] font-bold shadow-[2px_2px_0px_#1c1917] animate-in fade-in slide-in-from-bottom-2">
            <p className="line-clamp-2 leading-tight text-stone-800">{speechText}</p>
            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-stone-900" />
          </div>
        )}

        <svg
          viewBox="0 0 160 190"
          className="w-36 h-42 drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#1E1C1A"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 背景轻柔光晕 */}
          <circle cx="80" cy="95" r="74" fill="#FAF8F5" stroke="#E5E0D8" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* 动态手绘环境点缀 */}
          {action === 'BROWSING_NAILS' || activeNail ? (
            <g className="animate-pulse">
              <path d="M130 75 L133 82 L140 85 L133 88 L130 95 L127 88 L120 85 L127 82 Z" fill="#1E1C1A" stroke="none" transform="scale(0.55) translate(80, 40)" />
              <path d="M28 85 L30 89 L35 91 L30 93 L28 97 L26 93 L21 91 L26 89 Z" fill="#1E1C1A" stroke="none" transform="scale(0.6) translate(10, 50)" />
            </g>
          ) : action === 'PLAYING_GOOSE' ? (
            <g className="animate-bounce">
              <text x="122" y="75" fontSize="13" fontWeight="bold" fill="#1E1C1A" stroke="none" fontFamily="monospace">嘎!</text>
            </g>
          ) : action === 'WATCHING_ANIME' ? (
            <g className="animate-pulse">
              <path d="M125 75 Q135 80 125 90" stroke="#1E1C1A" strokeWidth="1.8" />
              <path d="M130 70 Q145 80 130 95" stroke="#6B7280" strokeWidth="1.5" />
            </g>
          ) : (
            <>
              <path d="M125 105 Q128 95 125 85 Q122 75 126 65" stroke="#9CA3AF" strokeWidth="2" className="animate-pulse" />
              <path d="M132 103 Q136 93 133 83 Q130 73 134 63" stroke="#CBD5E1" strokeWidth="1.8" className="animate-pulse delay-100" />
            </>
          )}

          {/* 豆哥及肩乌黑秀发 (长发自然垂于肩部两侧，符合照片) */}
          <path
            d="M40 70 C34 98 42 135 48 152 C45 130 46 95 50 78 Z"
            fill="#1E1C1A"
            stroke="#1E1C1A"
            strokeWidth="1.5"
          />
          <path
            d="M120 70 C126 98 118 135 112 152 C115 130 114 95 110 78 Z"
            fill="#1E1C1A"
            stroke="#1E1C1A"
            strokeWidth="1.5"
          />

          {/* 脸部轮廓 (圆润饱满、微俯视角) */}
          <path
            d="M48 68 C48 95 62 106 80 106 C98 106 112 95 112 68"
            fill="#FFFFFF"
          />

          {/* 标志性黑色针织冷帽 (Beanie) - 饱满圆弧顶与卷边帽檐 */}
          <path
            d="M45 58 C45 22 60 12 80 12 C100 12 115 22 115 58 Z"
            fill="#1E1C1A"
          />
          {/* 帽子折边 */}
          <rect x="42" y="48" width="76" height="16" rx="5" fill="#1E1C1A" stroke="#FFFFFF" strokeWidth="1.2" />
          
          {/* 帽子正前方白色手写体刺绣 "Call" (照片核心特征！) */}
          <text
            x="80"
            y="60"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="bold"
            fontFamily="cursive, Georgia, serif"
            stroke="none"
            letterSpacing="0.8"
          >
            Call
          </text>

          {/* 额前细碎自然刘海 */}
          <path d="M52 64 Q62 68 70 65" stroke="#1E1C1A" strokeWidth="2.2" />
          <path d="M90 65 Q98 68 108 64" stroke="#1E1C1A" strokeWidth="2.2" />

          {/* 耳朵 */}
          <path d="M47 75 C42 75 42 84 47 84" fill="#FFFFFF" />
          <path d="M113 75 C118 75 118 84 113 84" fill="#FFFFFF" />

          {/* 标志性大圆框纤细眼镜 (照片核心特征！) */}
          <circle cx="65" cy="76" r="13.5" fill="#FFFFFF" fillOpacity="0.85" strokeWidth="2.4" />
          <circle cx="95" cy="76" r="13.5" fill="#FFFFFF" fillOpacity="0.85" strokeWidth="2.4" />
          {/* 镜梁中梁与镜腿 */}
          <path d="M78.5 75 L81.5 75" strokeWidth="2.4" />
          <path d="M51.5 75 L45 74" strokeWidth="2" />
          <path d="M108.5 75 L115 74" strokeWidth="2" />

          {/* 眼神：根据状态切换微表情 */}
          {action === 'PLAYING_GOOSE' ? (
            <>
              <circle cx="66" cy="76" r="3.2" fill="#1E1C1A" />
              <circle cx="94" cy="76" r="3.2" fill="#1E1C1A" />
              <path d="M57 65 Q66 66 71 63" strokeWidth="2" />
              <path d="M89 63 Q94 66 103 65" strokeWidth="2" />
              <path d="M110 68 Q108 63 110 60 Q112 63 110 68 Z" fill="#1E1C1A" stroke="none" />
            </>
          ) : action === 'BROWSING_NAILS' ? (
            <>
              <path d="M60 76 Q66 71 72 76" strokeWidth="2.8" />
              <path d="M88 76 Q94 71 100 76" strokeWidth="2.8" />
              <path d="M58 64 Q66 61 72 64" strokeWidth="2" />
              <path d="M88 64 Q94 61 102 64" strokeWidth="2" />
            </>
          ) : (
            <>
              {/* 沉静温和杏仁大眼 (带瞳孔高光) */}
              <circle cx="66" cy="76" r="3.0" fill="#1E1C1A" />
              <circle cx="94" cy="76" r="3.0" fill="#1E1C1A" />
              <circle cx="65" cy="75" r="1.0" fill="#FFFFFF" />
              <circle cx="93" cy="75" r="1.0" fill="#FFFFFF" />
              <path d="M58 65 Q66 63 72 66" strokeWidth="2" />
              <path d="M88 66 Q94 63 102 65" strokeWidth="2" />
            </>
          )}

          {/* 小巧鼻尖与亲切微笑 */}
          <path d="M79 84 Q80 86 82 85" strokeWidth="1.8" />
          <path d="M74 91 Q80 96 86 91" strokeWidth="2.5" />
          {/* 自然淡唇色 */}
          <path d="M75 92 Q80 94 85 92" stroke="#F43F5E" strokeWidth="1.5" strokeOpacity="0.4" />

          {/* 脖子与高领拉链冬装领口 (照片粉色羽绒高领) */}
          <path d="M68 105 L68 116 L92 116 L92 105" fill="#FFFFFF" />
          {/* 浅粉色高领领圈 */}
          <rect x="62" y="108" width="36" height="14" rx="4" fill="#FDF2F4" stroke="#1E1C1A" strokeWidth="2.5" />
          <line x1="80" y1="108" x2="80" y2="122" strokeWidth="2" stroke="#1E1C1A" />
          {/* 高领标志性粉色拉链细长布条吊坠 (照片中格外显眼的粉色拉绳) */}
          <rect x="82" y="120" width="3" height="15" rx="1.5" fill="#F472B6" stroke="#1E1C1A" strokeWidth="1.5" />

          {/* 浅粉色冬装外套身体 (粉白质感，宽松舒适) */}
          <path
            d="M40 148 C40 120 54 114 80 114 C106 114 120 120 120 148 L124 176 L36 176 Z"
            fill="#FDF2F4"
            strokeWidth="3.2"
          />

          {/* 衣服绗缝羽绒横纹 */}
          <path d="M42 144 Q80 150 118 144" stroke="#D1D5DB" strokeWidth="1.6" />
          <path d="M40 162 Q80 168 120 162" stroke="#D1D5DB" strokeWidth="1.6" />

          {/* 手持道具切换 */}
          {action === 'PLAYING_GOOSE' || action === 'BROWSING_NAILS' || action === 'WATCHING_ANIME' || action === 'RESTING' ? (
            // 休闲时捧着粉色手机 (照片中专注看粉壳手机)
            <g>
              <path d="M48 142 Q60 136 70 144" strokeWidth="2.8" />
              <path d="M112 142 Q100 136 90 144" strokeWidth="2.8" />
              
              {/* 粉色手机本体 */}
              <rect x="68" y="122" width="24" height="38" rx="4" fill="#FDF2F4" stroke="#1E1C1A" strokeWidth="2.6" />
              <line x1="76" y1="125" x2="84" y2="125" strokeWidth="1.5" />
              
              {/* 手机屏幕内容 */}
              {action === 'PLAYING_GOOSE' ? (
                <g>
                  <circle cx="80" cy="136" r="4" fill="#1E1C1A" />
                  <path d="M80 140 C76 140 75 148 80 148 C85 148 84 140 80 140 Z" fill="#1E1C1A" />
                  <path d="M83 135 L88 136 L83 138 Z" fill="#1E1C1A" stroke="none" />
                </g>
              ) : action === 'BROWSING_NAILS' ? (
                <g>
                  <rect x="72" y="130" width="7" height="10" rx="1.5" fill="#FFFFFF" strokeWidth="1.2" />
                  <rect x="81" y="130" width="7" height="10" rx="1.5" fill="#FFFFFF" strokeWidth="1.2" />
                  <line x1="72" y1="144" x2="88" y2="144" strokeWidth="1.2" />
                </g>
              ) : (
                <path d="M78 134 L86 139 L78 144 Z" fill="#1E1C1A" strokeWidth="1.5" />
              )}

              {/* 指尖穿戴甲细节高光 (双手大拇指) */}
              {activeNail && (
                <>
                  <circle cx="68" cy="142" r="2.2" fill="#1E1C1A" />
                  <circle cx="92" cy="142" r="2.2" fill="#1E1C1A" />
                </>
              )}
            </g>
          ) : (
            // 工作出餐时手持热咖啡杯
            <g>
              <path
                d="M116 128 C124 128 128 133 128 142 C128 150 123 153 116 153"
                fill="#FFFFFF"
                strokeWidth="2.5"
              />
              <rect x="118" y="122" width="16" height="18" rx="3" fill="#FFFFFF" strokeWidth="2.5" />
              <path d="M134 126 C139 126 139 134 134 136" strokeWidth="2.2" />
              {activeNail && (
                <circle cx="116" cy="130" r="2" fill="#1E1C1A" />
              )}
            </g>
          )}
        </svg>

        {/* 豆哥角色标签 */}
        <div className="mt-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-stone-900 bg-white text-xs font-bold shadow-[1px_1px_0px_#1c1917]">
            <span>店长·豆哥</span>
            <span className="text-[10px] text-stone-600 font-medium">
              {getActionLabel()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
