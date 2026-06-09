import * as React from 'react';
import { useEffect, useState } from 'react';
import { Box, Text, color, useTheme } from '../../ink.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { stringWidth } from '../../ink/stringWidth.js';
import {
  getLayoutMode,
  calculateLayoutDimensions,
  calculateOptimalLeftWidth,
  formatWelcomeMessage,
  truncatePath,
  getRecentActivitySync,
  getRecentReleaseNotesSync,
  getLogoDisplayData,
} from '../../utils/logoV2Utils.js';
import { truncate } from '../../utils/format.js';
import { getDisplayPath } from '../../utils/file.js';
import { env } from '../../utils/env.js';
import { Clawd } from './Clawd.js';
import { FeedColumn } from './FeedColumn.js';
import {
  createRecentActivityFeed,
  createWhatsNewFeed,
  createProjectOnboardingFeed,
  createGuestPassesFeed,
} from './feedConfigs.js';
import { getGlobalConfig, saveGlobalConfig } from 'src/utils/config.js';
import { resolveThemeSetting } from 'src/utils/systemTheme.js';
import { getInitialSettings } from 'src/utils/settings/settings.js';
import { isDebugMode, isDebugToStdErr, getDebugLogPath } from 'src/utils/debug.js';
import {
  getSteps,
  shouldShowProjectOnboarding,
  incrementProjectOnboardingSeenCount,
} from '../../projectOnboardingState.js';
import { CondensedLogo } from './CondensedLogo.js';
import { OffscreenFreeze } from '../OffscreenFreeze.js';
import { checkForReleaseNotesSync } from '../../utils/releaseNotes.js';
import { getDumpPromptsPath } from 'src/services/api/dumpPrompts.js';
import { isEnvTruthy } from 'src/utils/envUtils.js';
import {
  getStartupPerfLogPath,
  isDetailedProfilingEnabled,
} from 'src/utils/startupProfiler.js';
import { EmergencyTip } from './EmergencyTip.js';
import { VoiceModeNotice } from './VoiceModeNotice.js';
import { Opus1mMergeNotice } from './Opus1mMergeNotice.js';
import { feature } from 'bun:bundle';

// Conditional require so ChannelsNotice.tsx tree-shakes when both flags are
// false. A module-scope helper component inside a feature() ternary does NOT
// tree-shake (docs/feature-gating.md); the require pattern eliminates the
// whole file. VoiceModeNotice uses the unsafe helper pattern but VOICE_MODE
// is external: true so it's moot there.
/* eslint-disable @typescript-eslint/no-require-imports */
const ChannelsNoticeModule =
  feature('KAIROS') || feature('KAIROS_CHANNELS')
    ? (require('./ChannelsNotice.js') as typeof import('./ChannelsNotice.js'))
    : null;
/* eslint-enable @typescript-eslint/no-require-imports */
import { SandboxManager } from 'src/utils/sandbox/sandbox-adapter.js';
import {
  useShowGuestPassesUpsell,
  incrementGuestPassesSeenCount,
} from './GuestPassesUpsell.js';
import {
  useShowOverageCreditUpsell,
  incrementOverageCreditUpsellSeenCount,
  createOverageCreditFeed,
} from './OverageCreditUpsell.js';
import { plural } from '../../utils/stringUtils.js';
import { useAppState } from '../../state/AppState.js';
import { getEffortSuffix } from '../../utils/effort.js';
import { useMainLoopModel } from '../../hooks/useMainLoopModel.js';
import { renderModelSetting } from '../../utils/model/model.js';
const LEFT_PANEL_MAX_WIDTH = 50;

// Brand first character line shown at the top of the bordered box, just
// below the upper border. Layout: orange bar + bold brand name + dimColor
// version. Spec requirement for the redesign.
function BrandHeader({ version }: { version: string }) {
  return (
    <Box>
      <Text color="startupAccent">▌ </Text>
      <Text bold color="claude">Free Code</Text>
      <Text dimColor> v{version}</Text>
    </Box>
  );
}

// Status row with circular icons (● active / ○ inactive) for model / effort /
// permission. Line spacing 0.5 per spec. permission uses active=true by
// default; the project doesn't track a "current permission mode" in AppState
// at the time of writing, so we don't have a reliable signal for it here.
function StatusRow({
  modelActive,
  effortActive,
  permissionActive,
}: {
  modelActive: boolean;
  effortActive: boolean;
  permissionActive: boolean;
}) {
  return (
    <Box flexDirection="row" gap={1} marginTop={0}>
      <Text>
        <Text color={modelActive ? 'success' : 'inactive'}>
          {modelActive ? '●' : '○'}
        </Text>
        <Text dimColor> model</Text>
      </Text>
      <Text>
        <Text color={permissionActive ? 'success' : 'inactive'}>
          {permissionActive ? '●' : '○'}
        </Text>
        <Text dimColor> permissions</Text>
      </Text>
      <Text>
        <Text color={effortActive ? 'success' : 'inactive'}>
          {effortActive ? '●' : '○'}
        </Text>
        <Text dimColor> effort</Text>
      </Text>
    </Box>
  );
}

export function LogoV2() {
  const activities = getRecentActivitySync();
  const username = getGlobalConfig().oauthAccount?.displayName ?? '';
  const { columns } = useTerminalSize();
  const showOnboarding = shouldShowProjectOnboarding();
  const showSandboxStatus = SandboxManager.isSandboxingEnabled();
  const showGuestPassesUpsell = useShowGuestPassesUpsell();
  const showOverageCreditUpsell = useShowOverageCreditUpsell();
  const agent = useAppState(s => s.agent);
  const effortValue = useAppState(s => s.effortValue);
  const config = getGlobalConfig();
  let changelog;
  try {
    changelog = getRecentReleaseNotesSync(
      3,
      MACRO.VERSION,
      config.lastReleaseNotesSeen
    );
  } catch {
    changelog = [];
  }
  const [announcement] = useState(() => {
    const announcements = getInitialSettings().companyAnnouncements;
    if (!announcements || announcements.length === 0) {
      return;
    }
    return config.numStartups === 1
      ? announcements[0]
      : announcements[Math.floor(Math.random() * announcements.length)];
  });
  const { hasReleaseNotes } = checkForReleaseNotesSync(
    config.lastReleaseNotesSeen
  );
  const isCondensedMode =
    !hasReleaseNotes &&
    !showOnboarding &&
    !isEnvTruthy(process.env.CLAUDE_CODE_FORCE_FULL_LOGO);

  useEffect(() => {
    const currentConfig = getGlobalConfig();
    if (currentConfig.lastReleaseNotesSeen === MACRO.VERSION) {
      return;
    }
    saveGlobalConfig(current => ({
      ...current,
      lastReleaseNotesSeen: MACRO.VERSION,
    }));
    if (showOnboarding) {
      incrementProjectOnboardingSeenCount();
    }
  }, [config, showOnboarding]);

  useEffect(() => {
    if (showGuestPassesUpsell && !showOnboarding && !isCondensedMode) {
      incrementGuestPassesSeenCount();
    }
  }, [showGuestPassesUpsell, showOnboarding, isCondensedMode]);

  useEffect(() => {
    if (
      showOverageCreditUpsell &&
      !showOnboarding &&
      !showGuestPassesUpsell &&
      !isCondensedMode
    ) {
      incrementOverageCreditUpsellSeenCount();
    }
  }, [
    showOverageCreditUpsell,
    showOnboarding,
    showGuestPassesUpsell,
    isCondensedMode,
  ]);

  const model = useMainLoopModel();
  const fullModelDisplayName = renderModelSetting(model);
  const {
    version,
    cwd,
    billingType,
    agentName: agentNameFromSettings,
  } = getLogoDisplayData();
  const agentName = agent ?? agentNameFromSettings;
  const effortSuffix = getEffortSuffix(model, effortValue);
  const modelDisplayName = truncate(
    fullModelDisplayName + effortSuffix,
    LEFT_PANEL_MAX_WIDTH - 20
  );

  // Border style: round on modern terminals (iTerm2 / WezTerm / VS Code /
  // Alacritty). Apple Terminal misrenders some box-drawing characters in
  // certain locales, so fall back to single-line corners there.
  const borderStyle: 'round' | 'single' =
    env.terminal === 'Apple_Terminal' ? 'single' : 'round';

  if (isCondensedMode) {
    return (
      <>
        <CondensedLogo />
        <VoiceModeNotice />
        <Opus1mMergeNotice />
        {ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNotice />}
        {isDebugMode() && (
          <Box paddingLeft={2} flexDirection="column">
            <Text color="warning">Debug mode enabled</Text>
            <Text dimColor>
              Logging to: {isDebugToStdErr() ? 'stderr' : getDebugLogPath()}
            </Text>
          </Box>
        )}
        <EmergencyTip />
        {process.env.CLAUDE_CODE_TMUX_SESSION && (
          <Box paddingLeft={2} flexDirection="column">
            <Text dimColor>
              tmux session: {process.env.CLAUDE_CODE_TMUX_SESSION}
            </Text>
            <Text dimColor>
              {process.env.CLAUDE_CODE_TMUX_PREFIX_CONFLICTS
                ? `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} ${process.env.CLAUDE_CODE_TMUX_PREFIX} d (press prefix twice - Claude uses ${process.env.CLAUDE_CODE_TMUX_PREFIX})`
                : `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} d`}
            </Text>
          </Box>
        )}
        {announcement && (
          <Box paddingLeft={2} flexDirection="column">
            {!process.env.IS_DEMO && config.oauthAccount?.organizationName && (
              <Text dimColor>
                Message from {config.oauthAccount.organizationName}:
              </Text>
            )}
            <Text>{announcement}</Text>
          </Box>
        )}
      </>
    );
  }

  const layoutMode = getLayoutMode(columns);
  const userTheme = resolveThemeSetting(getGlobalConfig().theme);
  const borderTitle = ` ${color('startupAccent', userTheme)('Free Code')} ${color('inactive', userTheme)(`v${version}`)} `;
  const compactBorderTitle = color('startupAccent', userTheme)(' Free Code ');

  // Brand first-character row, rendered just below the upper border. Shared
  // between compact and full layouts.
  const brandHeader = <BrandHeader version={version} />;

  // Common notices + sandbox / debug blocks that follow the bordered box.
  const afterBoxNotices = (
    <>
      <VoiceModeNotice />
      <Opus1mMergeNotice />
      {ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNotice />}
      {isDebugMode() && (
        <Box paddingLeft={2} flexDirection="column">
          <Text color="warning">Debug mode enabled</Text>
          <Text dimColor>
            Logging to: {isDebugToStdErr() ? 'stderr' : getDebugLogPath()}
          </Text>
        </Box>
      )}
      <EmergencyTip />
      {process.env.CLAUDE_CODE_TMUX_SESSION && (
        <Box paddingLeft={2} flexDirection="column">
          <Text dimColor>
            tmux session: {process.env.CLAUDE_CODE_TMUX_SESSION}
          </Text>
          <Text dimColor>
            {process.env.CLAUDE_CODE_TMUX_PREFIX_CONFLICTS
              ? `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} ${process.env.CLAUDE_CODE_TMUX_PREFIX} d (press prefix twice - Claude uses ${process.env.CLAUDE_CODE_TMUX_PREFIX})`
              : `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} d`}
          </Text>
        </Box>
      )}
      {announcement && (
        <Box paddingLeft={2} flexDirection="column">
          {!process.env.IS_DEMO && config.oauthAccount?.organizationName && (
            <Text dimColor>
              Message from {config.oauthAccount.organizationName}:
            </Text>
          )}
          <Text>{announcement}</Text>
        </Box>
      )}
      {showSandboxStatus && (
        <Box marginTop={1} flexDirection="column">
          <Text color="warning">
            Your bash commands will be sandboxed. Disable with /sandbox.
          </Text>
        </Box>
      )}
    </>
  );

  if (layoutMode === 'compact') {
    let welcomeMessage = formatWelcomeMessage(username);
    if (stringWidth(welcomeMessage) > columns - 4) {
      welcomeMessage = formatWelcomeMessage(null);
    }
    const cwdAvailableWidth = agentName
      ? columns - 4 - 1 - stringWidth(agentName) - 3
      : columns - 4;
    const truncatedCwd = truncatePath(
      cwd,
      Math.max(cwdAvailableWidth, 10)
    );
    return (
      <>
        <OffscreenFreeze>
          <Box
            flexDirection="column"
            borderStyle={borderStyle}
            borderColor="startupAccent"
            borderText={{
              content: compactBorderTitle,
              position: 'top',
              align: 'start',
              offset: 1,
            }}
            paddingX={1}
            paddingY={1}
            alignItems="center"
            width={columns}
          >
            {brandHeader}
            <Text bold>{welcomeMessage}</Text>
            <Box marginY={1}>
              <Clawd />
            </Box>
            <Text dimColor>{modelDisplayName}</Text>
            <StatusRow
              modelActive={true}
              permissionActive={true}
              effortActive={effortValue !== undefined}
            />
            <Text dimColor>{billingType}</Text>
            <Text dimColor>
              {agentName ? `@${agentName} · ${truncatedCwd}` : truncatedCwd}
            </Text>
          </Box>
        </OffscreenFreeze>
        {afterBoxNotices}
      </>
    );
  }

  const welcomeMessage = formatWelcomeMessage(username);
  // Compose the model + billing + organization line; render model and
  // organization with different dimColor tones per spec.
  const orgName = config.oauthAccount?.organizationName;
  const modelLinePrimary = modelDisplayName;
  const modelLineSecondary = billingType;
  const cwdAvailableWidth = agentName
    ? LEFT_PANEL_MAX_WIDTH - 1 - stringWidth(agentName) - 3
    : LEFT_PANEL_MAX_WIDTH;
  const truncatedCwd = truncatePath(cwd, Math.max(cwdAvailableWidth, 10));
  const cwdLine = agentName ? `@${agentName} · ${truncatedCwd}` : truncatedCwd;
  const optimalLeftWidth = calculateOptimalLeftWidth(
    welcomeMessage,
    cwdLine,
    modelLinePrimary
  );
  const { leftWidth, rightWidth } = calculateLayoutDimensions(
    columns,
    layoutMode,
    optimalLeftWidth
  );

  // Left panel: welcome (left-aligned per spec) + buddy + model/cwd +
  // status row. alignItems="flex-start" gives the left-aligned appearance
  // for the welcome message.
  const leftPanel = (
    <Box
      flexDirection="column"
      width={leftWidth}
      justifyContent="space-between"
      alignItems="flex-start"
      minHeight={9}
    >
      <Box marginTop={1}>
        <Text bold>{welcomeMessage}</Text>
      </Box>
      <Clawd />
      <Box flexDirection="column" alignItems="flex-start">
        <Text dimColor>
          {modelLinePrimary}
          {modelLineSecondary ? ` · ${modelLineSecondary}` : ''}
        </Text>
        {orgName && !process.env.IS_DEMO && (
          <Text dimColor>{orgName}</Text>
        )}
        <Text dimColor>{cwdLine}</Text>
      </Box>
      <StatusRow
        modelActive={true}
        permissionActive={true}
        effortActive={effortValue !== undefined}
      />
    </Box>
  );

  const divider =
    layoutMode === 'horizontal' ? (
      <Box
        height="100%"
        borderStyle="single"
        borderColor="startupAccent"
        borderDimColor
        borderTop={false}
        borderBottom={false}
        borderLeft={false}
      />
    ) : null;

  const feeds = showOnboarding
    ? [
        createProjectOnboardingFeed(getSteps()),
        createRecentActivityFeed(activities),
      ]
    : showGuestPassesUpsell
      ? [createRecentActivityFeed(activities), createGuestPassesFeed()]
      : showOverageCreditUpsell
        ? [createRecentActivityFeed(activities), createOverageCreditFeed()]
        : [createRecentActivityFeed(activities), createWhatsNewFeed(changelog)];

  const rightPanel =
    layoutMode === 'horizontal' ? (
      <FeedColumn feeds={feeds} maxWidth={rightWidth} />
    ) : null;

  const inner = (
    <Box
      flexDirection={layoutMode === 'horizontal' ? 'row' : 'column'}
      paddingX={1}
      gap={1}
    >
      {leftPanel}
      {divider}
      {rightPanel}
    </Box>
  );

  return (
    <>
      <OffscreenFreeze>
        <Box
          flexDirection="column"
          borderStyle={borderStyle}
          borderColor="startupAccent"
          borderText={{
            content: borderTitle,
            position: 'top',
            align: 'start',
            offset: 3,
          }}
        >
          {brandHeader}
          {inner}
        </Box>
      </OffscreenFreeze>
      {afterBoxNotices}
    </>
  );
}
