import React, { useEffect, useState } from 'react';
import { Box, Text } from '../../ink.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';

/**
 * 打字机效果：逐字渲染 `text`，每 `charDelayMs` 毫秒显示下一个字符。
 *
 * 用法：
 *   <TypingEffect text="Welcome back Paolo!" bold />
 *
 * 退出条件：
 *   - 完成一次后保持稳定（不再 re-trigger），避免每帧抖动
 *   - 终端列宽 < 24 时直接全显（不浪费动画）
 */
export function TypingEffect({
  text,
  charDelayMs = 50,
  bold = false,
}: {
  text: string;
  charDelayMs?: number;
  bold?: boolean;
}): React.ReactNode {
  const [shown, setShown] = useState('');
  const { columns } = useTerminalSize();

  useEffect(() => {
    if (columns < 24) {
      // 太窄直接显示，避免动画看不见
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= text.length) {
        setShown(text);
        clearInterval(id);
      } else {
        setShown(text.slice(0, i));
      }
    }, charDelayMs);
    return () => clearInterval(id);
    // charDelayMs 与 text 变化会重启动画
  }, [text, charDelayMs, columns]);

  return <Text bold={bold}>{shown}</Text>;
}

/**
 * 脉冲动画：在 `visible ? color : 'inactive'` 之间切换，制造心跳效果。
 *
 * 用法：
 *   <BlinkText text="No recent activity" periodMs={1000} color="success" />
 *
 * `periodMs` 是完整一轮的周期（半亮 + 半暗）。
 */
export function BlinkText({
  text,
  periodMs = 1000,
  color = 'success',
}: {
  text: string;
  periodMs?: number;
  color?: 'success' | 'error' | 'warning' | 'permission' | 'planMode' | 'startupAccent' | 'claude' | 'inactive';
}): React.ReactNode {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 2), periodMs / 2);
    return () => clearInterval(id);
  }, [periodMs]);

  return (
    <Text dimColor={tick === 0} color={tick === 1 ? color : undefined}>
      {text}
    </Text>
  );
}

/**
 * 品牌首行动画：组合打字机 + 橙色竖条。
 *
 * 替代在 `borderText` 中静态显示的 `▌ Free Code v{VERSION}`，
 * 渲染在 welcome 屏第一行（border 下方）。当列宽 < 60 时退化为静态。
 */
export function AnimatedBrandHeader({
  version,
  tagline,
}: {
  version: string;
  tagline?: string;
}): React.ReactNode {
  const { columns } = useTerminalSize();
  const head = `▌ Free Code v${version}`;
  const showTagline = columns >= 100 && tagline;

  if (columns < 60) {
    return (
      <Box flexDirection="row">
        <Text color="startupAccent">▌ </Text>
        <Text bold>{`Free Code v${version}`}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="row">
      <Text color="startupAccent">▌ </Text>
      <TypingEffect text={`Free Code v${version}`} bold />
      {showTagline ? <Text dimColor>{`  · ${tagline}`}</Text> : null}
    </Box>
  );
}
