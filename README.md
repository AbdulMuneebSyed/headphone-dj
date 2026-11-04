# Headphone DJ

A local Chrome extension for shaping YouTube audio on your Mac, with 50 sound presets and a 10-band equalizer. Chrome 116 or newer is required.

## Install on your Mac

1. Keep this entire `Headphone-DJ` folder in its current location.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode**, then click **Load unpacked**.
4. Select this `Headphone-DJ` folder (the folder containing `manifest.json`).
5. Open YouTube, start a video, and click the Chrome Extensions puzzle button.
6. Open **Headphone DJ**, optionally pin it, then click **Start mixer**.

You can reopen the mixer with **Option + Shift + Y**. If another extension uses that shortcut, change it at `chrome://extensions/shortcuts`.

## Controls

- Ten EQ bands: cut or boost each frequency by up to 12 dB.
- Bass and treble: broad tone adjustments, separate from the ten EQ bands.
- Volume: 0 to 150% of the tab's current audio level. YouTube's own volume and Mac volume still apply.
- Balance: move audio left or right.
- 50 presets: choose a tonal starting point from the list below. Changing presets preserves your volume, balance and bypass state. Manual tone edits show Custom.
- Bypass: compare with the original, unprocessed tab sound. This bypasses volume and balance too.
- Reset all: restore neutral EQ and tone, centered balance, 100% volume and processing on.
- Stop mixer: end capture and restore Chrome's original tab output.

The meter uses the actual processed signal. Silence displays as silence. Reduced-motion mode pauses meter animation. Settings are saved locally and survive closing the panel or restarting Chrome. Capture itself must be started again after restarting Chrome.

## The 50 sound presets

| Sound family | Presets |
| --- | --- |
| Original profiles | Flat, Bass lift, Clear vocals, Late night, DJ curve |
| Bass | Deep bass, Sub bass, Tight bass, Warm bass, Bass cut |
| Treble and warmth | Bright highs, Smooth highs, Airy, Treble cut, Warm & soft |
| Voice | Speech focus, Podcast, Dialogue clarity, Vocal warmth, Vocal presence |
| Music | Acoustic, Classical, Jazz, Rock, Pop, Hip-hop, R&B, Electronic, House, Techno, Drum & bass, Dubstep, Trance, Reggae, Latin, Afrobeats, K-pop, Lo-fi, Ambient, Metal |
| Playback and instruments | Cinema, Gaming, Footsteps, Live concert, Piano, Guitar, Strings, Percussion, Small speakers, Listening comfort |

These are subjective EQ curves. Instrument and gaming names describe the frequencies emphasized; they do not isolate instruments or guarantee a gaming advantage. Every profile has a distinct combination of EQ and tone settings.

Only one tab is mixed at a time. Closing the panel does not stop processing. Closing the captured tab ends the session. To switch tabs, stop the current session, open the extension from the other tab and start it there.

## Audio output and scope

Connect your headphones and select them as your Mac's sound output. The extension follows Chrome's default audio output; it cannot choose a Bluetooth device or control the headphone hardware.

This adjusts tab audio. It cannot independently separate vocals, drums and instruments within an already mixed YouTube track. It does not affect other apps or the entire Mac. Starting capture requires clicking the extension from the target tab. Chrome internal pages cannot be captured.

Large boosts can sound distorted. A dynamics compressor reduces strong peaks, but is not a guarantee against clipping or excessive headphone loudness. Lower the affected bands or output volume if the sound is harsh.

## Privacy and permissions

No accounts, analytics, server, uploads, microphone capture or recordings. Audio is processed in memory on this Mac and routed directly back to Chrome's output.

- `tabCapture`: receive audio from the tab you choose to mix.
- `offscreen`: keep audio processing alive while the panel is closed.
- `storage`: remember mixer settings on this Mac.
- `activeTab`: access the tab you invoke the extension on.

No access to all websites is requested.

## Troubleshooting

If Chrome denies capture, return to the YouTube tab and open the extension using its toolbar icon before starting. If there is no sound, check that the video is playing, YouTube is not muted, the Chrome tab is not muted, Volume is above 0, and your Mac has the intended output selected. Click Stop mixer to return to normal audio. If needed, disable the extension at `chrome://extensions` and reload YouTube.

This is an unpacked local installation, not a Chrome Web Store release. Keep the folder in place: moving or deleting it breaks the installation. After editing source files, click Reload on its card at `chrome://extensions`.

## Development

The extension has no runtime dependencies and no build step. Load the repository directory as an unpacked extension. Run `npm test` with Node.js 20 or later to check the 50 unique profiles, parameter limits, reset behavior and preserved volume/balance/bypass state. No package installation is needed for these tests.

Version 1.1.0 expands the five original profiles to 50 distinct presets. Version 1.0.0 introduced the mixer. The requested Chrome permissions are unchanged.
