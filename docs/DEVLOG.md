# Iron Breaker: Devlog

*From first prototype to public demo in 11 days.* (Written 2026-10-27 from the git history; for the blog and the itch devlog.)

## v0.1.0 Demo (Oct 26)
First public demo. Free, plays in the browser on phone and desktop.

- **Fire button forgiveness:** a thumb that lands just off the fire button still fires and keeps your locked target. Before, a miss dropped you onto the map and lost the lock.
- **A small hidden credit** is painted somewhere in two missions. Find it.

## Oct 22: Presentation
- **Title screen and logo.** The game opens on the Iron Breaker logo over security-camera views of the battlefield.
- **Live-feed backdrop** behind every menu: three pixel-art scenes cutting through black, scanlines, a REC light, game version, a military date-time group and a satellite scan readout that never sits still.
- **New menu music**, looped with no audible seam.
- **Ending box** after mission 10, with a "play again from scratch" option, also found in the Career screen.
- **Missions unlock one at a time**, and the campaign comic cards reveal as you progress.
- **Itch build** hides the test tools. Zoom, AI level, FPS, pixel mode, enemy range rings and the off-screen arrows stay in your hands.

## Oct 21: Sound, voice and story
- **Full sound pass:** cannons, machine guns, impacts, explosions, engines (the APC has its own), rain, thunder, flares, air raid warnings.
- **An onboard AI voice** calls out drones, low armour, kill streaks, reinforcements and mission results. One line at a time, never talking over itself.
- **Mission key art** for all 10 levels, shown on the briefing. A story intro for the training ground.
- **Campaign screen:** tap an unlocked mission to go straight to its briefing.
- **Tuned from playtesting:** quieter warnings, no more repeated "air support ready", rain half as loud.

## Oct 19: The big feature week
- **Recruit training:** eight coached stations on a desert range, skippable.
- **Night missions** with moonlight, headlight cones, street lamps (some broken) and flares for you and the enemy.
- **Rain and lightning.** Fog and sandstorms were tried and cut: they made the game too hard.
- **Voxel vehicles:** Tiger I, 8x8 APC, Panzer IV, tank destroyers, technicals, supply trucks, rendered from 3D voxel models.
- **Field guide** with a blueprint-style armour diagram and every enemy vehicle.
- **All text in one language file**, ready for translation.
- **Lighting pass:** blast and muzzle-flash light, baked ambient occlusion, drifting cloud shadows.

## Oct 18: The campaign takes shape
- **10 missions:** destroy, capture, hold, escort, co-op assault and a multi-stage finale across city, harbour, desert and highlands.
- **Desert levels** with rammable mud houses, sand ridges that hide you and slow you, oases.
- **A-10 air support**, charged by kills, plus air-dropped missiles and spare drones.
- **Kill streaks** and a WoT-Blitz-style icon HUD.
- **Player stats** and a career record.
- **Fixed** the drive stick on iOS (touch IDs can be negative there).

## Oct 17: Enemies get smart
- **Tactical AI in three tiers:** from "spread out and surround" up to using cover, flanking and hunting.
- **Anti-tank infantry** hiding inside houses, and **kamikaze drone swarms**.
- **Real-world scale** (5 px = 1 m) for the first city; vehicles ram through low walls and trees.
- **Upgrades, repair kits, repair stations and companions** (drones and robots).

## Oct 16: Day one
- Tank and APC, auto machine gun, guided missiles with a reload you can feel.
- Buildings with tiers: shells tunnel through small houses, big ones take work.
- Pinch-zoom and double-tap blocked on iOS so the game stays put.
