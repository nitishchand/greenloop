# OS support matrix

| OS | v1 | Post-v1 |
|---|---|---|
| macOS | ✅ Full — `expo-react-native` profile with the iOS Simulator (the only OS where an iOS simulator exists) | Android emulator too |
| Linux | Planning phases only (`/bnb:idea` → `/bnb:architecture` need nothing but Claude Code) | ✅ Full once the `maestro-android` profile lands — **the first post-v1 milestone** |
| Windows | Planning phases only | Via WSL2 with `maestro-android`; native later |

Why it splits this way: the build phases need a device target. The iOS Simulator is
macOS-only; Android emulators run everywhere, so `maestro-android` is what unlocks
Linux and Windows-WSL2 full support.

Portability groundwork already in place: every driver (`bnb-verify`, `bnb-doctor`,
`bnb-loop`, the Stop hook, the installer) is Node, not bash; the E2E device target is a
declared profile field checked by doctor, not an assumption.
