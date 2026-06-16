/**
 * Purpose: EPG tab screen — delegates to EPGScreen for full 7-state implementation
 *          with XMLTV data, horizontal timeline grid, and current/next programme overlay.
 *
 * Inputs:  none — EPGScreen uses useEPG + useChannelList hooks internally.
 * Outputs: Full EPG grid with EPGGrid component.
 *
 * Constraints:
 *   - Single thin wrapper; all logic in src/screens/EPGScreen.tsx.
 *   - SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E5-W3-S3-T01
 */

import EPGScreen from '../../screens/EPGScreen';

export default EPGScreen;
