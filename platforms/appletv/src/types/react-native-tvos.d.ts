/**
 * Purpose: Type augmentations for react-native-tvos APIs not present in
 * the standard @types/react-native package.
 *
 * react-native-tvos extends React Native with TV-specific components and APIs:
 *   - TVEventHandler: wires Siri Remote / D-pad events
 *   - TVFocusGuideView: constrains/guides D-pad focus traversal
 *   - hasTVPreferredFocus: Pressable/View prop for initial focus placement
 *
 * These declarations let TypeScript resolve the imports without errors.
 * The actual runtime implementations come from react-native-tvos.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS type declarations (T-P3-E4-W2-S5-T04)
 */

import type React from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { ViewProps, ViewStyle, StyleProp } from 'react-native';

// ---------------------------------------------------------------------------
// Augment react-native module
// ---------------------------------------------------------------------------

declare module 'react-native' {
  /** Remote event payload from Siri Remote / Android TV D-pad */
  interface TVRemoteEventPayload {
    eventType: string;
    eventKeyAction?: number;
    tag?: number;
  }

  type TVEventHandlerCallback = (
    component: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
  ) => void;

  /** Attaches and removes a TV remote event listener. react-native-tvos only. */
  export class TVEventHandler {
    enable(component: null, callback: TVEventHandlerCallback): void;
    disable(): void;
  }

  interface TVFocusGuideViewProps extends ViewProps {
    children?: ReactNode;
    /** Automatically focus the first focusable child when the guide receives focus. */
    autoFocus?: boolean;
    /**
     * Explicit focus destinations — refs this guide can redirect focus to.
     * Pass [] for default traversal within the subtree. react-native-tvos only.
     */
    destinations?: React.RefObject<unknown>[];
    /** Trap focus: block D-pad navigation downward out of this view. */
    trapFocusDown?: boolean;
    /** Trap focus: block D-pad navigation upward out of this view. */
    trapFocusUp?: boolean;
    /** Trap focus: block D-pad navigation leftward out of this view. */
    trapFocusLeft?: boolean;
    /** Trap focus: block D-pad navigation rightward out of this view. */
    trapFocusRight?: boolean;
    /** Style override. */
    style?: StyleProp<ViewStyle>;
  }

  /** Constrains D-pad focus traversal to within this subtree. react-native-tvos only. */
  export const TVFocusGuideView: ComponentType<TVFocusGuideViewProps>;

  /**
   * Augment PressableStateCallbackType with the `focused` property added by
   * react-native-tvos for D-pad/Siri Remote focus state on Pressable components.
   * Not present in @types/react-native 0.73 but available at runtime in rn-tvos.
   */
  interface PressableStateCallbackType {
    focused?: boolean;
  }
}
