/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 蓝猫兰兰自主生活展示与陪伴面板 (LanLanLifeView)
 * 职责：
 * 1. 呈现兰兰的九大自主行为状态与实时动作
 * 2. 玩家互动：摸摸下巴、尝试抱抱（触发傲娇滑脱拒绝）、拨动玩耍毛球
 * 3. 展现兰兰的五大核心性格档案与趣味生活数据
 * 4. 设施摆放效果与书咖氛围微加成反馈
 * 5. 严格坚守设计底线：无强制打卡喂食、无清洁惩罚条、纯自主陪伴
 */

import React, { useState } from 'react';
import {
  GameSaveData,
  LanLanAutonomousState,
  LanLanBehavior,
} from '../types/game';
import {
  tickLanLanAutonomous,
  attemptHugLanLan,
  petLanLan,
  playWithYarnBall,
  getLanLanAtmosphereBonus,
  findCatFacilityPositions,
} from '../game/engine/lanlanEngine';
import { createDefaultLanLanBehaviorState } from '../game/config/lanlanData';
import { DoodleLanLan } from './DoodleLanLan';
import {
  Heart,
  Hand,
  Sparkles,
  ShieldCheck,
  Coffee,
  Info,
  Smile,
  AlertCircle,
  HelpCircle,
  Moon,
  Zap,
} from 'lucide-react';
import { playClickSound, playMeowSound } from '../game/audio/soundEffects';

interface LanLanLifeViewProps {
  gameState: GameSaveData;
  onUpdateState: (newState: GameSaveData) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const LanLanLifeView: React.FC<LanLanLifeViewProps> = ({
  gameState,
  onUpdateState,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'INTERACT' | 'HABITS' | 'FACILITIES'>('INTERACT');
  const behaviorState: LanLanAutonomousState = gameState.lanLan.behavior || createDefaultLanLanBehaviorState();

  // 店内猫咪设施
  const facilities = findCatFacilityPositions(gameState.placedFurniture);
  const atmosphereBonus = getLanLanAtmosphereBonus(behaviorState);

  // 1. 抚摸下巴
  const handlePet = () => {
    playMeowSound();
    const { nextState, message } = petLanLan(behaviorState);
    onUpdateState({
      ...gameState,
      lanLan: {
        ...gameState.lanLan,
        behavior: nextState,
      },
    });
    showToast(message, 'success');
  };

  // 2. 尝试抱抱 (必定触发拒绝性格)
  const handleAttemptHug = () => {
    playMeowSound();
    const { nextState, message } = attemptHugLanLan(behaviorState, gameState.placedFurniture);
    onUpdateState({
      ...gameState,
      lanLan: {
        ...gameState.lanLan,
        behavior: nextState,
      },
    });
    showToast(`抱抱反馈：${message}`, 'info');
  };

  // 3. 玩毛球
  const handlePlayYarn = () => {
    playClickSound();
    const { nextState, message } = playWithYarnBall(behaviorState, gameState.placedFurniture);
    onUpdateState({
      ...gameState,
      lanLan: {
        ...gameState.lanLan,
        behavior: nextState,
      },
    });
    showToast(`毛球被拍动：${message}`, 'success');
  };

  // 4. 让兰兰安心入睡 (如果醒着)
  const handleLetSleep = () => {
    playClickSound();
    const nextState: LanLanAutonomousState = {
      ...behaviorState,
      currentBehavior: 'SLEEPING',
      behaviorDurationSeconds: 25,
      behaviorElapsedSeconds: 0,
      dialogueBubble: '呼噜噜……安心蜷在温暖角落，做起甜甜的猫咪美梦 zZ',
    };
    onUpdateState({
      ...gameState,
      lanLan: {
        ...gameState.lanLan,
        behavior: nextState,
      },
    });
    showToast('兰兰蜷起胖乎乎的身子，安心睡大懒觉啦~', 'info');
  };

  return (
    <div className="space-y-4">
      
      {/* 顶部横幅提示：纯自主猫咪，非打卡宠物 */}
      <div className="p-3 bg-blue-50/80 border-2 border-stone-900 rounded-xl flex items-start gap-2.5 text-xs text-stone-800 shadow-[2px_2px_0px_#1c1917]">
        <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-stone-900">
            自主蓝猫生活体系 · 拒绝日常打卡负担
          </div>
          <p className="text-stone-600 leading-relaxed text-[11px]">
            兰兰是一只具有完全自主行为的英国短毛蓝猫，不是需要每日喂食清洁打卡的机械宠物系统。
            她喜欢睡懒觉、玩毛球、有时主动凑过来蹭豆哥，但<strong>天生不喜欢被抱</strong>。不互动绝无好感扣除与惩罚！
          </p>
        </div>
      </div>

      {/* 兰兰主舞台交互区 */}
      <div className="doodle-box p-5 bg-white space-y-4">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2 border-b-2 border-stone-100">
          
          {/* 左侧：手绘大立绘与实时动作气泡 */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl shadow-[3px_3px_0px_#1c1917] w-full md:w-auto min-w-[260px]">
            <DoodleLanLan
              behaviorState={behaviorState}
              isPurring={gameState.lanLan.isPurring}
              onPet={handlePet}
              onAttemptHug={handleAttemptHug}
              onPlayYarn={handlePlayYarn}
              showControlMenu={false}
            />

            <div className="mt-3 text-center space-y-1">
              <div className="text-[11px] font-mono text-stone-500">
                当前位置：网格 ({behaviorState.position.x}, {behaviorState.position.y})
                {behaviorState.isNearDouGe && <span className="text-pink-700 font-bold ml-1">· 贴近豆哥中</span>}
              </div>
              <div className="text-xs text-stone-700">
                今日已睡大觉：<strong className="font-mono">{Math.round(behaviorState.dailySleepingMinutes)}</strong> 分钟
              </div>
            </div>
          </div>

          {/* 右侧：陪伴互动控制盘 */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                自主行为陪伴
              </span>
              <h3 className="font-bold text-lg font-doodle text-stone-900">
                与兰兰轻轻互动
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                兰兰会根据环境自主切换睡觉、伸懒腰、走动或玩耍。你可以轻抚陪伴，也可以任由它惬意生活。
              </p>
            </div>

            {/* 核心互动按钮 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={handlePet}
                className="doodle-btn p-2.5 flex flex-col items-center justify-center gap-1.5 text-xs font-bold hover:bg-stone-50"
              >
                <Hand className="w-4 h-4 text-amber-700" />
                <span>摸摸下巴</span>
                <span className="text-[10px] text-stone-400 font-normal">温顺呼噜噜</span>
              </button>

              <button
                onClick={handleAttemptHug}
                className="doodle-btn p-2.5 flex flex-col items-center justify-center gap-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                title="尝试抱起 (触发猫咪天性抗拒滑脱)"
              >
                <span className="text-base">🤗</span>
                <span>尝试抱抱</span>
                <span className="text-[10px] text-rose-500 font-normal">泥鳅般滑脱</span>
              </button>

              <button
                onClick={handlePlayYarn}
                className="doodle-btn p-2.5 flex flex-col items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
              >
                <span className="text-base">🧶</span>
                <span>玩耍毛球</span>
                <span className="text-[10px] text-emerald-600 font-normal">小爪啪啪拍</span>
              </button>

              <button
                onClick={handleLetSleep}
                className="doodle-btn p-2.5 flex flex-col items-center justify-center gap-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                <Moon className="w-4 h-4 text-purple-700" />
                <span>安心睡懒觉</span>
                <span className="text-[10px] text-purple-600 font-normal">雷打不动</span>
              </button>
            </div>

            {/* 治愈氛围与书咖加成提示 */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-400 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{atmosphereBonus.atmosphereNote}</span>
              </div>
              <span className="font-bold text-emerald-800 shrink-0 ml-2 font-mono">
                +{atmosphereBonus.satisfactionBonus}分满意度
              </span>
            </div>

          </div>

        </div>

        {/* 兰兰的五大性格档案卡片 */}
        <div className="space-y-2 pt-2">
          <h4 className="font-bold text-xs text-stone-900 border-b border-stone-200 pb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-700" />
            <span>蓝猫兰兰的核心习性档案</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
            
            <div className="p-3 bg-[#FAF8F5] border border-stone-800 rounded-xl space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>💤 喜欢睡懒觉</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                英短蓝猫的经典本性。雷打不动的深度睡眠，在羊羔绒猫窝和猫爬架周围睡得格外香甜，睡醒必然伸个长长懒腰。
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-stone-800 rounded-xl space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>❤️ 没人理会时主动亲近</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                当玩家一段时间没主动交互时，兰兰有概率迈着小步走向豆哥，蹭蹭裤腿或在脚边坐下打呼噜。玩家不理会也绝无惩罚！
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-stone-800 rounded-xl space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>🚫 不喜欢被抱 (猫是流动的)</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                天生抗拒被强行束缚。尝试抱起时会像泥鳅一样敏捷扭动滑脱；若连续强行抱，还会小跑拉开距离。拒绝是猫咪性格，不是关系失败。
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-stone-800 rounded-xl space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>⚡ 偶尔突然跑酷一小段</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                体内洪荒之力爆发！毫无预兆突然起飞狂奔冲刺一小段，随后猛地急刹车停下好奇观察四周，假装刚才什么都没发生。
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-stone-800 rounded-xl space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>🧶 喜欢玩毛线球</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                店内有麻绳抓垫或毛线球时，兰兰会用两只粉嫩肉垫小爪左右开弓击打，毛球骨碌碌滚动位移，玩累了自得离开。
              </p>
            </div>

            <div className="p-3 bg-stone-100 border border-stone-800 rounded-xl space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>🏡 店内猫咪专属设施</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                猫窝: {facilities.beds.length}个 · 猫爬架: {facilities.trees.length}个 · 抓垫: {facilities.yarnMats.length}个。<br />
                可在“装修布局”中购置摆放，丰富兰兰的生活巡视轨迹。
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
