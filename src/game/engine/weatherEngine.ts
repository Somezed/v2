/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 《豆哥的猫咪书咖》动态天气与节假日系统 (WeatherEngine)
 * 职责：
 * 1. 每日根据经营天数与循环生成合理天气与节假日事件
 * 2. 调控客流到达率倍率 (trafficMultiplier) 与顾客等待耐心 (patienceBonusSeconds)
 * 3. 关联商品偏好 (如雨天爱热食、晴天爱清爽饮品)
 * 4. 推荐环境白噪声音效
 */

import { DailyWeatherInfo, WeatherType } from '../../types/game';

// 基础天气模板
export const WEATHER_PRESETS: Record<WeatherType, Omit<DailyWeatherInfo, 'temperature'>> = {
  SUNNY: {
    type: 'SUNNY',
    name: '晴空万里',
    icon: '☀️',
    trafficMultiplier: 1.15,
    patienceBonusSeconds: 0,
    preferredCategory: 'COFFEE',
    description: '阳光穿透玻璃窗洒在地板上，微风伴着林间鸟鸣。客流充沛，顾客心情愉悦，小费更丰厚。',
    recommendedAmbience: 'BIRD_SUNNY',
  },
  CLOUDY: {
    type: 'CLOUDY',
    name: '温润多云',
    icon: '⛅',
    trafficMultiplier: 1.0,
    patienceBonusSeconds: 1,
    description: '天光柔和无眩光，温度宜人。适合慢节奏读完一本长篇小说，读者流动平稳。',
    recommendedAmbience: 'CAFE_VIBES',
  },
  RAINY: {
    type: 'RAINY',
    name: '淅沥蒙蒙细雨',
    icon: '🌧️',
    trafficMultiplier: 0.85,
    patienceBonusSeconds: 4,
    preferredCategory: 'NOODLES',
    description: '细雨润无声，敲击着店门口遮阳棚。进店避雨的顾客沉静平和，耐性额外 +4 秒，热气腾腾的面食极受欢迎。',
    recommendedAmbience: 'RAIN_SOFT',
  },
  STORMY: {
    type: 'STORMY',
    name: '狂风骤雨',
    icon: '⛈️',
    trafficMultiplier: 0.65,
    patienceBonusSeconds: 6,
    preferredCategory: 'FRIED_RICE',
    description: '极端恶劣天气，风声呼啸。虽然街头行人稀少、客流减少，但驻留顾客耐心极强且消费客单价更高。',
    recommendedAmbience: 'WIND_CLOUDY',
  },
  HOLIDAY_WEEKEND: {
    type: 'HOLIDAY_WEEKEND',
    name: '周末假日客流狂欢',
    icon: '🎉',
    trafficMultiplier: 1.45,
    patienceBonusSeconds: -1,
    description: '周边高校与街坊放假聚会，店内客流暴涨 +45%！进店节奏迅猛，对后厨出餐与客座容量构成大考！',
    recommendedAmbience: 'CAFE_VIBES',
  },
};

/**
 * 根据经营天数确定当日天气 (结合节假日周期与伪随机天气扰动)
 */
export function generateDailyWeather(day: number): DailyWeatherInfo {
  // 规则 1: 每隔 6, 7 天为周末假日 (第 6, 7, 13, 14, 20, 21...)
  const dayInWeek = ((day - 1) % 7) + 1;
  if (dayInWeek === 6 || dayInWeek === 7) {
    const preset = WEATHER_PRESETS.HOLIDAY_WEEKEND;
    return {
      ...preset,
      temperature: 24,
    };
  }

  // 规则 2: 根据天数哈希生成自然轮换天气
  const seed = (day * 9301 + 49297) % 233280;
  const rand = seed / 233280;

  let type: WeatherType = 'SUNNY';
  let temp = 23;

  if (rand < 0.38) {
    type = 'SUNNY';
    temp = 22 + Math.floor((rand / 0.38) * 5); // 22~26°C
  } else if (rand < 0.68) {
    type = 'CLOUDY';
    temp = 19 + Math.floor(((rand - 0.38) / 0.3) * 4); // 19~22°C
  } else if (rand < 0.88) {
    type = 'RAINY';
    temp = 16 + Math.floor(((rand - 0.68) / 0.2) * 4); // 16~19°C
  } else {
    type = 'STORMY';
    temp = 14 + Math.floor(((rand - 0.88) / 0.12) * 3); // 14~16°C
  }

  const preset = WEATHER_PRESETS[type];
  return {
    ...preset,
    temperature: temp,
  };
}
