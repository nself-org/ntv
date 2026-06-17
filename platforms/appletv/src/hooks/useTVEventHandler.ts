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

import { useEffect, useRef } from 'react';
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
  // Keep the latest callback in a ref so the TVEventHandler is registered ONCE
  // (mount) and not torn down + re-registered on every render. Callers often
  // pass a fresh callback identity each render (e.g. when player progress state
  // changes every tick); keying the effect on [callback] caused a
  // disable()+enable() storm every frame. The ref forwards to the current
  // callback without re-running the effect.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!Platform.isTV) return;

    const handler = new TVEventHandler();
    handler.enable(null, (component: null, event: TVRemoteEvent) =>
      callbackRef.current(component, event),
    );

    return () => {
      handler.disable();
    };
  }, []);
}
