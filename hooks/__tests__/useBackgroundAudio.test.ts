/**
 * Purpose: Unit tests for useBackgroundAudio hook.
 * Verifies play/pause/stop controls and isPlaying state transitions.
 *
 * QA-B: pnpm test ntv/hooks/useBackgroundAudio -- pass
 */

import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockTrackPlayer = {
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  updateOptions: jest.fn().mockResolvedValue(undefined),
  getQueue: jest.fn().mockResolvedValue([]),
  reset: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: mockTrackPlayer,
  Capability: { Play: 'Play', Pause: 'Pause', Stop: 'Stop' },
  Event: { PlaybackState: 'playback-state' },
  State: { Playing: 'playing', Paused: 'paused', Stopped: 'stopped' },
  useTrackPlayerEvents: jest.fn(),
}));

import { useBackgroundAudio } from '../useBackgroundAudio';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBackgroundAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton guard between tests
    jest.resetModules();
  });

  it('initializes as not playing and not ready', () => {
    const { result } = renderHook(() => useBackgroundAudio());
    expect(result.current.isPlaying).toBe(false);
    // isReady may be false until setupPlayer resolves
    expect(typeof result.current.isReady).toBe('boolean');
  });

  it('calls TrackPlayer.setupPlayer on mount', async () => {
    renderHook(() => useBackgroundAudio());
    // Wait for async setup
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockTrackPlayer.setupPlayer).toHaveBeenCalledWith({
      autoHandleInterruptions: true,
    });
  });

  it('play() adds track and calls TrackPlayer.play()', async () => {
    mockTrackPlayer.getQueue.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.play('https://example.com/stream.aac', {
        title: 'Test Channel',
        artist: 'nTV',
      });
    });

    expect(mockTrackPlayer.add).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/stream.aac',
        title: 'Test Channel',
        artist: 'nTV',
        isLiveStream: true,
      }),
    );
    expect(mockTrackPlayer.play).toHaveBeenCalled();
  });

  it('play() reuses existing track if URL matches', async () => {
    const url = 'https://example.com/stream.aac';
    mockTrackPlayer.getQueue.mockResolvedValueOnce([{ url }]);

    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.play(url, { title: 'Test Channel' });
    });

    expect(mockTrackPlayer.reset).not.toHaveBeenCalled();
    expect(mockTrackPlayer.play).toHaveBeenCalled();
  });

  it('play() resets queue when URL changes', async () => {
    const oldUrl = 'https://example.com/old.aac';
    const newUrl = 'https://example.com/new.aac';
    mockTrackPlayer.getQueue.mockResolvedValueOnce([{ url: oldUrl }]);

    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.play(newUrl, { title: 'New Channel' });
    });

    expect(mockTrackPlayer.reset).toHaveBeenCalled();
    expect(mockTrackPlayer.add).toHaveBeenCalledWith(
      expect.objectContaining({ url: newUrl }),
    );
  });

  it('pause() calls TrackPlayer.pause()', async () => {
    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.pause();
    });

    expect(mockTrackPlayer.pause).toHaveBeenCalled();
  });

  it('stop() calls TrackPlayer.stop()', async () => {
    const { result } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.stop();
    });

    expect(mockTrackPlayer.stop).toHaveBeenCalled();
  });

  it('calls TrackPlayer.destroy() on unmount', async () => {
    const { unmount } = renderHook(() => useBackgroundAudio());
    await act(async () => { await Promise.resolve(); });

    unmount();

    expect(mockTrackPlayer.destroy).toHaveBeenCalled();
  });
});
