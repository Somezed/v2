/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 布局网格专属：蓝猫兰兰动态行为形象组件 (LanLanGridAvatar)
 * 特性：
 * 1. 直接融于 8×6 店铺地面，无外边框方盒，自然生动
 * 2. 随 9 大自主行为动态切换手绘姿态 (睡觉、伸腰、揣手、踱步、跑酷、歪头、蹭贴、拍球、滑脱)
 * 3. 点击触发即时情绪猫鸣与交互气泡
 */

import React, { useState } from 'react';
import { LanLanBehavior } from '../types/game';
import { playCatMeowMood } from '../game/audio/soundEffects';

interface LanLanGridAvatarProps {
  behavior: LanLanBehavior;
  facing?: 'LEFT' | 'RIGHT';
  dialogue?: string;
  onClick?: () => void;
  className?: string;
}

export const LanLanGridAvatar: React.FC<LanLanGridAvatarProps> = ({
  behavior,
  facing = 'RIGHT',
  dialogue,
  onClick,
  className = '',
}) => {
  const [showBubble, setShowBubble] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 根据行为播放对应情绪猫鸣
    if (behavior === 'SLEEPING' || behavior === 'RESTING') {
      playCatMeowMood('LAZY');
    } else if (behavior === 'REFUSING_HUG') {
      playCatMeowMood('GRUMPY');
    } else if (behavior === 'APPROACHING') {
      playCatMeowMood('COZY');
    } else {
      playCatMeowMood('SWEET');
    }
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 2400);

    if (onClick) {
      onClick();
    }
  };

  const isFlipped = facing === 'LEFT';

  // 行为气泡台词与动作标题
  const behaviorDetails: Record<LanLanBehavior, { title: string; defaultQuote: string }> = {
    SLEEPING: { title: '睡大懒觉', defaultQuote: '呼噜噜……大懒觉时间 zZ' },
    STRETCHING: { title: '伸大懒腰', defaultQuote: '唔嗯～舒舒服服抻抻背🐾' },
    RESTING: { title: '揣手手发呆', defaultQuote: '揣手手，安静看窗外～🍞' },
    WALKING: { title: '巡视书咖', defaultQuote: '优雅巡视我的书咖地盘🚶' },
    ZOOMING: { title: '突然跑酷', defaultQuote: '起飞！追小飞虫跑酷⚡' },
    OBSERVING: { title: '歪头观察', defaultQuote: '歪头盯——你在看什么书？👀' },
    APPROACHING: { title: '蹭蹭贴贴', defaultQuote: '贴贴豆哥裤腿，求摸摸下巴❤️' },
    PLAYING_YARN: { title: '拍毛线球', defaultQuote: '看我无影肉垫爪啪啪拍球！🧶' },
    REFUSING_HUG: { title: '傲娇滑脱', defaultQuote: '泥鳅滑脱！摸摸可以，抱抱达咩🚫' },
  };

  const currentDetail = behaviorDetails[behavior] || behaviorDetails.RESTING;
  const quote = dialogue || currentDetail.defaultQuote;

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center cursor-pointer select-none group z-30 transition-transform duration-150 hover:scale-110 ${className}`}
      title={`蓝猫兰兰 (${currentDetail.title}) - 点击听猫叫与互动`}
    >
      {/* 实时台词交互气泡 */}
      {showBubble && (
        <div className="absolute -top-10 z-40 px-2 py-0.5 rounded-lg border-1.5 border-stone-900 bg-white shadow-[2px_2px_0px_#1c1917] text-[10px] font-bold text-stone-900 whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
          <span>{quote}</span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border-r-1.5 border-b-1.5 border-stone-900 rotate-45" />
        </div>
      )}

      {/* 蓝猫兰兰根据不同行为呈现的纯手绘矢量线稿 (无方框容器，直接悬浮在地面网格) */}
      <svg
        viewBox="0 0 80 60"
        className="w-14 h-11 sm:w-16 sm:h-12 drop-shadow-sm"
        fill="none"
        stroke="#1c1917"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: isFlipped ? 'scaleX(-1)' : 'none',
          transformOrigin: 'center center',
        }}
      >
        {/* 1. 睡觉：圆滚滚毛球卷着尾巴 */}
        {behavior === 'SLEEPING' && (
          <g>
            <ellipse cx="40" cy="36" rx="24" ry="16" fill="#F4F2EF" />
            <path d="M58 38 C68 34 68 20 56 22 C48 24 48 32 46 36" strokeWidth="2.5" />
            <circle cx="30" cy="33" r="14" fill="#FFFFFF" />
            <polygon points="21,24 17,16 27,22" fill="#FFFFFF" />
            <polygon points="34,23 42,16 39,26" fill="#FFFFFF" />
            {/* 眯眯眼 */}
            <path d="M23 35 Q26 38 29 35" strokeWidth="1.8" />
            <path d="M31 35 Q34 38 37 35" strokeWidth="1.8" />
            {/* 鼻子 */}
            <polygon points="30,38 32,38 31,40" fill="#1c1917" />
            {/* 手绘 zZ 动态 */}
            <text x="52" y="16" fill="#1c1917" fontSize="10" fontWeight="bold" className="font-doodle animate-bounce">
              zZ
            </text>
          </g>
        )}

        {/* 2. 伸懒腰：前爪下压伸展 */}
        {behavior === 'STRETCHING' && (
          <g>
            <path d="M22 46 Q32 44 42 34 Q54 22 66 28 Q72 36 65 44 Z" fill="#F4F2EF" />
            {/* 翘起的尾巴 */}
            <path d="M66 28 C74 16 78 8 72 6 C68 5 66 12 67 18" strokeWidth="2.5" />
            {/* 下压前爪 */}
            <ellipse cx="18" cy="48" rx="5" ry="3" fill="#FFFFFF" />
            <ellipse cx="28" cy="48" rx="5" ry="3" fill="#FFFFFF" />
            {/* 大圆脸 */}
            <circle cx="24" cy="38" r="12" fill="#FFFFFF" />
            <polygon points="16,30 14,22 22,28" fill="#FFFFFF" />
            <polygon points="26,29 34,22 32,30" fill="#FFFFFF" />
            {/* 享受的眯眼 */}
            <path d="M18 39 Q21 42 24 39" strokeWidth="1.6" />
            <path d="M26 39 Q29 42 32 39" strokeWidth="1.6" />
            <polygon points="24,42 26,42 25,43.5" fill="#1c1917" />
          </g>
        )}

        {/* 3. 揣手手发呆：经典猫猫面包 loaf 姿态 */}
        {behavior === 'RESTING' && (
          <g>
            <ellipse cx="42" cy="38" rx="22" ry="14" fill="#F4F2EF" />
            <circle cx="30" cy="30" r="14" fill="#FFFFFF" />
            <polygon points="20,20 16,11 26,18" fill="#FFFFFF" />
            <polygon points="34,19 44,11 40,22" fill="#FFFFFF" />
            {/* 琥珀金大眼睛半眯 */}
            <ellipse cx="25" cy="30" rx="3" ry="2" fill="#F59E0B" />
            <ellipse cx="35" cy="30" rx="3" ry="2" fill="#F59E0B" />
            <ellipse cx="25" cy="30" rx="1.2" ry="2" fill="#1c1917" />
            <ellipse cx="35" cy="30" rx="1.2" ry="2" fill="#1c1917" />
            {/* 腮帮胡须 */}
            <line x1="16" y1="32" x2="8" y2="30" strokeWidth="1.2" />
            <line x1="16" y1="34" x2="8" y2="35" strokeWidth="1.2" />
            <line x1="44" y1="32" x2="52" y2="30" strokeWidth="1.2" />
            <line x1="44" y1="34" x2="52" y2="35" strokeWidth="1.2" />
            {/* 盘在身侧的尾巴 */}
            <path d="M60 40 C66 40 68 44 60 46" strokeWidth="2.5" />
          </g>
        )}

        {/* 4. 自由走动：迈步走姿 */}
        {behavior === 'WALKING' && (
          <g>
            <ellipse cx="38" cy="32" rx="18" ry="12" fill="#F4F2EF" />
            {/* 四只迈步脚爪 */}
            <path d="M26 40 L24 49" strokeWidth="2.4" />
            <path d="M32 40 L34 48" strokeWidth="2.4" />
            <path d="M46 40 L44 49" strokeWidth="2.4" />
            <path d="M52 40 L55 48" strokeWidth="2.4" />
            {/* 竖起的小尾巴 */}
            <path d="M54 28 C64 22 62 10 58 8" strokeWidth="2.5" />
            {/* 头部 */}
            <circle cx="24" cy="24" r="12" fill="#FFFFFF" />
            <polygon points="16,16 13,8 22,14" fill="#FFFFFF" />
            <polygon points="26,15 34,8 31,18" fill="#FFFFFF" />
            <circle cx="20" cy="24" r="2.2" fill="#F59E0B" />
            <circle cx="27" cy="24" r="2.2" fill="#F59E0B" />
            <circle cx="20" cy="24" r="1" fill="#1c1917" />
            <circle cx="27" cy="24" r="1" fill="#1c1917" />
          </g>
        )}

        {/* 5. 突然跑酷：飞机耳与冲刺残影 */}
        {behavior === 'ZOOMING' && (
          <g>
            {/* 跑酷风线 */}
            <line x1="4" y1="28" x2="16" y2="28" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="2" y1="36" x2="14" y2="36" strokeWidth="1.5" strokeDasharray="3 2" />
            <ellipse cx="44" cy="34" rx="20" ry="10" fill="#F4F2EF" />
            <path d="M28 42 L22 49" strokeWidth="2.5" />
            <path d="M58 40 L64 48" strokeWidth="2.5" />
            <path d="M62 30 C74 24 76 14 70 12" strokeWidth="2.5" />
            {/* 冲刺压低头与飞机耳 */}
            <circle cx="28" cy="26" r="11" fill="#FFFFFF" />
            <polygon points="18,22 10,20 18,26" fill="#FFFFFF" />
            <polygon points="32,20 40,18 34,24" fill="#FFFFFF" />
            <circle cx="24" cy="26" r="2" fill="#1c1917" />
          </g>
        )}

        {/* 6. 歪头好奇观察 */}
        {behavior === 'OBSERVING' && (
          <g>
            <ellipse cx="42" cy="38" rx="18" ry="13" fill="#F4F2EF" />
            <path d="M58 36 C68 30 68 18 64 14" strokeWidth="2.4" />
            {/* 歪头 */}
            <g transform="rotate(12 28 26)">
              <circle cx="28" cy="26" r="13" fill="#FFFFFF" />
              <polygon points="18,17 14,8 24,15" fill="#FFFFFF" />
              <polygon points="32,16 42,9 38,19" fill="#FFFFFF" />
              <circle cx="24" cy="26" r="3" fill="#F59E0B" />
              <circle cx="33" cy="26" r="3" fill="#F59E0B" />
              <circle cx="24" cy="26" r="1.5" fill="#1c1917" />
              <circle cx="33" cy="26" r="1.5" fill="#1c1917" />
              <polygon points="28,30 30,30 29,32" fill="#1c1917" />
            </g>
          </g>
        )}

        {/* 7. 主动蹭贴求摸摸 */}
        {behavior === 'APPROACHING' && (
          <g>
            <ellipse cx="40" cy="36" rx="18" ry="13" fill="#F4F2EF" />
            <circle cx="26" cy="28" r="12" fill="#FFFFFF" />
            <polygon points="17,19 13,11 22,17" fill="#FFFFFF" />
            <polygon points="28,18 36,11 34,21" fill="#FFFFFF" />
            <path d="M21 28 Q24 31 27 28" strokeWidth="1.8" />
            <path d="M29 28 Q32 31 35 28" strokeWidth="1.8" />
            <path d="M56 34 C64 26 62 14 58 10" strokeWidth="2.5" />
            {/* 示爱小爱心 */}
            <path d="M26 10 C24 6 18 8 20 12 L26 18 L32 12 C34 8 28 6 26 10 Z" fill="#F43F5E" stroke="none" className="animate-pulse" />
          </g>
        )}

        {/* 8. 拍打毛线球 */}
        {behavior === 'PLAYING_YARN' && (
          <g>
            <ellipse cx="44" cy="36" rx="18" ry="12" fill="#F4F2EF" />
            <circle cx="30" cy="28" r="12" fill="#FFFFFF" />
            <polygon points="21,19 17,11 26,17" fill="#FFFFFF" />
            <polygon points="32,18 40,11 38,21" fill="#FFFFFF" />
            <circle cx="26" cy="28" r="2.5" fill="#F59E0B" />
            <circle cx="34" cy="28" r="2.5" fill="#F59E0B" />
            {/* 伸前爪拍球 */}
            <path d="M22 36 L12 42" strokeWidth="3" stroke="#FFFFFF" />
            <circle cx="11" cy="43" r="3" fill="#FFFFFF" />
            {/* 毛线球与毛线 */}
            <circle cx="6" cy="46" r="5" fill="#10B981" stroke="#1c1917" strokeWidth="1.5" />
            <path d="M8 44 Q14 47 18 45" strokeWidth="1.2" stroke="#10B981" />
          </g>
        )}

        {/* 9. 傲娇拒绝被抱滑脱 */}
        {behavior === 'REFUSING_HUG' && (
          <g>
            <path d="M30 44 Q44 42 56 30 Q62 18 54 22 Z" fill="#F4F2EF" />
            {/* 后跳滑脱小虚线 */}
            <line x1="62" y1="42" x2="72" y2="42" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="30" cy="26" r="12" fill="#FFFFFF" />
            <polygon points="20,18 16,10 25,16" fill="#FFFFFF" />
            <polygon points="32,17 40,10 37,20" fill="#FFFFFF" />
            <path d="M24 26 L28 29" strokeWidth="1.8" />
            <path d="M28 26 L24 29" strokeWidth="1.8" />
            <path d="M32 26 L36 29" strokeWidth="1.8" />
            <path d="M36 26 L32 29" strokeWidth="1.8" />
          </g>
        )}
      </svg>

      {/* 底部小名称标签 */}
      <span className="text-[8.5px] font-bold text-stone-900 bg-white/90 px-1 py-0.2 rounded-full border border-stone-800 shadow-[0.5px_0.5px_0px_#1c1917] pointer-events-none mt-0.5 leading-none">
        兰兰 · {currentDetail.title}
      </span>
    </div>
  );
};
