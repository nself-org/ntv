/**
 * Purpose: React hook that attaches a TVEventHandler for the component lifecycle.
 * Automatically removes the handler on unmount to prevent memory leaks (CR-C).
 *
 * Inputs:
 *   - handler: (component: null, event: TVRemoteEvent) => void
 *
 * Outputs: void — side-effect only
 *
 * Constraints:
 *   - react-native-tvos required (TVEventHandler not in stock RN)
 *   - Safe to call on non-TV platforms (no-ops gracefully)
 *
 * SPORT: F12-REPO-TYPE-MAP.md
 */

import { useEffect } from 'react';
import { Platform, TVEventHandler } from 'react-native';

export type TVRemoteEventType =
  | 'select'
  | 'playPause'
  | 'menu'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'longSelect'
  | 'longMenu';

export interface TVRemoteEvent {
  eventType: TVRemoteEventType;
  tag?: number;
}

type TVEventCallback = (component: null, event: TVRemoteEvent) => void;

/**
 * useTVEventHandler — attaches and cleans up a TVEventHandler.
 *
 * @param callback - called on each remote event while mounted
 */
export function useTVEventHandler(callback: TVEventCallback): void {
  useEffect(() => {
    if (!Platform.isTV) return;

    const handler = new TVEventHandler();
    handler.enable(null, callback);

    return () => {
      handler.disable();
    };
  }, [callback]);
}
