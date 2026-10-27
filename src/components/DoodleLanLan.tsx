/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 蓝猫兰兰 (Lanlan) 手绘简笔画矢量组件 - 真实照片原型定制版
 * 根据真实照片精准还原视觉特征：
 * 1. 经典英短蓝猫圆润大脸盘 (包子脸) 与毛茸茸下巴
 * 2. 标志性明亮清澈的暖琥珀金瞳 (Amber/Copper Eyes) 与深邃瞳孔
 * 3. 微微歪头的好奇专注神态
 * 4. 纯净蓝灰色的毛发手绘阴影与柔软肉垫
 * 5. 支持 9 种自主行为状态流转与真实照片对比
 */

import React, { useState } from 'react';
import {
  LanLanAutonomousState,
  LanLanBehavior,
} from '../types/game';
import { playCatMeowMood, playClickSound } from '../game/audio/soundEffects';
import { Heart, Play, Hand } from 'lucide-react';

interface DoodleLanLanProps {
  behaviorState?: LanLanAutonomousState;
  isPurring?: boolean;
  className?: string;
  onPet?: () => void;
  onAttemptHug?: () => void;
  onPlayYarn?: () => void;
  showControlMenu?: boolean;
  showPhotoBadge?: boolean;
  satiety?: number;
  mood?: number;
}

export const DoodleLanLan: React.FC<DoodleLanLanProps> = ({
  behaviorState,
  isPurring = true,
  className = '',
  onPet,
  onAttemptHug,
  onPlayYarn,
  showControlMenu = true,
}) => {
  const [showInteractionMenu, setShowInteractionMenu] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  // 获取当前行为 (若未传入则默认休息发呆)
  const behavior: LanLanBehavior = behaviorState?.currentBehavior || 'RESTING';
  const bubbleText = behaviorState?.dialogueBubble || (behavior === 'SLEEPING' ? '呼噜噜……大懒觉时间 zZ' : '喵呜~ 歪头看你');
  const isFacingLeft = behaviorState?.facing === 'LEFT';

  // 触发摸摸 (惬意呼噜马达声)
  const handlePet = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playCatMeowMood('COZY');
    setLocalFeedback('摸摸下巴：舒服地打起小马达呼噜噜~');
    setTimeout(() => setLocalFeedback(null), 2500);
    if (onPet) {
      onPet();
    }
  };

  // 触发尝试抱抱 (必定触发傲娇抗议喵)
  const handleHug = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playCatMeowMood('GRUMPY');
    setLocalFeedback('尝试抱抱：兰兰泥鳅般滑脱！“摸摸可以，抱抱不行！”');
    setTimeout(() => setLocalFeedback(null), 2800);
    if (onAttemptHug) {
      onAttemptHug();
    }
  };

  // 触发玩毛球 (欢快清脆喵)
  const handleYarn = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playCatMeowMood('SWEET');
    setLocalFeedback('轻推毛球：兰兰伸出肉垫爪爪啪啪拍球！');
    setTimeout(() => setLocalFeedback(null), 2500);
    if (onPlayYarn) {
      onPlayYarn();
    }
  };

  // 行为状态中文对照与标识
  const behaviorDisplayConfig: Record<LanLanBehavior, { label: string; badgeClass: string; icon: string }> = {
    SLEEPING: { label: '睡大懒觉中', badgeClass: 'bg-stone-100 text-stone-700 border-stone-400', icon: '💤' },
    STRETCHING: { label: '伸个大懒腰', badgeClass: 'bg-amber-100 text-amber-900 border-amber-400', icon: '🐾' },
    RESTING: { label: '揣手手发呆', badgeClass: 'bg-stone-100 text-stone-800 border-stone-800', icon: '🍞' },
    WALKING: { label: '优雅踱步巡视', badgeClass: 'bg-blue-100 text-blue-900 border-blue-400', icon: '🚶' },
    ZOOMING: { label: '突然短跑跑酷！', badgeClass: 'bg-rose-100 text-rose-950 border-rose-500 animate-pulse', icon: '⚡' },
    OBSERVING: { label: '歪头好奇观察', badgeClass: 'bg-purple-100 text-purple-900 border-purple-400', icon: '👀' },
    APPROACHING: { label: '主动贴贴蹭豆哥', badgeClass: 'bg-pink-100 text-pink-900 border-pink-400', icon: '❤️' },
    PLAYING_YARN: { label: '拍打毛线球中', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400', icon: '🧶' },
    REFUSING_HUG: { label: '拒绝被抱傲娇滑脱', badgeClass: 'bg-rose-200 text-rose-950 border-rose-900 font-bold', icon: '🚫' },
  };

  const currentCfg = behaviorDisplayConfig[behavior] || behaviorDisplayConfig.RESTING;

  return (
    <>
      <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
        
        {/* 实时台词心声气泡 */}
        <div className="absolute -top-11 z-20 max-w-[220px] text-center px-2.5 py-1 bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0px_#1c1917] text-[11px] font-bold text-stone-900 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
          <span>{localFeedback || bubbleText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-stone-900 rotate-45" />
        </div>

        {/* 点击主体唤出/收起交互菜单 */}
        <div
          onClick={() => {
            playClickSound();
            if (showControlMenu) {
              setShowInteractionMenu(!showInteractionMenu);
            }
          }}
          className="cursor-pointer group transform transition-transform duration-200 group-hover:scale-105"
          title="蓝猫兰兰 (点击展开抚摸/逗球菜单)"
        >
          <svg
            viewBox="0 0 170 180"
            className="w-36 h-38 drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="#1E1C1A"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isFacingLeft ? 'scaleX(-1)' : 'none',
              transformOrigin: 'center center',
            }}
          >
            {/* 1. 睡懒觉姿态 (SLEEPING: 蜷成大蓝毛球) */}
            {behavior === 'SLEEPING' && (
              <g>
                <ellipse cx="85" cy="120" rx="46" ry="32" fill="#FFFFFF" />
                <path d="M125 125 C145 120 148 95 130 90 C115 88 112 105 110 115" strokeWidth="4" />
                <circle cx="68" cy="115" r="28" fill="#FFFFFF" />
                <polygon points="50,98 44,82 62,94" fill="#FFFFFF" />
                <polygon points="76,96 90,82 86,104" fill="#FFFFFF" />
                <path d="M54 122 Q60 126 66 122" strokeWidth="2.5" />
                <path d="M72 122 Q78 126 84 122" strokeWidth="2.5" />
                <polygon points="68,127 72,127 70,130" fill="#1E1C1A" />
                <text x="110" y="85" fill="#1E1C1A" fontSize="16" fontWeight="bold" className="font-doodle animate-bounce">
                  zZ
                </text>
              </g>
            )}

            {/* 2. 伸懒腰姿态 (STRETCHING) */}
            {behavior === 'STRETCHING' && (
              <g>
                <path d="M40 148 Q60 145 75 130 Q95 105 125 115 Q140 125 132 145 Z" fill="#FFFFFF" />
                <path d="M135 120 C145 95 155 80 148 70 C140 65 136 78 138 90" strokeWidth="4" />
                <ellipse cx="44" cy="154" rx="10" ry="5" fill="#FFFFFF" />
                <ellipse cx="62" cy="154" rx="10" ry="5" fill="#FFFFFF" />
                <circle cx="58" cy="128" r="24" fill="#FFFFFF" />
                <polygon points="46,110 40,92 58,102" fill="#FFFFFF" />
                <polygon points="66,104 80,92 78,112" fill="#FFFFFF" />
                <path d="M48 126 Q54 122 58 126" strokeWidth="2.5" />
                <path d="M64 126 Q70 122 74 126" strokeWidth="2.5" />
                <ellipse cx="61" cy="136" rx="5" ry="7" fill="#1E1C1A" />
              </g>
            )}

            {/* 3. 拒绝被抱姿态 (REFUSING_HUG) */}
            {behavior === 'REFUSING_HUG' && (
              <g className="animate-pulse">
                <path d="M70 145 C50 140 55 110 75 105 C100 100 120 120 110 145 Z" fill="#FFFFFF" strokeWidth="3.5" />
                <path d="M112 140 C130 135 145 115 135 95" strokeWidth="4" />
                <circle cx="50" cy="108" r="8" fill="#FFFFFF" strokeWidth="2.5" />
                <circle cx="50" cy="108" r="3.5" fill="#F43F5E" />
                <circle cx="85" cy="82" r="26" fill="#FFFFFF" />
                <polygon points="68,68 60,48 80,60" fill="#FFFFFF" />
                <polygon points="94,62 108,48 104,70" fill="#FFFFFF" />
                <path d="M74 78 L80 82 L74 86" strokeWidth="2.5" />
                <path d="M96 78 L90 82 L96 86" strokeWidth="2.5" />
                <path d="M82 92 Q85 89 88 92" strokeWidth="2.5" />
                <text x="120" y="60" fontSize="14" fontWeight="bold" fill="#E11D48">
                  喵呜！
                </text>
              </g>
            )}

            {/* 4. 短跑跑酷姿态 (ZOOMING) */}
            {behavior === 'ZOOMING' && (
              <g>
                <ellipse cx="85" cy="125" rx="46" ry="22" fill="#FFFFFF" />
                <path d="M130 120 L150 75" strokeWidth="4.5" />
                <ellipse cx="48" cy="144" rx="8" ry="5" fill="#FFFFFF" />
                <ellipse cx="64" cy="138" rx="7" ry="5" fill="#FFFFFF" />
                <ellipse cx="112" cy="144" rx="8" ry="5" fill="#FFFFFF" />
                <ellipse cx="128" cy="138" rx="7" ry="5" fill="#FFFFFF" />
                <circle cx="58" cy="108" r="24" fill="#FFFFFF" />
                <polygon points="46,92 35,74 56,84" fill="#FFFFFF" />
                <polygon points="68,88 80,72 78,94" fill="#FFFFFF" />
                {/* 铜铃琥珀金大眼睛 */}
                <circle cx="50" cy="106" r="7.5" fill="#D97706" />
                <circle cx="68" cy="106" r="7.5" fill="#D97706" />
                <circle cx="50" cy="106" r="5" fill="#1E1C1A" />
                <circle cx="68" cy="106" r="5" fill="#1E1C1A" />
                <circle cx="48" cy="104" r="2" fill="#FFFFFF" />
                <circle cx="66" cy="104" r="2" fill="#FFFFFF" />
              </g>
            )}

            {/* 5. 玩毛球姿态 (PLAYING_YARN) */}
            {behavior === 'PLAYING_YARN' && (
              <g>
                <ellipse cx="95" cy="130" rx="36" ry="26" fill="#FFFFFF" />
                <path d="M125 140 C140 135 145 115 138 100" strokeWidth="4" />
                <circle cx="44" cy="145" r="14" fill="#FAF8F5" stroke="#1E1C1A" strokeWidth="2.5" />
                <path d="M35 140 Q44 148 53 140" strokeWidth="1.5" />
                <path d="M40 134 Q45 145 42 156" strokeWidth="1.5" />
                <ellipse cx="58" cy="132" rx="7" ry="9" fill="#FFFFFF" strokeWidth="2.5" />
                <circle cx="58" cy="133" r="3.5" fill="#FDA4AF" />
                <circle cx="85" cy="85" r="26" fill="#FFFFFF" />
                <polygon points="68,70 60,50 80,62" fill="#FFFFFF" />
                <polygon points="94,64 108,50 104,72" fill="#FFFFFF" />
                {/* 兴奋琥珀眼 */}
                <circle cx="76" cy="82" r="6.5" fill="#D97706" />
                <circle cx="98" cy="82" r="6.5" fill="#D97706" />
                <circle cx="76" cy="82" r="4.2" fill="#1E1C1A" />
                <circle cx="98" cy="82" r="4.2" fill="#1E1C1A" />
                <circle cx="74" cy="80" r="1.8" fill="#FFFFFF" />
                <circle cx="96" cy="80" r="1.8" fill="#FFFFFF" />
                <polygon points="85,89 89,89 87,93" fill="#1E1C1A" />
              </g>
            )}

            {/* 6. 常规状态 (RESTING / WALKING / OBSERVING / APPROACHING: 经典英短圆脸 + 真实照片琥珀金瞳) */}
            {(behavior === 'RESTING' || behavior === 'WALKING' || behavior === 'OBSERVING' || behavior === 'APPROACHING') && (
              <g
                style={{
                  transform: behavior === 'OBSERVING' ? 'rotate(5deg)' : 'none',
                  transformOrigin: '85px 80px',
                }}
              >
                {/* 摇晃的猫尾巴 */}
                <path
                  d="M120 145 C136 142 146 125 142 105 C140 95 128 98 132 110"
                  strokeWidth="4"
                  fill="none"
                />

                {/* 猫咪饱满圆润身体 */}
                <ellipse cx="85" cy="130" rx="38" ry="28" fill="#FFFFFF" />

                {/* 前爪爪与肉垫线 */}
                <ellipse cx="72" cy="148" rx="8" ry="6" fill="#FFFFFF" />
                <ellipse cx="96" cy="148" rx="8" ry="6" fill="#FFFFFF" />
                <path d="M70 148 L70 152" strokeWidth="2" />
                <path d="M74 148 L74 152" strokeWidth="2" />
                <path d="M94 148 L94 152" strokeWidth="2" />
                <path d="M98 148 L98 152" strokeWidth="2" />

                {/* 经典英短小巧三角形猫耳 */}
                <polygon points="50,62 42,32 70,48" fill="#FFFFFF" strokeWidth="3" />
                <polygon points="52,58 48,40 64,50" fill="#F3F0EB" stroke="#D1D5DB" strokeWidth="1.5" />
                <polygon points="118,62 126,32 98,48" fill="#FFFFFF" strokeWidth="3" />
                <polygon points="116,58 120,40 104,50" fill="#F3F0EB" stroke="#D1D5DB" strokeWidth="1.5" />

                {/* 猫头 (大圆脸，经典发腮包子脸，符合照片) */}
                <ellipse cx="85" cy="78" rx="42" ry="34" fill="#FFFFFF" strokeWidth="3.2" />

                {/* 蓝猫毛色轻微手绘暗影线 */}
                <path d="M50 72 Q44 78 50 84" strokeWidth="2" strokeDasharray="2 3" />
                <path d="M120 72 Q126 78 120 84" strokeWidth="2" strokeDasharray="2 3" />

                {/* 标志性琥珀金瞳 (Amber-Copper Eyes - 照片核心神髓！) */}
                {behavior === 'OBSERVING' ? (
                  <>
                    {/* 歪头好奇大睁眼 */}
                    <ellipse cx="68" cy="74" rx="9" ry="10" fill="#D97706" stroke="#1E1C1A" strokeWidth="2" />
                    <ellipse cx="102" cy="74" rx="9" ry="10" fill="#D97706" stroke="#1E1C1A" strokeWidth="2" />
                    {/* 深邃瞳孔 */}
                    <circle cx="68" cy="74" r="5.5" fill="#1E1C1A" />
                    <circle cx="102" cy="74" r="5.5" fill="#1E1C1A" />
                    {/* 黄金光环下缘微光 */}
                    <path d="M62 76 Q68 81 74 76" stroke="#FDE68A" strokeWidth="1.4" />
                    <path d="M96 76 Q102 81 108 76" stroke="#FDE68A" strokeWidth="1.4" />
                    {/* 澄澈高光反射点 */}
                    <circle cx="65" cy="70" r="2.5" fill="#FFFFFF" />
                    <circle cx="99" cy="70" r="2.5" fill="#FFFFFF" />
                  </>
                ) : behavior === 'APPROACHING' ? (
                  <>
                    <path d="M62 76 Q70 82 76 76" strokeWidth="3" />
                    <path d="M94 76 Q102 82 108 76" strokeWidth="3" />
                    <path d="M124 50 C124 45 130 45 132 48 C134 45 140 45 140 50 C140 55 132 60 132 60 C132 60 124 55 124 50 Z" fill="#F43F5E" />
                  </>
                ) : (
                  <>
                    {/* RESTING / WALKING: 温暖沉静的琥珀金大眼睛 */}
                    <ellipse cx="68" cy="75" rx="8" ry="8.8" fill="#D97706" stroke="#1E1C1A" strokeWidth="1.8" />
                    <ellipse cx="102" cy="75" rx="8" ry="8.8" fill="#D97706" stroke="#1E1C1A" strokeWidth="1.8" />
                    <circle cx="68" cy="75" r="5.0" fill="#1E1C1A" />
                    <circle cx="102" cy="75" r="5.0" fill="#1E1C1A" />
                    <path d="M63 77 Q68 81 73 77" stroke="#FDE68A" strokeWidth="1.2" />
                    <path d="M97 77 Q102 81 107 77" stroke="#FDE68A" strokeWidth="1.2" />
                    <circle cx="65" cy="72" r="2.2" fill="#FFFFFF" />
                    <circle cx="99" cy="72" r="2.2" fill="#FFFFFF" />
                  </>
                )}

                {/* 倒三角小鼻与软萌三瓣嘴 */}
                <polygon points="82,85 88,85 85,89" fill="#1E1C1A" strokeWidth="1" />
                <path d="M85 89 L85 92" strokeWidth="2.5" />
                <path d="M78 93 Q85 95 85 92 Q85 95 92 93" strokeWidth="2.5" />

                {/* 猫胡须 */}
                <line x1="46" y1="84" x2="28" y2="80" strokeWidth="2" />
                <line x1="46" y1="88" x2="25" y2="88" strokeWidth="2" />
                <line x1="46" y1="92" x2="29" y2="96" strokeWidth="2" />
                <line x1="124" y1="84" x2="142" y2="80" strokeWidth="2" />
                <line x1="124" y1="88" x2="145" y2="88" strokeWidth="2" />
                <line x1="124" y1="92" x2="141" y2="96" strokeWidth="2" />

                {/* 细小项圈与金色小铃铛 */}
                <path d="M60 104 C70 110 100 110 110 104" strokeWidth="3" />
                <circle cx="85" cy="111" r="4.5" fill="#FBBF24" stroke="#1E1C1A" strokeWidth="1.8" />
              </g>
            )}

          </svg>
        </div>

        {/* 角色徽标与当前自主状态 */}
        <div className="mt-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-stone-900 bg-white text-xs font-bold shadow-[1px_1px_0px_#1c1917]">
            <span>蓝猫·兰兰</span>
            <span className="text-[10px] text-stone-500 font-normal">英短蓝猫</span>
          </div>
          
          <div className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 shadow-xs ${currentCfg.badgeClass}`}>
            <span>{currentCfg.icon}</span>
            <span>{currentCfg.label}</span>
            {isPurring && <span className="text-[10px] text-emerald-700">· 呼噜中</span>}
          </div>


        </div>

        {/* 交互菜单弹层 (点击兰兰时展开) */}
        {showControlMenu && showInteractionMenu && (
          <div className="mt-2 p-2 bg-white border-2 border-stone-900 rounded-xl shadow-[3px_3px_0px_#1c1917] flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 z-30">
            <button
              onClick={handlePet}
              className="doodle-btn px-2 py-1 text-[11px] font-bold flex items-center gap-1 hover:bg-stone-100"
              title="摸摸下巴 (纯陪伴治愈，听听呼噜声)"
            >
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
              <span>摸摸下巴</span>
            </button>

            <button
              onClick={handleYarn}
              className="doodle-btn px-2 py-1 text-[11px] font-bold flex items-center gap-1 hover:bg-stone-100"
              title="拨动毛球 (看兰兰活泼拍球互动)"
            >
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
              <span>逗逗毛球</span>
            </button>

            <button
              onClick={handleHug}
              className="doodle-btn px-2 py-1 text-[11px] font-bold flex items-center gap-1 hover:bg-stone-100"
              title="尝试抱抱 (体验傲娇滑脱，无好感惩罚)"
            >
              <Hand className="w-3.5 h-3.5 text-stone-600" />
              <span>尝试抱抱</span>
            </button>
          </div>
        )}

      </div>
    </>
  );
};
