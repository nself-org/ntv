# EPG

**Status:** Active

The Electronic Program Guide (EPG) screen shows the current and upcoming programs for your live TV channels. It presents a time-grid layout for the current day.

**Requires:** nSelf backend with the `epg` plugin installed.

---

## Accessing EPG

The EPG screen is reached from the IPTV channel browser. A calendar icon in the channel list header opens the EPG view. Channels without EPG data are still visible in the browser but appear without program information.

---

## Time Grid

The EPG displays a horizontal time-grid where:

- Rows correspond to channels
- Columns correspond to 30-minute time slots across the current day
- The current program slot is highlighted
- Past slots are dimmed
- The current time is marked with a vertical indicator line

The grid scrolls horizontally to reveal earlier and later slots. Vertically, it scrolls to show all channels.

---

## Program Information

Tapping a program slot shows a detail card with:

- Program title
- Start and end time
- Description (if provided by the EPG source)
- Rating or category (where available)

If the program is currently airing, a **Watch Now** button opens the IPTV player for that channel.

---

## EPG Data Source

EPG data is fetched from the `epg` plugin on the nSelf backend. The plugin aggregates XMLTV-format guide data from configured EPG sources. Channel matching uses `tvg-id` values from the M3U playlist to map channels to guide entries.

Configuring EPG sources on the backend is covered in the [epg plugin documentation](https://docs.nself.org/features/plugins#epg).

---

## Refresh

EPG data is cached on the backend and refreshed by the `epg` plugin on a schedule. The nTV client fetches the current day's guide on EPG screen open and does not poll while the screen is open.

Pull down on the EPG screen to force a fresh fetch from the backend.

## Related

- [[Feature-IPTV]] — channel browser and M3U playlists
- [[Backend-Setup]] — install the `epg` plugin

← [[Home]]
