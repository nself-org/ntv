/**
 * Purpose: Shared TV-specific TypeScript types for ntv-appletv.
 *
 * SPORT: F12-REPO-TYPE-MAP.md
 */

import type { TVRemoteEventType } from '@/hooks/useTVEventHandler';

export type { TVRemoteEventType };

/** Generic TV screen props — all screens are focus-driven, no touch props. */
export interface TVScreenProps {
  /** Whether this screen is currently the active/focused top-level screen */
  isFocused?: boolean;
}

/** Pressed state for TV Pressable styling */
export interface TVPressableState {
  focused: boolean;
  pressed: boolean;
}
