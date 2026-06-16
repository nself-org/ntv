# Video Transcoding

nTV uses hardware-accelerated FFmpeg transcoding to convert media files into HLS and DASH streams. Transcoding runs on your nSelf server — your content never leaves your infrastructure.

---

## Requirements

- nTV bundle: `nself plugin install media-processing streaming`
- Optional: GPU with NVENC (NVIDIA) or VAAPI (Intel/AMD) for hardware acceleration

---

## How It Works

The `media-processing` plugin (Go orchestrator + Rust rsmpeg worker) manages a transcoding queue:

1. A transcoding job is created when a file is added to the library or when a user requests a format not yet available.
2. The Go orchestrator assigns the job to a Rust worker.
3. The Rust worker calls rsmpeg (FFmpeg bindings) to encode the file.
4. Output segments are written to `NTV_TRANSCODE_DIR` (default: `./data/ntv/transcoded/`).
5. The `streaming` plugin serves segments via HLS (`media.m3u8`) or DASH (`manifest.mpd`).

---

## HLS Multi-Rendition

Each file is transcoded into multiple bitrate renditions for adaptive bitrate streaming:

| Rendition | Resolution | Video bitrate | Audio bitrate |
|-----------|------------|---------------|---------------|
| 360p | 640×360 | 800 kbps | 96 kbps |
| 720p | 1280×720 | 2500 kbps | 128 kbps |
| 1080p | 1920×1080 | 5000 kbps | 192 kbps |
| 4K | 3840×2160 | 15000 kbps | 256 kbps (if source is 4K) |

The nTV player selects renditions based on network speed. On a slow connection, it drops to 360p to avoid buffering.

---

## Hardware Acceleration

Set `NTV_TRANSCODE_HW` in your `.env`:

| Value | Encoder | Requires |
|-------|---------|----------|
| `nvenc` | NVIDIA NVENC | NVIDIA GPU + `nvidia-container-runtime` |
| `vaapi` | Intel/AMD VAAPI | Intel/AMD GPU + `vaapi` device |
| `cpu` (default) | libx264/libx265 | No GPU required |

Hardware acceleration reduces transcoding time by 5-10x for GPU owners.

---

## DASH MPD

In addition to HLS, the `streaming` plugin generates a DASH MPD manifest for compatible players. DASH is preferred on Android TV for lower latency.

---

## Storage

Transcoded segments are stored in `NTV_TRANSCODE_DIR`. Plan for approximately 3-5 GB per hour of content per rendition. A 10TB media library with 4 renditions requires roughly 40-60 TB of transcode storage — most operators transcode on demand and cache only recently viewed content.

Set `NTV_TRANSCODE_CACHE_DAYS=7` to auto-delete transcode segments older than 7 days.
