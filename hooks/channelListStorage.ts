/**
 * Purpose: AsyncStorage and SecureStore persistence helpers for the ɳTV channel list hook.
 *          Extracted from useChannelList.ts to keep the hook file under the 300-line cap.
 *
 * Inputs:  Channel[], string[], XtreamCredentials[], Set<string>
 * Outputs: load/save functions for channels, favorites, M3U URLs, and Xtream credentials.
 *
 * Constraints:
 *   - M3U URLs and channel cache stored in AsyncStorage (non-sensitive).
 *   - Xtream credentials (username/password) stored ONLY in expo-secure-store
 *     (iOS Keychain / Android Keystore) — never AsyncStorage.
 *   - SecureStore key format: /^[A-Za-z0-9._-]+$/ (no colons).
 *   - Cache TTL 30 minutes; stale-while-revalidate (serve stale, fetch fresh).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv channel-list-storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { parseM3U } from '../services/m3u-parser';
import type { Channel } from '../services/m3u-parser';
import { xtreamFullSync } from '../services/xtream';
import type { XtreamCredentials } from '../services/xtream';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY_CHANNELS = 'ntv:channels:cache';
const STORAGE_KEY_FAVORITES = 'ntv:channels:favorites';
const STORAGE_KEY_M3U_URLS = 'ntv:m3u:urls';
// SecureStore keys must match /^[A-Za-z0-9._-]+$/ — no colons allowed.
const SECURE_KEY_XTREAM_CREDS = 'ntv_xtream_creds';

/** Cache TTL: 30 minutes. Stale data is served while a background revalidation runs. */
export const CACHE_TTL_MS = 30 * 60 * 1_000;

interface CachedChannels {
  channels: Channel[];
  cachedAt: number;
}

// ─── Channel cache ────────────────────────────────────────────────────────────

/** Load cached channels from AsyncStorage. Returns null on miss/parse error. */
export async function loadCachedChannels(): Promise<Channel[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CHANNELS);
    if (!raw) return null;
    const parsed: CachedChannels = JSON.parse(raw);
    // Serve stale while revalidating (cache TTL checked by caller for staleness decisions)
    return parsed.channels;
  } catch {
    return null;
  }
}

/** Persist a fresh channel list to AsyncStorage with a timestamp. */
export async function saveChannelCache(channels: Channel[]): Promise<void> {
  const payload: CachedChannels = { channels, cachedAt: Date.now() };
  await AsyncStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(payload));
}

// ─── Favorites ────────────────────────────────────────────────────────────────

/** Load persisted favorite channel IDs. Returns an empty set on error. */
export async function loadFavorites(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

/** Persist the current favorites set. */
export async function saveFavorites(favorites: Set<string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify([...favorites]));
}

// ─── M3U URLs ─────────────────────────────────────────────────────────────────

/** Load persisted M3U source URLs. Returns an empty array on error. */
export async function loadM3UUrls(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_M3U_URLS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Persist the current M3U source URL list. */
export async function saveM3UUrls(urls: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_M3U_URLS, JSON.stringify(urls));
}

// ─── Xtream credentials ───────────────────────────────────────────────────────

/**
 * Load Xtream credentials from SecureStore (Keychain/Keystore).
 * Never reads credentials from AsyncStorage.
 */
export async function loadXtreamCreds(): Promise<XtreamCredentials[]> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEY_XTREAM_CREDS);
    return raw ? (JSON.parse(raw) as XtreamCredentials[]) : [];
  } catch {
    return [];
  }
}

/**
 * Persist Xtream credentials to SecureStore.
 * Deletes the key when the list is empty to avoid stale entry in Keychain.
 */
export async function saveXtreamCreds(creds: XtreamCredentials[]): Promise<void> {
  if (creds.length === 0) {
    await SecureStore.deleteItemAsync(SECURE_KEY_XTREAM_CREDS);
    return;
  }
  await SecureStore.setItemAsync(SECURE_KEY_XTREAM_CREDS, JSON.stringify(creds));
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/**
 * Fetch and parse an M3U playlist URL.
 * Times out after 15 seconds.
 */
export async function fetchM3U(url: string): Promise<Channel[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching M3U: ${url}`);
    const text = await response.text();
    const { channels } = parseM3U(text, { sourceUrl: url });
    return channels;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Full Xtream sync: authenticate + fetch all channels.
 * Thin wrapper around xtreamFullSync for uniform error handling.
 */
export async function fetchXtream(creds: XtreamCredentials): Promise<Channel[]> {
  const result = await xtreamFullSync(creds);
  return result.channels;
}
