/**
 * Purpose: XMLTV EPG (Electronic Programme Guide) XML parser for ɳTV.
 *          Extracted from m3u-parser.ts to keep that file under the 300-line cap.
 *
 * Inputs:  Raw XMLTV XML content as a string (fetched from EPG URL or file).
 * Outputs: Program[] + non-fatal warnings[].
 *
 * Constraints:
 *   - Regex-based, not a full DOM parser (performance-safe on React Native / Hermes).
 *   - Handles standard <programme> elements: channel, start, stop, title, desc,
 *     category, episode-num (xmltv_ns system).
 *   - Language fallback: tries lang="en" first, then any language.
 *   - Datetime conversion: "YYYYMMDDHHmmss [±HHMM]" → ISO-8601.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv xmltv-parser feature
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Program {
  /** tvg-id / channel attribute from <programme channel="..."> */
  channelId: string;
  /** Programme start time as ISO-8601 string (converted from XMLTV format) */
  start: string;
  /** Programme stop time as ISO-8601 string */
  stop: string;
  /** Programme title (first <title> element text) */
  title: string;
  /** Programme description (first <desc> element text, may be empty) */
  description: string;
  /** Programme category (first <category> element text, may be empty) */
  category: string;
  /** Episode/series info from <episode-num system="xmltv_ns"> if present */
  episodeNum?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert XMLTV datetime string (YYYYMMDDHHmmss [±HHMM]) to ISO-8601.
 * Example input: "20260616213000 +0200" → "2026-06-16T21:30:00+02:00"
 * Returns the raw string if it does not match the expected XMLTV format.
 */
function xmltvDateToISO(raw: string): string {
  const cleaned = raw.trim();
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{4}))?/);
  if (!match) return cleaned;
  const [, year, month, day, hour, min, sec, tz] = match;
  const base = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
  if (tz) {
    const sign = tz[0];
    const tzH = tz.slice(1, 3);
    const tzM = tz.slice(3, 5);
    return `${base}${sign}${tzH}:${tzM}`;
  }
  return `${base}Z`;
}

/**
 * Extract text content from the first matching XML tag using a simple regex.
 * Not a full XML parser — suitable for well-formed XMLTV files only.
 * Tries lang-specific variant first; falls back to the first tag of any language.
 */
function extractTagText(xml: string, tag: string, lang?: string): string {
  if (lang) {
    const langRe = new RegExp(`<${tag}[^>]*lang=["']${lang}["'][^>]*>([^<]*)<\/${tag}>`, 'i');
    const m = langRe.exec(xml);
    if (m) return m[1].trim();
  }
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a raw XMLTV EPG XML string into a Program[] array.
 *
 * XMLTV format reference: https://wiki.xmltv.org/index.php/XMLTVFormat
 * Handles standard <programme> elements with channel, start, stop attributes
 * plus <title>, <desc>, <category>, <episode-num> child elements.
 *
 * @param xml  Raw XMLTV XML content as string
 * @returns    Parsed programs + any non-fatal warnings
 */
export function parseXMLTV(xml: string): { programs: Program[]; warnings: string[] } {
  const programs: Program[] = [];
  const warnings: string[] = [];

  const programmeRe = /<programme([^>]*)>([\s\S]*?)<\/programme>/gi;
  let match: RegExpExecArray | null;

  while ((match = programmeRe.exec(xml)) !== null) {
    const attrStr = match[1];
    const body = match[2];

    const startMatch = /\bstart=["']([^"']+)["']/.exec(attrStr);
    const stopMatch = /\bstop=["']([^"']+)["']/.exec(attrStr);
    const channelMatch = /\bchannel=["']([^"']+)["']/.exec(attrStr);

    if (!startMatch || !channelMatch) {
      warnings.push('Skipped <programme> missing start or channel attribute');
      continue;
    }

    const channelId = channelMatch[1];
    const start = xmltvDateToISO(startMatch[1]);
    const stop = stopMatch ? xmltvDateToISO(stopMatch[1]) : '';

    const epNumMatch =
      /\bepisode-num[^>]*system=["']xmltv_ns["'][^>]*>([^<]*)<\/episode-num>/i.exec(body);

    programs.push({
      channelId,
      start,
      stop,
      title: extractTagText(body, 'title', 'en') || extractTagText(body, 'title'),
      description: extractTagText(body, 'desc', 'en') || extractTagText(body, 'desc'),
      category: extractTagText(body, 'category', 'en') || extractTagText(body, 'category'),
      episodeNum: epNumMatch ? epNumMatch[1].trim() : undefined,
    });
  }

  return { programs, warnings };
}
