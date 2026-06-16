/**
 * Purpose: Compatibility shim for react-native-tvos TV-specific APIs.
 *
 * react-native-tvos adds TVFocusGuideView and TVEventHandler to the react-native
 * package at runtime, but @types/react-native does not declare them. This module
 * exports them with safe any-typed wrappers so the rest of src/tv/ can import
 * without TypeScript errors.
 *
 * Constraints:
 *   - Only import from src/tv/ files — never from phone/tablet screens.
 *   - At runtime on tvOS/Android TV/Fire TV, the real implementations are used.
 *   - On phone/tablet, Platform.isTV guard prevents these from being called.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tv-compat; T-P3-E5-W3-S3-T01
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { View, type ViewProps } from 'react-native';

const rn = require('react-native') as {
  TVFocusGuideView: React.ComponentType<TVFocusGuideViewProps>;
  TVEventHandler: TVEventHandlerConstructor;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TVFocusGuideViewProps extends ViewProps {
  children?: React.ReactNode;
  autoFocus?: boolean;
  destinations?: unknown[];
  trapFocusDown?: boolean;
  trapFocusUp?: boolean;
  trapFocusLeft?: boolean;
  trapFocusRight?: boolean;
}

export interface TVRemoteEvent {
  eventType: string;
  eventKeyAction?: number;
  tag?: number;
}

type TVEventHandlerCallback = (component: null, event: TVRemoteEvent) => void;

export interface TVEventHandlerConstructor {
  new (): TVEventHandlerInstance;
}

export interface TVEventHandlerInstance {
  enable(component: null, callback: TVEventHandlerCallback): void;
  disable(): void;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * TVFocusGuideView — guides D-pad focus traversal on tvOS/Android TV.
 * Falls back to View on non-TV platforms (Platform.isTV === false).
 */
export const TVFocusGuideView: React.ComponentType<TVFocusGuideViewProps> =
  rn.TVFocusGuideView ?? View;

/**
 * TVEventHandler — registers a D-pad / Siri Remote event listener.
 * On non-TV platforms this constructor is a no-op stub.
 */
export const TVEventHandler: TVEventHandlerConstructor =
  rn.TVEventHandler ??
  class {
    enable(_: null, __: TVEventHandlerCallback): void {}
    disable(): void {}
  };
