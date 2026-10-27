/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 治愈系背景白噪声控制器组件 (AmbienceSoundBar)
 * 功能：
 * 1. 实时 Web Audio 播放晴天鸟鸣微风、小雨雨声、阴天阵风呼啸、咖啡馆舒适环境音
 * 2. 支持根据当日天气自动同步推荐白噪声
 * 3. 一键独立开启/关闭、平滑音量微调
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  CloudRain,
  Sun,
  Wind,
  Coffee,
  ChevronDown,
  Check,
} from 'lucide-react';
import { AmbienceType, DailyWeatherInfo } from '../types/game';
import {
  startAmbience,
  stopAmbience,
  setAmbienceVolume,
  playClickSound,
} from '../game/audio/soundEffects';

interface AmbienceSoundBarProps {
  currentType: AmbienceType;
  volume: number;
  autoSyncWeather: boolean;
  weather?: DailyWeatherInfo;
  onUpdateAmbience: (cfg: { enabled: boolean; currentType: AmbienceType; volume: number; autoSyncWeather: boolean }) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const AmbienceSoundBar: React.FC<AmbienceSoundBarProps> = ({
  currentType,
  volume,
  autoSyncWeather,
  weather,
  onUpdateAmbience,
  showToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const isPlaying = currentType !== 'OFF';

  const ambienceOptions: { type: AmbienceType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      type: 'BIRD_SUNNY',
      label: '晴天微风与鸟鸣',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
      desc: '窗外柔和林间微风，穿插清脆自然鸟语',
    },
    {
      type: 'RAIN_SOFT',
      label: '淅沥蒙蒙细雨声',
      icon: <CloudRain className="w-3.5 h-3.5 text-blue-500" />,
      desc: '细雨润无声的粉红噪声，敲打屋檐雨棚',
    },
    {
      type: 'WIND_CLOUDY',
      label: '阴天阵风与树梢呼啸',
      icon: <Wind className="w-3.5 h-3.5 text-teal-600" />,
      desc: '深沉舒缓的布朗风声扫频，静心入神',
    },
    {
      type: 'CAFE_VIBES',
      label: '书咖室内温暖底噪',
      icon: <Coffee className="w-3.5 h-3.5 text-amber-800" />,
      desc: '轻柔暖意室内环境声，书卷与温润咖啡馆气息',
    },
  ];

  // 切换总开关
  const handleTogglePlay = () => {
    playClickSound();
    if (isPlaying) {
      stopAmbience();
      onUpdateAmbience({
        enabled: false,
        currentType: 'OFF',
        volume,
        autoSyncWeather,
      });
      showToast('已关闭背景自然白噪声', 'info');
    } else {
      const targetType = autoSyncWeather && weather?.recommendedAmbience ? weather.recommendedAmbience : 'BIRD_SUNNY';
      startAmbience(targetType, volume);
      onUpdateAmbience({
        enabled: true,
        currentType: targetType,
        volume,
        autoSyncWeather,
      });
      showToast(`已开启【${ambienceOptions.find((o) => o.type === targetType)?.label || '白噪声'}】`, 'success');
    }
  };

  // 切换音效类型
  const handleSelectType = (type: AmbienceType) => {
    playClickSound();
    startAmbience(type, volume);
    onUpdateAmbience({
      enabled: true,
      currentType: type,
      volume,
      autoSyncWeather: false, // 手动选择时解除自动天气同步
    });
    showToast(`已切换为【${ambienceOptions.find((o) => o.type === type)?.label}】`, 'info');
  };

  // 调整音量
  const handleVolumeChange = (newVol: number) => {
    setAmbienceVolume(newVol);
    onUpdateAmbience({
      enabled: isPlaying,
      currentType,
      volume: newVol,
      autoSyncWeather,
    });
  };

  // 切换跟随天气联动
  const handleToggleAutoSync = () => {
    playClickSound();
    const nextSync = !autoSyncWeather;
    if (nextSync && weather?.recommendedAmbience) {
      startAmbience(weather.recommendedAmbience, volume);
      onUpdateAmbience({
        enabled: true,
        currentType: weather.recommendedAmbience,
        volume,
        autoSyncWeather: true,
      });
      showToast('已开启天气智能联动：白噪声将随每日天气自动轮换', 'success');
    } else {
      onUpdateAmbience({
        enabled: isPlaying,
        currentType,
        volume,
        autoSyncWeather: false,
      });
      showToast('已切换为手动自选白噪声模式', 'info');
    }
  };

  const currentOption = ambienceOptions.find((o) => o.type === currentType);

  return (
    <div className="relative inline-block text-xs">
      {/* 快捷白噪声状态按钮 */}
      <div className="flex items-center gap-1 bg-white border-2 border-stone-900 rounded-xl px-2.5 py-1 shadow-[2px_2px_0px_#1c1917]">
        <button
          onClick={handleTogglePlay}
          className={`flex items-center gap-1 font-bold transition-colors ${
            isPlaying ? 'text-amber-800' : 'text-stone-500 hover:text-stone-800'
          }`}
          title={isPlaying ? '点击暂停白噪声' : '点击开启自然白噪声'}
        >
          {isPlaying ? (
            <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-stone-400" />
          )}
          <span className="text-[11px]">
            {isPlaying ? (currentOption?.label.slice(0, 4) || '白噪声') : '白噪声:关'}
          </span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setIsOpen(!isOpen);
          }}
          className="p-0.5 rounded hover:bg-stone-100 text-stone-600 transition-colors border-l border-stone-200 pl-1 ml-0.5"
          title="展开白噪声设置面板"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 展开的白噪声设置浮层面板 */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 z-50 w-72 bg-white doodle-box p-3.5 space-y-3 shadow-[6px_6px_0px_#1c1917] border-2 border-stone-900 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
              <Radio className="w-4 h-4 text-amber-700" />
              <span>自然环境白噪声</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-stone-400 hover:text-stone-800 px-1"
            >
              收起
            </button>
          </div>

          {/* 开关与音量控制 */}
          <div className="space-y-2 bg-[#FAF8F5] p-2.5 rounded-lg border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-700">白噪声播放开关</span>
              <button
                onClick={handleTogglePlay}
                className={`doodle-btn px-2.5 py-0.5 text-[11px] font-bold ${
                  isPlaying ? 'bg-amber-100 text-amber-950 border-amber-800' : 'text-stone-600'
                }`}
              >
                {isPlaying ? '● 正在播放' : '○ 已静音关闭'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-stone-500 shrink-0">音量 {Math.round(volume * 100)}%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
              />
            </div>
          </div>

          {/* 跟随天气联动 */}
          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-stone-600">随每日天气自动匹配</span>
            <button
              onClick={handleToggleAutoSync}
              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold transition-colors ${
                autoSyncWeather
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                  : 'bg-stone-100 text-stone-500 border-stone-300'
              }`}
            >
              {autoSyncWeather ? '✓ 智能天气联动中' : '手动自选'}
            </button>
          </div>

          {/* 四大自然声场选择 */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">
              声场音效库
            </span>
            <div className="space-y-1">
              {ambienceOptions.map((opt) => {
                const isSelected = isPlaying && currentType === opt.type;
                return (
                  <button
                    key={opt.type}
                    onClick={() => handleSelectType(opt.type)}
                    className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-800 text-amber-950 font-bold shadow-[1px_1px_0px_#1c1917]'
                        : 'bg-white border-stone-200 hover:border-stone-400 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center shrink-0">
                        {opt.icon}
                      </div>
                      <div>
                        <div className="text-[11px] leading-tight">{opt.label}</div>
                        <div className="text-[9.5px] text-stone-400 font-normal leading-tight mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
