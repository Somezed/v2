/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 终章结局演示中心与全结局纪念馆 (EndingsShowcaseModal)
 * 职责：
 * 1. 集中展示 6 种截然不同的经营结局画廊 (殿堂传说、佛系慢生活、商业神话、人间温情、风雨新生、隐世书痴)
 * 2. 实时分析玩家当前存档的结局达成度与倾向预测
 * 3. 沉浸式多幕剧场演示：手绘插画、长卷篇章、豆哥心语独白、兰兰呼噜互动、熟客归宿、通关纪念证书
 * 4. 支持“一键载入该终局存档”，让玩家亲手把玩体验该结局下的高阶店铺世界
 */

import React, { useState } from 'react';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Heart,
  Coins,
  Award,
  CheckCircle2,
  Calendar,
  Volume2,
  Share2,
  Copy,
  ChevronRight,
  Check,
  Flame,
  Cat,
  Coffee,
  X,
  Play,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { GameSaveData, CustomerType } from '../types/game';
import {
  EndingId,
  GAME_ENDINGS_CATALOG,
  GameEndingConfig,
} from '../game/config/endingData';
import {
  evaluateAllEndings,
  evaluateEndingMatch,
  getBestMatchingEnding,
} from '../game/engine/endingEngine';
import {
  playClickSound,
  playCoinSound,
  playPageFlipSound,
  playCatMeowMood,
  playEndingCelebrationSound,
} from '../game/audio/soundEffects';
import { DoodleLanLan } from './DoodleLanLan';
import { DoodleDouGe } from './DoodleDouGe';

interface EndingsShowcaseModalProps {
  isOpen: boolean;
  gameState: GameSaveData;
  initialEndingId?: EndingId | null;
  onClose: () => void;
  onLoadEndingSave: (saveData: GameSaveData, endingTitle: string) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const EndingsShowcaseModal: React.FC<EndingsShowcaseModalProps> = ({
  isOpen,
  gameState,
  initialEndingId = null,
  onClose,
  onLoadEndingSave,
  showToast,
}) => {
  // 当前视图模式: GALLERY (画廊) | THEATER (沉浸放映剧场)
  const [viewMode, setViewMode] = useState<'GALLERY' | 'THEATER'>('GALLERY');
  const [activeEndingId, setActiveEndingId] = useState<EndingId>(
    initialEndingId || 'ENDING_CULTURAL_LANDMARK'
  );

  // 剧场中的幕次步进 (0: 故事画卷, 1: 豆哥心语与兰兰, 2: 熟客归宿, 3: 荣誉证书与核算)
  const [theaterStep, setTheaterStep] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [copiedCertificate, setCopiedCertificate] = useState<boolean>(false);
  const [confirmLoadEndingId, setConfirmLoadEndingId] = useState<EndingId | null>(null);

  // 如果初始指定了 endingId，自动进入 THEATER
  React.useEffect(() => {
    if (initialEndingId) {
      setActiveEndingId(initialEndingId);
      setViewMode('THEATER');
      setTheaterStep(0);
      setActiveChapterIndex(0);
      playEndingCelebrationSound();
    }
  }, [initialEndingId]);

  if (!isOpen) return null;

  // 计算全部结局匹配情况
  const endingEvaluations = evaluateAllEndings(gameState);
  const bestMatch = getBestMatchingEnding(gameState);
  const activeEndingConfig = GAME_ENDINGS_CATALOG[activeEndingId];

  // 启动某个结局的演示放映
  const handleStartDemonstration = (endingId: EndingId) => {
    playEndingCelebrationSound();
    setActiveEndingId(endingId);
    setViewMode('THEATER');
    setTheaterStep(0);
    setActiveChapterIndex(0);
  };

  // 触发兰兰猫叫交互
  const handleTriggerLanLanVoice = () => {
    playCatMeowMood(activeEndingConfig.lanLanReaction.soundMood);
    showToast(`兰兰：${activeEndingConfig.lanLanReaction.quote}`, 'info');
  };

  // 复制荣誉证书
  const handleCopyCertificate = () => {
    playClickSound();
    const stats = activeEndingConfig.sampleStats;
    const certText = `【${activeEndingConfig.title} · 豆哥的猫咪书咖终章证书】
荣誉称号：${activeEndingConfig.commemorativePerks.certificateTitle}
经营天数：第 ${stats.days} 天终了
账面净利：¥${stats.totalProfit.toFixed(1)} (期末现金 ¥${stats.closingCash.toFixed(1)})
累计出餐：${stats.ordersServed} 单 (综合满意度 ${stats.averageSatisfaction.toFixed(1)}分)
书咖名誉：${stats.reputation} 点
专属纪念：${activeEndingConfig.commemorativePerks.souvenirName}
特颁评语：${activeEndingConfig.douGeMonologue}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(certText).then(() => {
        setCopiedCertificate(true);
        showToast('通关荣誉证书已复制到剪贴板！', 'success');
        setTimeout(() => setCopiedCertificate(false), 2500);
      });
    }
  };

  // 确认一键载入该终局存档
  const handleConfirmLoadEndingSave = () => {
    if (!confirmLoadEndingId) return;
    const targetConfig = GAME_ENDINGS_CATALOG[confirmLoadEndingId];
    const newSave = targetConfig.createDemoSave();
    playCoinSound();
    onLoadEndingSave(newSave, targetConfig.title);
    setConfirmLoadEndingId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border-2 border-stone-900 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-[8px_8px_0px_#1c1917] overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="p-3.5 sm:p-4 border-b-2 border-stone-900 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border-2 border-stone-900 bg-amber-100 text-amber-900 flex items-center justify-center font-bold shadow-[2px_2px_0px_#1c1917]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-doodle tracking-wide text-stone-900">
                  终章结局演示中心 & 纪念馆
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-stone-800 bg-stone-100 font-bold">
                  6大经营宇宙
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                体验治愈经营的无数可能 · 沉浸式结局放映 · 一键实装终局存档
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'THEATER' && (
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode('GALLERY');
                }}
                className="doodle-btn px-2.5 py-1 text-xs font-bold flex items-center gap-1 bg-white hover:bg-stone-100"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回画廊</span>
              </button>
            )}

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg border-2 border-stone-900 bg-white hover:bg-stone-200 text-stone-800 transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域：画廊模式 vs 剧场放映模式 */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5">
          
          {viewMode === 'GALLERY' ? (
            /* ========================================================
               画廊视图：当前倾向指示 + 6 大结局卡片
               ======================================================== */
            <div className="space-y-5">
              
              {/* 当前玩家的经营轨迹分析卡片 */}
              <div className="p-4 rounded-xl border-2 border-stone-900 bg-white shadow-[3px_3px_0px_#1c1917] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-stone-900">
                      你当前的经营轨迹分析 (Current Store Trajectory)
                    </span>
                  </div>
                  <div className="text-xs font-mono text-stone-600">
                    营业第 <span className="font-bold text-stone-900">{gameState.currentDay}</span> 天 · 现金 ¥{gameState.cash.toFixed(1)} · 声誉 {gameState.reputation}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">最接近的结局方向:</span>
                      <span className="font-bold text-sm text-stone-900">
                        {bestMatch.config.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${bestMatch.config.colorTheme.badgeBg} ${bestMatch.config.colorTheme.badgeText}`}>
                        {bestMatch.config.badge}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">
                      已达成 {bestMatch.fulfilledCriteriaCount}/{bestMatch.totalCriteriaCount} 项核心经营指标
                      {bestMatch.isUnlocked ? ' · 🎉 条件已全满，可直接达成！' : ' · 仍在持续经营塑造中'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-28 sm:w-36">
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span>契合度</span>
                        <span>{bestMatch.matchScore}%</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden border border-stone-400">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${bestMatch.matchScore}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartDemonstration(bestMatch.endingId)}
                      className="doodle-btn px-3 py-1.5 text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>演示此结局</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 6 大结局画廊网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {endingEvaluations.map((evalItem) => {
                  const cfg = evalItem.config;
                  const isUnlocked = evalItem.isUnlocked;

                  return (
                    <div
                      key={cfg.id}
                      className={`doodle-box p-4 bg-white flex flex-col justify-between border-2 border-stone-900 relative transition-transform hover:-translate-y-0.5 ${
                        isUnlocked ? 'ring-2 ring-amber-400/50' : ''
                      }`}
                    >
                      {/* 卡片头部 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.colorTheme.badgeBg} ${cfg.colorTheme.badgeText}`}>
                            {cfg.rarity}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500">
                            #{cfg.orderNumber}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-doodle text-base font-bold text-stone-900 flex items-center gap-1.5">
                            {cfg.title}
                          </h3>
                          <div className="text-[10px] font-mono text-stone-400">
                            {cfg.englishTitle}
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {cfg.summary}
                        </p>

                        {/* 达成指标进展列表 */}
                        <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                            <span>指标满足情况</span>
                            <span className="font-mono">{evalItem.fulfilledCriteriaCount}/{evalItem.totalCriteriaCount}</span>
                          </div>

                          <div className="space-y-1">
                            {evalItem.criteriaStatus.slice(0, 3).map((crit, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[10px] text-stone-600">
                                <span className="flex items-center gap-1 truncate max-w-[200px]">
                                  {crit.satisfied ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full border border-stone-400 shrink-0" />
                                  )}
                                  <span className={crit.satisfied ? 'text-stone-900 font-medium' : 'text-stone-500'}>
                                    {crit.text}
                                  </span>
                                </span>
                                <span className="font-mono text-stone-400 shrink-0 text-[9px]">
                                  {crit.currentValText}
                                </span>
                              </div>
                            ))}
                            {evalItem.criteriaStatus.length > 3 && (
                              <div className="text-[9px] text-stone-400 text-right">
                                + 另有 {evalItem.criteriaStatus.length - 3} 项细节指标
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 卡片底部操作栏 */}
                      <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2 mt-3">
                        <button
                          onClick={() => setConfirmLoadEndingId(cfg.id)}
                          className="doodle-btn px-2.5 py-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center gap-1"
                          title="将游戏存档一键替换为该终局世界进行实际游玩"
                        >
                          <Download className="w-3 h-3 text-stone-700" />
                          <span>载入此存档</span>
                        </button>

                        <button
                          onClick={() => handleStartDemonstration(cfg.id)}
                          className="doodle-btn px-3 py-1 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1 shadow-[2px_2px_0px_#1c1917]"
                        >
                          <Play className="w-3 h-3 fill-current text-white" />
                          <span>演示此结局</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* ========================================================
               剧场放映视图：4 幕沉浸式故事演出
               ======================================================== */
            <div className="space-y-4">
              
              {/* 剧场步进指示器 */}
              <div className="flex items-center justify-between bg-white border-2 border-stone-900 p-2.5 rounded-xl shadow-[2px_2px_0px_#1c1917]">
                <div className="flex items-center gap-1.5 sm:gap-3 text-xs font-bold">
                  {[
                    { step: 0, label: '第一幕 · 画卷序章' },
                    { step: 1, label: '第二幕 · 豆哥与兰兰' },
                    { step: 2, label: '第三幕 · 熟客记忆' },
                    { step: 3, label: '第四幕 · 荣誉殿堂' },
                  ].map((s) => (
                    <button
                      key={s.step}
                      onClick={() => {
                        playClickSound();
                        setTheaterStep(s.step);
                      }}
                      className={`px-2.5 py-1 rounded-lg border transition-all ${
                        theaterStep === s.step
                          ? 'bg-stone-900 text-white border-stone-900 shadow-[1px_1px_0px_#1c1917]'
                          : 'bg-stone-50 text-stone-600 border-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{s.step + 1}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleTriggerLanLanVoice}
                    className="doodle-btn px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 flex items-center gap-1"
                    title="听兰兰此刻的叫声"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">听兰兰呼噜</span>
                  </button>
                </div>
              </div>

              {/* 剧场演出主舞台 */}
              <div className="bg-white border-2 border-stone-900 rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_#1c1917] space-y-5">
                
                {/* 舞台顶标 */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-stone-900 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${activeEndingConfig.colorTheme.badgeBg} ${activeEndingConfig.colorTheme.badgeText}`}>
                        {activeEndingConfig.badge}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        ENDGAME NO.{activeEndingConfig.orderNumber}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-doodle text-stone-900 mt-1">
                      {activeEndingConfig.title}
                    </h2>
                    <p className="text-xs text-stone-400 font-mono">
                      {activeEndingConfig.englishTitle}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-stone-500 block">演示基准天数</span>
                    <span className="font-mono text-sm font-bold text-stone-800">
                      第 {activeEndingConfig.sampleStats.days} 天终了
                    </span>
                  </div>
                </div>

                {/* 幕次 0: 纪实画卷故事章节 */}
                {theaterStep === 0 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {/* 章节切换 Tab */}
                    <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                      {activeEndingConfig.storyChapters.map((chap, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            playPageFlipSound();
                            setActiveChapterIndex(idx);
                          }}
                          className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all ${
                            activeChapterIndex === idx
                              ? 'bg-amber-100 text-amber-950 border-amber-800 shadow-[1px_1px_0px_#1c1917]'
                              : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          第 {idx + 1} 节 · {chap.title}
                        </button>
                      ))}
                    </div>

                    {/* 章节内容与手绘视觉 */}
                    {(() => {
                      const chap = activeEndingConfig.storyChapters[activeChapterIndex] || activeEndingConfig.storyChapters[0];
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                          {/* 左侧：手绘黑白角色与场景聚焦 */}
                          <div className="p-4 bg-stone-50 border-2 border-stone-900 rounded-xl flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                            {chap.doodleFocus === 'LANLAN' && (
                              <>
                                <DoodleLanLan
                                  isPurring={true}
                                  showControlMenu={false}
                                  className="w-36 h-36"
                                />
                                <div className="text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_#1c1917]">
                                  🐾 兰兰的大脸安睡角落
                                </div>
                              </>
                            )}

                            {chap.doodleFocus === 'DOUGE' && (
                              <>
                                <DoodleDouGe
                                  action="RESTING"
                                  mood={100}
                                  activeNailId="nail_cat_eye"
                                  className="w-36 h-36"
                                />
                                <div className="text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_#1c1917]">
                                  💅 豆哥的悠闲店长日常
                                </div>
                              </>
                            )}

                            {chap.doodleFocus === 'STORE' && (
                              <>
                                <div className="w-24 h-24 rounded-2xl border-2 border-stone-900 bg-white flex items-center justify-center shadow-[3px_3px_0px_#1c1917]">
                                  <Coffee className="w-12 h-12 text-stone-900" />
                                </div>
                                <div className="text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_#1c1917]">
                                  ☕ 满屋咖啡香与翻书声
                                </div>
                              </>
                            )}

                            {chap.doodleFocus === 'REGULARS' && (
                              <>
                                <div className="flex -space-x-3 mb-2">
                                  {['law', 'wang', 'ahao', 'momo'].map((seed, i) => (
                                    <div
                                      key={i}
                                      className="w-10 h-10 rounded-full border-2 border-stone-900 bg-[#FAF8F5] flex items-center justify-center text-xs font-bold shadow-[1px_1px_0px_#1c1917]"
                                    >
                                      {seed === 'law' ? '林' : seed === 'wang' ? '王' : seed === 'ahao' ? '豪' : '沫'}
                                    </div>
                                  ))}
                                </div>
                                <div className="text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_#1c1917]">
                                  💌 熟客围坐一堂的温情
                                </div>
                              </>
                            )}

                            {chap.doodleFocus === 'FAREWELL' && (
                              <>
                                <div className="w-24 h-24 rounded-2xl border-2 border-stone-900 bg-stone-100 flex items-center justify-center shadow-[3px_3px_0px_#1c1917]">
                                  <AlertTriangle className="w-10 h-10 text-stone-800" />
                                </div>
                                <div className="text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_#1c1917]">
                                  🌧️ 风雨中的释怀与守望
                                </div>
                              </>
                            )}

                            {chap.doodleFocus === 'BOOKS' && (
                              <>
                                <div className="w-24 h-24 rounded-2xl border-2 border-stone-900 bg-amber-50 flex items-center justify-center shadow-[3px_3px_0px_#1c1917]">
                                  <BookOpen className="w-10 h-10 text-stone-900" />
                                </div>
                                <div className="text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-800 shadow-[1px_1px_0px_#1c1917]">
                                  📚 卷轶浩繁的旧书墨香
                                </div>
                              </>
                            )}

                            <p className="text-[11px] text-stone-500 font-mono">
                              时段: {chap.sceneTag === 'MORNING' ? '清晨朝阳' : chap.sceneTag === 'AFTERNOON' ? '暖阳午后' : chap.sceneTag === 'NIGHT' ? '深夜灯火' : '风雨交加'}
                            </p>
                          </div>

                          {/* 右侧：长篇纪实散文 */}
                          <div className="md:col-span-2 space-y-3.5 font-serif text-stone-800 text-sm sm:text-base leading-relaxed bg-[#FAF8F5] p-5 rounded-xl border border-stone-300">
                            <h4 className="font-doodle text-lg font-bold text-stone-900 border-b border-stone-200 pb-2">
                              {chap.title}
                            </h4>
                            {chap.paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="indent-6 text-stone-700 leading-relaxed">
                                {p}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 幕次 1: 豆哥心语独白与兰兰呼噜 */}
                {theaterStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* 豆哥独白卡 */}
                      <div className="p-4 bg-stone-50 border-2 border-stone-900 rounded-xl space-y-3 shadow-[2px_2px_0px_#1c1917]">
                        <div className="flex items-center gap-3">
                          <DoodleDouGe
                            action="IDLE"
                            mood={100}
                            activeNailId="nail_cat_eye"
                            className="w-16 h-16 shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-stone-900 font-doodle">
                              店长豆哥的终章独白
                            </h4>
                            <p className="text-xs text-stone-500">
                              穿着浅粉羽绒服 · 戴着冷帽与大圆框眼镜
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-lg border border-stone-300 text-xs sm:text-sm text-stone-800 leading-relaxed relative">
                          <div className="absolute -top-2 left-6 w-3 h-3 bg-white border-t border-l border-stone-300 rotate-45" />
                          {activeEndingConfig.douGeMonologue}
                        </div>
                      </div>

                      {/* 蓝猫兰兰反应卡 */}
                      <div className="p-4 bg-amber-50/60 border-2 border-stone-900 rounded-xl space-y-3 shadow-[2px_2px_0px_#1c1917]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <DoodleLanLan
                              isPurring={true}
                              showControlMenu={false}
                              className="w-16 h-16 shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-stone-900 font-doodle">
                                蓝猫兰兰的心满意足
                              </h4>
                              <p className="text-xs text-stone-500">
                                琥珀色金瞳 · 圆滚滚大包子脸
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={handleTriggerLanLanVoice}
                            className="doodle-btn px-2.5 py-1 text-xs font-bold bg-white text-stone-900 flex items-center gap-1 hover:bg-stone-100"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-stone-700" />
                            <span>摸摸叫一声</span>
                          </button>
                        </div>

                        <div className="bg-white p-3.5 rounded-lg border border-stone-300 space-y-2 text-xs sm:text-sm text-stone-800 leading-relaxed">
                          <p className="font-bold text-amber-950">
                            “{activeEndingConfig.lanLanReaction.quote}”
                          </p>
                          <p className="text-xs text-stone-500">
                            {activeEndingConfig.lanLanReaction.description}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 幕次 2: 熟客归宿与专属回忆录信件 */}
                {theaterStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="font-bold text-sm text-stone-900">
                        💌 熟客朋友们的终章后续与回信
                      </span>
                      <span className="text-xs text-stone-500">
                        每一段羁绊，都是书咖最珍贵的财富
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {activeEndingConfig.customerEpilogues.map((cust) => (
                        <div
                          key={cust.customerId}
                          className="p-3.5 bg-stone-50 border-2 border-stone-900 rounded-xl space-y-2 shadow-[2px_2px_0px_#1c1917]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full border border-stone-900 bg-white flex items-center justify-center font-bold text-xs">
                                {cust.name.slice(0, 1)}
                              </div>
                              <div>
                                <span className="font-bold text-sm text-stone-900">{cust.name}</span>
                                <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-stone-200 font-bold text-stone-700">
                                  {cust.role}
                                </span>
                              </div>
                            </div>
                            <Heart className="w-4 h-4 text-rose-500 fill-current" />
                          </div>

                          <p className="text-xs text-stone-700 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200">
                            {cust.epilogue}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 幕次 3: 荣誉证书、终章资产总评与特颁权益 */}
                {theaterStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    
                    {/* 官方终章荣誉证书卡片 */}
                    <div className="p-5 sm:p-6 bg-[#FCFBF8] border-3 border-stone-900 rounded-2xl shadow-[6px_6px_0px_#1c1917] space-y-4 relative overflow-hidden">
                      {/* 背景水印印花 */}
                      <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none select-none">
                        <Cat className="w-48 h-48 text-stone-900" />
                      </div>

                      <div className="text-center space-y-1.5 border-b-2 border-dashed border-stone-300 pb-3">
                        <div className="text-xs font-bold tracking-widest text-stone-400 uppercase font-mono">
                          OFFICIAL ENDGAME CERTIFICATE
                        </div>
                        <h3 className="font-doodle text-xl sm:text-2xl font-bold text-stone-900">
                          {activeEndingConfig.commemorativePerks.certificateTitle}
                        </h3>
                        <p className="text-xs text-stone-600">
                          授予店长：豆哥 & 首席店宠：英短蓝猫兰兰
                        </p>
                      </div>

                      {/* 经营成果数据看板 */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                        <div className="p-2.5 bg-white border border-stone-800 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">累计营业天数</span>
                          <span className="text-base font-bold font-mono text-stone-900">
                            {activeEndingConfig.sampleStats.days} 天
                          </span>
                        </div>
                        <div className="p-2.5 bg-white border border-stone-800 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">期末账面现金</span>
                          <span className="text-base font-bold font-mono text-emerald-800">
                            ¥{activeEndingConfig.sampleStats.closingCash.toFixed(1)}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white border border-stone-800 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">累计成功出餐</span>
                          <span className="text-base font-bold font-mono text-stone-900">
                            {activeEndingConfig.sampleStats.ordersServed} 单
                          </span>
                        </div>
                        <div className="p-2.5 bg-white border border-stone-800 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">平均顾客满意度</span>
                          <span className="text-base font-bold font-mono text-amber-800">
                            {activeEndingConfig.sampleStats.averageSatisfaction.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* 纪念礼物与永久增益 */}
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <Award className="w-4 h-4 text-amber-700" />
                          <span>获得专属纪念藏品：{activeEndingConfig.commemorativePerks.souvenirName}</span>
                        </div>
                        <p className="text-stone-700">
                          {activeEndingConfig.commemorativePerks.souvenirDesc}
                        </p>
                        <div className="text-[11px] font-bold text-emerald-900 pt-1 border-t border-amber-200">
                          🎁 {activeEndingConfig.commemorativePerks.unlockBonus}
                        </div>
                      </div>

                      {/* 证书底部操作 */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <button
                          onClick={handleCopyCertificate}
                          className="doodle-btn px-3 py-1.5 text-xs font-bold bg-white hover:bg-stone-100 flex items-center gap-1"
                        >
                          {copiedCertificate ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>已复制到剪贴板</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-700" />
                              <span>复制荣誉证书结语</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setConfirmLoadEndingId(activeEndingConfig.id)}
                          className="doodle-btn px-3 py-1.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1 shadow-[2px_2px_0px_#1c1917]"
                        >
                          <Download className="w-3.5 h-3.5 fill-current" />
                          <span>载入此终局实际玩一把</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* 剧场底部跨步切换控制条 */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                  <button
                    onClick={() => {
                      playClickSound();
                      setTheaterStep((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={theaterStep === 0}
                    className="doodle-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1 disabled:opacity-40"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>上一幕</span>
                  </button>

                  <div className="text-xs font-mono text-stone-500">
                    幕次 {theaterStep + 1} / 4
                  </div>

                  {theaterStep < 3 ? (
                    <button
                      onClick={() => {
                        playClickSound();
                        setTheaterStep((prev) => Math.min(3, prev + 1));
                      }}
                      className="doodle-btn px-3.5 py-1.5 text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 flex items-center gap-1"
                    >
                      <span>下一幕</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        playClickSound();
                        setViewMode('GALLERY');
                      }}
                      className="doodle-btn px-3.5 py-1.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1"
                    >
                      <span>完成放映 · 返回画廊</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* 底部常驻说明 */}
        <div className="p-3 bg-stone-100 border-t-2 border-stone-900 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>每个结局均包含完整剧本故事、豆哥独白、熟客结局与通关存档体验。</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 font-doodle">《豆哥的猫咪书咖》</span>
          </div>
        </div>

      </div>

      {/* 确认一键载入存档弹窗 */}
      {confirmLoadEndingId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="doodle-box w-full max-w-md bg-white p-5 space-y-4 shadow-[6px_6px_0px_#1c1917] border-2 border-stone-900">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border-2 border-stone-900 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-doodle text-base font-bold text-stone-900">
                  一键载入终局世界存档？
                </h3>
                <p className="text-xs text-stone-500">
                  体验【{GAME_ENDINGS_CATALOG[confirmLoadEndingId].title}】
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              载入后，您的游戏存档将立即替换为该结局下的高阶完整数据（包含 Lv.5 满级或对应特色设备、资金与满好感熟客），您可以随时在设置中重置或导入您先前的存档。
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmLoadEndingId(null)}
                className="doodle-btn px-3 py-1.5 text-xs font-bold bg-white text-stone-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmLoadEndingSave}
                className="doodle-btn px-4 py-1.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800"
              >
                确认立即载入
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
