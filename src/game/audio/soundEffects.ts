/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》程序化 Web Audio 合成音效与白噪声引擎
 * 零外部音频文件依赖，完全本地实时生成，低延迟、无跨域404风险：
 * 1. 兰兰多情绪动态猫鸣 (慵懒、讨好、惬意呼噜、生气傲娇)
 * 2. 背景自然白噪声 (晴天鸟鸣微风、小雨蒙蒙细雨、阴天阵风呼啸、咖啡馆舒适底噪)
 * 3. 独立音量控制与一键可关闭
 */

import { AmbienceType, CatMeowMood } from '../../types/game';

let audioCtx: AudioContext | null = null;
let isMuted = false;

// 白噪声后台发生器全局状态
interface AmbienceState {
  currentType: AmbienceType;
  masterGain: GainNode | null;
  activeSources: (AudioNode | number)[]; // 节点或定时器
  volume: number;
}

const ambienceState: AmbienceState = {
  currentType: 'OFF',
  masterGain: null,
  activeSources: [],
  volume: 0.35,
};

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  if (muted) {
    stopAmbience();
  }
}

export function getSoundMuted(): boolean {
  return isMuted;
}

/**
 * 铅笔/纸张翻书触感声 (轻柔白噪滤波)
 */
export function playPageFlipSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, ctx.currentTime);
  filter.Q.setValueAtTime(2.0, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
}

/**
 * 治愈金币/收银清脆小铃音
 */
export function playCoinSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'sine';

  osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
  osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.07); // E6

  osc2.frequency.setValueAtTime(1975.53, ctx.currentTime); // B6
  osc2.frequency.setValueAtTime(2637.02, ctx.currentTime + 0.07); // E7

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 0.35);
  osc2.stop(ctx.currentTime + 0.35);
}

/**
 * 简笔画风格按钮点击声 (温和敲击)
 */
export function playClickSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

/**
 * 兰兰多情绪动态程序化猫鸣
 * LAZY (慵懒): 慢速滑降、低频带拖音
 * SWEET (讨好): 轻快升降双音节清脆喵
 * COZY (惬意): 双振荡器胸腔呼噜马达声
 * GRUMPY (生气/傲娇): 短促带轻微锯齿抗议喵
 */
export function playCatMeowMood(mood: CatMeowMood = 'SWEET') {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (mood === 'COZY') {
    // 惬意呼噜马达声 (Purr)
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const mainGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(42, now); // 低频基础嗡嗡

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, now); // 呼噜震颤速率 (约24Hz)
    lfoGain.gain.setValueAtTime(16, now);

    lfo.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(0.22, now + 0.15);
    mainGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.82);
    osc.stop(now + 0.82);
    return;
  }

  if (mood === 'LAZY') {
    // 慵懒长尾喵 (Mellow slow slide)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.55);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.56);
    return;
  }

  if (mood === 'GRUMPY') {
    // 生气/抗议短促喵 (Short raspy protest)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.22);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
    return;
  }

  // 默认 SWEET 甜美欢快喵
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(680, now);
  osc.frequency.exponentialRampToValueAtTime(1020, now + 0.1);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.32);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.33);
}

export function playMeowSound() {
  playCatMeowMood('SWEET');
}

/**
 * 终章通关/结局演示庆典琶音 (高雅温馨和弦)
 */
export function playEndingCelebrationSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C大九和弦华丽琶音: C5, E5, G5, B5, D6
  const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.12);

    gain.gain.setValueAtTime(0.001, now + index * 0.12);
    gain.gain.linearRampToValueAtTime(0.12, now + index * 0.12 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + index * 0.12);
    osc.stop(now + index * 0.12 + 0.85);
  });
}

/**
 * 随机鸟鸣生成器 (单次清脆鸟叫)
 */
function triggerProceduralBirdChirp(ctx: AudioContext, masterGain: GainNode) {
  if (isMuted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  const baseFreq = 2400 + Math.random() * 1200;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.04);
  osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, now + 0.09);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.11);
}

/**
 * 停止当前背景白噪声
 */
export function stopAmbience() {
  if (ambienceState.activeSources.length > 0) {
    for (const item of ambienceState.activeSources) {
      if (typeof item === 'number') {
        window.clearInterval(item);
      } else {
        try {
          if ('stop' in item && typeof item.stop === 'function') {
            item.stop();
          }
          item.disconnect();
        } catch {
          // ignore
        }
      }
    }
    ambienceState.activeSources = [];
  }
  if (ambienceState.masterGain) {
    try {
      ambienceState.masterGain.disconnect();
    } catch {
      // ignore
    }
    ambienceState.masterGain = null;
  }
  ambienceState.currentType = 'OFF';
}

/**
 * 设置白噪声总音量 (0.0 ~ 1.0)
 */
export function setAmbienceVolume(volume: number) {
  ambienceState.volume = Math.max(0, Math.min(1, volume));
  if (ambienceState.masterGain && audioCtx) {
    ambienceState.masterGain.gain.setValueAtTime(ambienceState.volume * 0.4, audioCtx.currentTime);
  }
}

export function getAmbienceVolume(): number {
  return ambienceState.volume;
}

export function getCurrentAmbienceType(): AmbienceType {
  return ambienceState.currentType;
}

/**
 * 开启指定类型的程序化白噪声环境音
 */
export function startAmbience(type: AmbienceType, volume = ambienceState.volume) {
  stopAmbience();

  if (type === 'OFF' || isMuted) {
    ambienceState.currentType = 'OFF';
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  ambienceState.currentType = type;
  ambienceState.volume = volume;

  const master = ctx.createGain();
  master.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  master.connect(ctx.destination);
  ambienceState.masterGain = master;

  // 1. 晴天鸟鸣与微风 (BIRD_SUNNY)
  if (type === 'BIRD_SUNNY') {
    // 持续微风白噪
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.08, ctx.currentTime);

    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(master);
    noise.start();

    // 周期性鸟语触发
    const birdTimer = window.setInterval(() => {
      if (Math.random() < 0.65) {
        triggerProceduralBirdChirp(ctx, master);
        if (Math.random() < 0.5) {
          setTimeout(() => triggerProceduralBirdChirp(ctx, master), 160);
        }
      }
    }, 2400);

    ambienceState.activeSources.push(noise, filter, windGain, birdTimer);
    return;
  }

  // 2. 蒙蒙细雨声 (RAIN_SOFT)
  if (type === 'RAIN_SOFT') {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    // 生成粉红噪声 (Pink noise)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.24, ctx.currentTime);

    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(master);
    noise.start();

    ambienceState.activeSources.push(noise, filter, rainGain);
    return;
  }

  // 3. 阴天/阵风声 (WIND_CLOUDY)
  if (type === 'WIND_CLOUDY') {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // 布朗噪声
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, ctx.currentTime);

    // LFO 风声呼吸起伏
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime); // 缓慢扫频
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(140, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.22, ctx.currentTime);

    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(master);

    noise.start();
    lfo.start();

    ambienceState.activeSources.push(noise, filter, lfo, lfoGain, windGain);
    return;
  }

  // 4. 咖啡馆室内舒适底噪 (CAFE_VIBES)
  if (type === 'CAFE_VIBES') {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(master);
    noise.start();

    ambienceState.activeSources.push(noise, filter, gainNode);
    return;
  }
}
