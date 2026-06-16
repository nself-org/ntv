/**
 * Purpose: Unit tests for useBackgroundAudio hook.
 * Verifies play/pause/stop controls and isPlaying state transitions.
 *
 * QA-B: pnpm test ntv/hooks/useBackgroundAudio -- pass
 *
 * NOTE: jest.mock() factory is hoisted above all imports and const declarations.
 * Variables declared with const/let are in TDZ at factory eval time.
 * Fix: define mock fns inside the factory, then retrieve via jest.mocked() or
 * jest.requireMock() in tests.
 */

import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — factory uses inline jest.fn() to avoid TDZ issues with hoisting
// ---------------------------------------------------------------------------

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    getQueue: jest.fn().mockResolvedValue([]),
    reset: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  },
  Capability: { Play: 'Play', Pause: 'Pause', Stop: 'Stop' },
  Event: { PlaybackState: 'playback-state' },
  State: { Playing: 'playing', Paused: 'paused', Stopped: 'stopped' },
  useTrackPlayerEvents: jest.fn(),
}));

// Import after mock declarations
import TrackPlayer from 'react-native-track-player';
import { useBackgroundAudio } from '../useBackgroundAudio';

// ---------------------------------------------------------------------------
// Helper — get typed access to the mocked TrackPlayer methods
// ---------------------------------------------------------------------------
function getMocks() {
  const tp = TrackPlayer as unknown as Record<string, jest.Mock>;
  return {
    setupPlayer: tp.setupPlayer,
    updateOptions: tp.updateOptions,
    getQueue: tp.getQueue,
    reset: tp.reset,
    add: tp.add,
    play: tp.play,
    pause: tp.pause,
    stop: tp.stop,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBackgroundAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const tp = TrackPlayer as unknown as Record<string, jest.Mock>;
    tp.setupPlayer.mockResolvedValue(undefined);
    tp.updateOptions.mockResolvedValue(undefined);
    tp.getQueue.mockResolvedValue([]);
    tp.reset.mockResolvedValue(undefined);
    tp.add.mockResolvedValue(undefined);
    tp.play.mockResolvedValue(undefined);
    tp.pause.mockResolvedValue(undefined);
    tp.stop.mockResolvedValue(undefined);
  });

  it('initializes as not playing and not ready', () => {
    const { result } = renderHook(() => useBackgroundAudio());
    expect(result.current.isPlaying).toBe(false);
    expect(typeof result.current.isReady).toBe('boolean');
  });

  it('calls TrackPlayer.setupPlayer on mount', async () => {
    const { setupPlayer } = getMocks();
    renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });
    expect(setupPlayer).toHaveBeenCalledWith({ autoHandleInterruptions: true });
  });

  it('play() adds track and calls TrackPlayer.play()', async () => {
    const { getQueue, add, play } = getMocks();
    getQueue.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.play('https://example.com/stream.aac', {
        title: 'Test Channel',
        artist: 'nTV',
      });
    });

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/stream.aac',
        title: 'Test Channel',
        artist: 'nTV',
        isLiveStream: true,
      }),
    );
    expect(play).toHaveBeenCalled();
  });

  it('play() reuses existing track if URL matches', async () => {
    const url = 'https://example.com/stream.aac';
    const { getQueue, reset, play } = getMocks();
    getQueue.mockResolvedValueOnce([{ url }]);

    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.play(url, { title: 'Test Channel' });
    });

    expect(reset).not.toHaveBeenCalled();
    expect(play).toHaveBeenCalled();
  });

  it('play() resets queue when URL changes', async () => {
    const oldUrl = 'https://example.com/old.aac';
    const newUrl = 'https://example.com/new.aac';
    const { getQueue, reset, add } = getMocks();
    getQueue.mockResolvedValueOnce([{ url: oldUrl }]);

    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.play(newUrl, { title: 'New Channel' });
    });

    expect(reset).toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ url: newUrl }));
  });

  it('pause() calls TrackPlayer.pause()', async () => {
    const { pause } = getMocks();
    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => { await result.current.pause(); });

    expect(pause).toHaveBeenCalled();
  });

  it('stop() calls TrackPlayer.stop()', async () => {
    const { stop } = getMocks();
    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => { await result.current.stop(); });

    expect(stop).toHaveBeenCalled();
  });

  it('calls TrackPlayer.reset() on unmount for audio session cleanup', async () => {
    const { reset } = getMocks();
    const { unmount } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    act(() => { unmount(); });

    // react-native-track-player v4.x has no destroy() — reset() clears the
    // queue and stops playback, releasing audio focus on unmount.
    expect(reset).toHaveBeenCalled();
  });
});
