---
name: One Stop Watch Player
description: A video-first cinema stage with shared direct-stream controls and compact TV browsing.
colors:
  stage: "#000"
  control: "#fff"
  text-primary: "rgba(255, 255, 255, 0.95)"
  text-secondary: "rgba(255, 255, 255, 0.62)"
  text-tertiary: "rgba(255, 255, 255, 0.58)"
  selected-server: "#46d369"
  glass: "rgba(18, 18, 18, 0.72)"
  surface: "rgba(255, 255, 255, 0.08)"
  surface-hover: "rgba(255, 255, 255, 0.14)"
  line: "rgba(255, 255, 255, 0.12)"
typography:
  title:
    fontFamily: "var(--font-sans-nunito), system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  label:
    fontFamily: "var(--font-sans-nunito), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
rounded:
  control: "10px"
  panel: "16px"
  pill: "999px"
spacing:
  compact: "0.5rem"
  regular: "1rem"
  panel: "1.25rem"
components:
  control-button:
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    width: "44px"
    height: "44px"
  primary-button:
    backgroundColor: "{colors.control}"
    textColor: "{colors.stage}"
    rounded: "{rounded.pill}"
    height: "44px"
  server-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.control}"
    rounded: "{rounded.control}"
  episode-card:
    backgroundColor: "rgba(255, 255, 255, 0.07)"
    rounded: "{rounded.control}"
    width: "256px"
  glass-menu:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.panel}"
---

# Design System: One Stop Watch Player

## Overview

**Creative North Star: "The Cinema Stage"**

Experience mode, scoped to the watch/player surface. Cinejoy is the explicit visual reference: true black, compact Nunito Sans type, white controls, and glass menus keep the video dominant. Direct movie and TV streams share one control vocabulary across servers; TV adds compact episode browsing.

This is a record of the implemented watch surface, not a global product identity. Sources: `watch.css`, `NativeWatchPlayer.jsx`, `LegacyWatchPlayer.jsx`, `../../components/player/{UnifiedPlayer,EpisodePanel,PlayerIcon}.jsx`, and `../../../docs/PLAYBACK.md`. The existing embed player remains the default until a resolver is configured. No actual direct-stream provider is included; embedded applications retain their own controls.

**Key Characteristics:**
- Video first; controls along the bottom of the direct player.
- Neutral controls with green selected-server indicators.
- Episode browsing stays separate from playback selection.

## Colors

The stage is true black. White and graded translucent whites carry controls, text, hover surfaces, and dividers. Green identifies the selected server and enabled autoplay. Episode selection uses a subdued white inset outline and a Now Playing label. Do not expand the green accent into a decorative theme.

## Typography

Use the incumbent Nunito Sans stack. The centered header title is compact, medium-weight, single-line, and ellipsized; episode metadata sits below it. Direct-player titles reduce to (0.875rem) on mobile. Time labels use tabular numerals. Paused copy has a larger title, with its summary clamped to available space.

## Layout

The player fills the viewport with a black video stage. In direct mode, a compact title sits at top center and a seek bar sits above the bottom control row. Playback controls occupy the left; server, subtitle, settings, fullscreen, and applicable TV actions occupy the right. Loading and paused states are transient overlays.

Episode cards form a horizontal carousel (256px desktop; 200px at widths up to 768px). Change season replaces that carousel with a compact right-aligned season list, capped at (380px) wide. Selecting a season returns to browsing; selecting an episode changes playback. Menus and episodes sit above the bottom controls, respect safe-area insets, and scroll within the available height.

At widths up to (768px), the volume slider, next-episode shortcut, and picture-in-picture shortcut are hidden; the episode browser remains available. At (480px), controls wrap into two rows. At heights up to (500px), episode descriptions and runtime are hidden to preserve navigation. Legacy embed mode keeps its own separate black header band and the shared episode browser.

## Elevation & Depth

Glass panels combine a translucent dark fill, subtle white border, blur with saturation, and a deep shadow. Black gradients protect title and control legibility over video. Paused/menu shading recedes behind the interactive panels. Exact blur, shadows, transitions, and breakpoints are captured in the scoped `.impeccable/design.json` sidecar.

## Shapes

Controls use small SVG line icons; the shared icon geometry has a (24 × 24) view box and (1.8) stroke width. Direct bottom buttons and cards use gently rounded corners; header buttons and primary text actions are circular or pill-shaped. Panels have broader rounding. Desktop direct controls are (44 × 44px); mobile controls use compact widths with the same height.

## Components

- **Playback controls:** one direct video UI serves all configured servers. White range inputs expose seek and volume; menu triggers expose expanded state. Hover adds a faint white surface; keyboard focus uses a white outline. Idle chrome fades, returning for focus, interaction, pause, menus, buffering, or errors.
- **Server menu:** glass list with a green check on the selected server. Source switching preserves position and playback preferences; the visual controls remain consistent.
- **Episode browser:** thumbnails, episode tags, titles, descriptions, and runtime form compact cards. The playing episode is labeled and its play button disabled. Descriptions expand independently. Desktop arrows page through the rail; mobile uses horizontal scrolling. Loading, retry, and empty states remain inside the panel.
- **Season list:** numbered season rows distinguish the browsed season from the season currently playing. This is a separate compact view, not a full-height sidebar.
- **Settings and subtitles:** compact glass menus use native selects or list rows. Available qualities and captions depend on the source. Movie playback omits episode actions.
- **Transient states:** thin white loading ring, left-aligned paused title/summary, retry actions, and a compact up-next card. Menus close on Escape/outside interaction and restore trigger focus. Reduced motion removes chrome transitions and episode translation; loading motion is slowed.

## Do's and Don'ts

### Do:
- Do preserve the same direct-player controls across returned stream servers.
- Do keep season browsing independent of the playing episode.
- Do retain keyboard focus indicators and reduced-motion handling.

### Don't:
- Don't add episode actions to movies.
- Don't describe iframe internals as themed or controlled by this surface.
- Don't treat the implemented direct player as an already connected stream service.
