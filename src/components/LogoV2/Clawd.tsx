import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { env } from '../../utils/env.js';
export type ClawdPose =
  | 'default'
  | 'arms-up' // both arms raised (used during jump)
  | 'look-left' // both pupils shifted left
  | 'look-right'; // both pupils shifted right

type Props = {
  pose?: ClawdPose;
};

// Standard-terminal pose fragments. The buddy is rendered as 6 rows x 9 cols
// using rounded characters (● / o / ‿ / ╭╮╰╯) instead of the previous
// block-style quadrants. r1E carries the eye row (with background) so the
// look-* poses only swap pupil positions. r1L / r1R show raised arm shapes
// in the arms-up pose. r2L / r2R are the body-row sides. Rows 1, 4, 5, 6
// (top of head, shoulders, legs, feet) are hardcoded below since they don't
// change per pose.
type Segments = {
  /** row 2 left (no bg): head outline left + optional raised arm */
  r1L: string;
  /** row 2 eyes (with bg): 5 chars of eye row, pupils vary per pose */
  r1E: string;
  /** row 2 right (no bg): optional raised arm + head outline right */
  r1R: string;
  /** row 3 left (no bg): head outline left */
  r2L: string;
  /** row 3 right (no bg): head outline right */
  r2R: string;
};

// Mouth row (with bg) — shared across all poses since the mouth doesn't
// change. Sits between r2L and r2R.
const MOUTH = '  ‿  ';
const POSES: Record<ClawdPose, Segments> = {
  default: {
    r1L: ' │',
    r1E: ' ● ● ',
    r1R: '│ ',
    r2L: ' │',
    r2R: '│ '
  },
  'look-left': {
    r1L: ' │',
    r1E: '●● ● ',
    r1R: '│ ',
    r2L: ' │',
    r2R: '│ '
  },
  'look-right': {
    r1L: ' │',
    r1E: ' ● ●●',
    r1R: '│ ',
    r2L: ' │',
    r2R: '│ '
  },
  'arms-up': {
    r1L: 'o│',
    r1E: ' ● ● ',
    r1R: '│o',
    r2L: ' │',
    r2R: '│ '
  }
};

// Apple Terminal uses a bg-fill trick (see below), so only eye poses make
// sense. Arm poses fall back to default.
const APPLE_EYES: Record<ClawdPose, string> = {
  default: ' ●   ● ',
  'look-left': '●●   ',
  'look-right': '   ●●',
  'arms-up': ' ●   ● '
};
export function Clawd({
  pose = 'default'
}: Props) {
  if (env.terminal === 'Apple_Terminal') {
    return <AppleTerminalClawd pose={pose} />;
  }
  const p = POSES[pose];
  return <Box flexDirection="column" alignItems="center">
      <Text color="clawd_body"> ╭─────╮ </Text>
      <Text>
        <Text color="clawd_body">{p.r1L}</Text>
        <Text color="clawd_body" backgroundColor="clawd_background">{p.r1E}</Text>
        <Text color="clawd_body">{p.r1R}</Text>
      </Text>
      <Text>
        <Text color="clawd_body">{p.r2L}</Text>
        <Text color="clawd_body" backgroundColor="clawd_background">{MOUTH}</Text>
        <Text color="clawd_body">{p.r2R}</Text>
      </Text>
      <Text color="clawd_body"> ╰─┬─┬─╯ </Text>
      <Text color="clawd_body">   │ │   </Text>
      <Text color="clawd_body">   ╰─╯   </Text>
    </Box>;
}
function AppleTerminalClawd({
  pose
}: {
  pose: ClawdPose;
}) {
  const eyes = APPLE_EYES[pose];
  return <Box flexDirection="column" alignItems="center">
      <Text>
        <Text color="clawd_body">▗</Text>
        <Text color="clawd_background" backgroundColor="clawd_body">{eyes}</Text>
        <Text color="clawd_body">▖</Text>
      </Text>
      <Text backgroundColor="clawd_body">{' '.repeat(9)}</Text>
      <Text color="clawd_body">▘▘ ▝▝</Text>
    </Box>;
}
