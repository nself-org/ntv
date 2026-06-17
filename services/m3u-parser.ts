/**
 * Purpose: Pure TypeScript M3U/Extended M3U playlist parser for ɳTV IPTV channel lists.
 * Inputs:  Raw M3U playlist text string (from network fetch or file read).
 * Outputs: Typed Channel[] array with id, name, url, logoUrl, group, tvgId extracted from #EXTINF.
 * Constraints: No external deps — pure string parsing. Handles UTF-8 BOM, Windows CRLF, empty lines.
 * SPORT: F12-REPO-TYPE-MAP.md ntv iptv-data feature
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Channel {
  /** tvg-id attribute from #EXTINF, or generated slug if absent */
  id: string;
  /** Human-readable channel name (text after last comma in #EXTINF) */
  name: string;
  /** Direct stream URL (HLS/DASH/MP4/RTSP) */
  url: string;
  /** tvg-logo attribute — may be empty string */
  logoUrl: string;
  /** group-title attribute — may be empty string */
  group: string;
  /** Raw tvg-id value (preserved separately from generated id) */
  tvgId: string;
  /** tvg-name attribute — fallback display name */
  tvgName: string;
  /** Source playlist URL this channel was parsed from */
  sourceUrl?: string;
}

export interface ParseM3UOptions {
  /** Optional source URL to attach to each channel for tracking */
  sourceUrl?: string;
}

export interface ParseM3UResult {
  channels: Channel[];
  /** Non-fatal issues encountered during parse (malformed lines, etc.) */
  warnings: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const M3U_HEADER = '#EXTM3U';
const EXTINF_PREFIX = '#EXTINF:';

// Regex for extracting named attributes from #EXTINF line
// Handles: key="value" and key=value (unquoted) forms
const ATTR_RE = /(\w[\w-]*)=(?:"([^"]*?)"|([^\s,]+))/g;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip UTF-8 BOM if present and normalize line endings to LF.
 */
function normalizeText(text: string): string {
  // Strip UTF-8 BOM (U+FEFF)
  const stripped = text.startsWith('﻿') ? text.slice(1) : text;
  // Normalize Windows CRLF → LF
  return stripped.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Parse key=value attributes from an #EXTINF line into a plain record.
 * Handles both quoted ("value") and unquoted (value) attribute forms.
 */
function parseAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(line)) !== null) {
    const key = match[1].toLowerCase();
    // match[2] = quoted value, match[3] = unquoted value
    attrs[key] = match[2] !== undefined ? match[2] : (match[3] ?? '');
  }
  return attrs;
}

/**
 * Extract display name from #EXTINF line: text after the last comma.
 * If no comma, fallback to empty string.
 */
function extractDisplayName(line: string): string {
  const commaIdx = line.lastIndexOf(',');
  if (commaIdx === -1) return '';
  return line.slice(commaIdx + 1).trim();
}

/**
 * Generate a deterministic slug-style ID from channel name when tvg-id is absent.
 */
function slugId(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return slug ? `${slug}-${index}` : `channel-${index}`;
}

// ─── Stream URL safety ──────────────────────────────────────────────────────────

/**
 * Schemes that are safe to hand to the video player. Anything else
 * (`javascript:`, `file:`, `data:`, `content:`, arbitrary custom schemes) is a
 * potential injection vector when the playlist is fetched from an untrusted
 * source, so it is rejected at the parse boundary before it can reach the player.
 */
const ALLOWED_STREAM_SCHEMES = ['http:', 'https:', 'rtmp:', 'rtmps:', 'rtsp:'];

/**
 * Validate that a parsed stream URL uses an allowlisted scheme.
 * Relative or scheme-less lines and any disallowed scheme return false.
 * Exported so callers (e.g. the add-source form) can reuse the same allowlist.
 */
export function isAllowedStreamUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === '') return false;
  const match = /^([a-z][a-z0-9+.-]*:)/i.exec(trimmed);
  if (!match) return false; // no scheme → reject (no relative stream URLs)
  return ALLOWED_STREAM_SCHEMES.includes(match[1].toLowerCase());
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse an Extended M3U playlist text into a Channel array.
 *
 * Handles:
 * - UTF-8 BOM at file start
 * - Windows CRLF line endings
 * - Empty / comment lines (non-#EXTINF directives skipped)
 * - Missing tvg-id → generated slug ID
 * - Missing tvg-logo or group-title → empty string
 * - Multiple consecutive blank lines between entries
 *
 * @param text  Raw M3U playlist content as a string
 * @param opts  Optional parse configuration
 * @returns     Parsed channels + any non-fatal warnings
 */
export function parseM3U(text: string, opts: ParseM3UOptions = {}): ParseM3UResult {
  const channels: Channel[] = [];
  const warnings: string[] = [];

  const normalized = normalizeText(text);
  const lines = normalized.split('\n');

  if (lines.length === 0 || !lines[0].trimStart().startsWith(M3U_HEADER)) {
    warnings.push('Missing #EXTM3U header — attempting parse anyway');
  }

  let pendingExtinf: string | null = null;
  let channelIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === '' || line.startsWith('#EXTM3U')) {
      // Skip blank lines and the file header
      continue;
    }

    if (line.startsWith(EXTINF_PREFIX)) {
      pendingExtinf = line;
      continue;
    }

    if (line.startsWith('#')) {
      // Other directives (#EXTVLCOPT, #EXTGRP, etc.) — ignore
      continue;
    }

    // Non-comment, non-empty line after #EXTINF = stream URL
    const url = line;

    // Reject untrusted/disallowed-scheme URLs (javascript:, file:, data:, …)
    // before they can ever reach the player via router.push.
    if (!isAllowedStreamUrl(url)) {
      warnings.push(`Line ${i + 1}: stream URL rejected (disallowed scheme): ${url}`);
      pendingExtinf = null;
      continue;
    }

    if (pendingExtinf !== null) {
      const attrs = parseAttributes(pendingExtinf);
      const displayName = extractDisplayName(pendingExtinf);
      const tvgId = attrs['tvg-id'] ?? '';
      const tvgName = attrs['tvg-name'] ?? '';
      const logoUrl = attrs['tvg-logo'] ?? '';
      const group = attrs['group-title'] ?? '';
      const name = displayName || tvgName || tvgId || `Channel ${channelIndex + 1}`;
      const id = tvgId.trim() !== '' ? tvgId.trim() : slugId(name, channelIndex);

      channels.push({
        id,
        name,
        url,
        logoUrl,
        group,
        tvgId,
        tvgName,
        sourceUrl: opts.sourceUrl,
      });

      channelIndex++;
      pendingExtinf = null;
    } else {
      // URL line without preceding #EXTINF — include as unnamed channel
      warnings.push(`Line ${i + 1}: stream URL without #EXTINF metadata, added as unnamed channel`);
      channels.push({
        id: slugId(`channel-${channelIndex}`, channelIndex),
        name: `Channel ${channelIndex + 1}`,
        url,
        logoUrl: '',
        group: '',
        tvgId: '',
        tvgName: '',
        sourceUrl: opts.sourceUrl,
      });
      channelIndex++;
    }
  }

  return { channels, warnings };
}

// ─── XMLTV Parser ─────────────────────────────────────────────────────────────

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

/**
 * Convert XMLTV datetime string (YYYYMMDDHHmmss [±HHMM]) to ISO-8601.
 * Example input: "20260616213000 +0200" → "2026-06-16T21:30:00+02:00"
 */
function xmltvDateToISO(raw: string): string {
  // Remove any whitespace, handle optional timezone offset
  const cleaned = raw.trim();
  // Basic format: YYYYMMDDHHmmss or YYYYMMDDHHmmss ±HHMM
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{4}))?/);
  if (!match) return cleaned; // Return raw if not parseable
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
 * Extract text content from first matching XML tag using a simple regex.
 * Not a full XML parser — suitable for well-formed XMLTV files.
 */
function extractTagText(xml: string, tag: string, lang?: string): string {
  // Try with optional lang attribute first if requested
  if (lang) {
    const langRe = new RegExp(`<${tag}[^>]*lang=["']${lang}["'][^>]*>([^<]*)<\/${tag}>`, 'i');
    const m = langRe.exec(xml);
    if (m) return m[1].trim();
  }
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

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

  // Extract all <programme ...>...</programme> blocks
  const programmeRe = /<programme([^>]*)>([\s\S]*?)<\/programme>/gi;
  let match: RegExpExecArray | null;

  while ((match = programmeRe.exec(xml)) !== null) {
    const attrStr = match[1];
    const body = match[2];

    // Parse start, stop, channel attributes
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

    // Extract episode-num (xmltv_ns system preferred)
    const epNumMatch = /\bepisode-num[^>]*system=["']xmltv_ns["'][^>]*>([^<]*)<\/episode-num>/i.exec(body);

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
