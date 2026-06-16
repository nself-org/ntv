/**
 * Purpose: Channel list tab screen — delegates to ChannelListScreen for full
 *          7-state M3U/Xtream IPTV channel list implementation.
 *
 * Inputs:  none — ChannelListScreen uses useChannelList hook internally.
 * Outputs: Full channel list with FlashList, search, category tabs, favorites.
 *
 * Constraints:
 *   - Single thin wrapper; all logic in src/screens/ChannelListScreen.tsx.
 *   - All strings i18n-wrapped via useNselfTranslation in ChannelListScreen.
 *   - SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E5-W3-S3-T01
 */

import ChannelListScreen from '../../screens/ChannelListScreen';

export default ChannelListScreen;
