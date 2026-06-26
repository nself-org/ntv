/**
 * Purpose: Shared layout constants for the ɳTV EPG grid. Extracted so both
 *          EPGGridComponents.tsx and EPGGridStyles.ts can consume them without
 *          a circular import.
 *
 * Inputs: none. Outputs: pixel/minute layout constants used for EPG geometry.
 *
 * Constraints: values are fixed layout maths; consumers (EPGGrid.tsx) rely on
 *              identical values for scroll/offset calculations.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv EPG-grid-components
 */

export const PIXELS_PER_MINUTE = 4;
export const ROW_HEIGHT = 64;
export const LOGO_COLUMN_WIDTH = 72;
export const TIMELINE_HEIGHT = 32;
export const TIMELINE_LABEL_INTERVAL_MINUTES = 30;
