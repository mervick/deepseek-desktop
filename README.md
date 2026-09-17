# DeepSeek Desktop — Native, Private AI Experience

> [!IMPORTANT]
> **Project status: on hiatus — not actively maintained** (July 2026). The app continues to work and all [releases](https://github.com/mervick/deepseek-desktop/releases) remain available, but issues and PRs may go unanswered and no new development is planned for now.

<div align="center">

[![Project Status: Inactive](https://www.repostatus.org/badges/latest/inactive.svg)](https://www.repostatus.org/#inactive)
[![GitHub release](https://img.shields.io/github/v/release/mervick/deepseek-desktop?style=flat-square)](https://github.com/mervick/deepseek-desktop/releases)
[![GitHub last commit](https://img.shields.io/github/last-commit/mervick/deepseek-desktop?style=flat-square)](https://github.com/mervick/deepseek-desktop/commits/main)
[![Platform](<https://img.shields.io/badge/platform-Windows%20(x64%2C%20ARM64)%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square>)](https://github.com/mervick/deepseek-desktop/releases)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/mervick/deepseek-desktop/badge)](https://securityscorecards.dev/viewer/?uri=github.com/mervick/deepseek-desktop)
[![CodeQL](https://img.shields.io/badge/CodeQL-enabled-brightgreen?logo=github)](https://github.com/mervick/deepseek-desktop/security/code-scanning)

</div>

> **DeepSeek, but better.** A privacy-first desktop client for DeepSeek with native controls, global hotkeys, and zero telemetry.

DeepSeek Desktop is based on the unofficial [Gemini Desktop](https://github.com/bwendell/gemini-desktop)
project originally created by [Ben Wendell](https://github.com/bwendell).

<p align="center">
  <a href="#-feature-highlights">Feature Highlights</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-privacy--security">Privacy</a> •
  <a href="#-whats-next">What's Next</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

<div align="center">

![DeepSeek Desktop Main Window Interface](docs/assets/main_window.png)

</div>

## ✨ Why DeepSeek Desktop

- **Desktop-native workflow**: Use DeepSeek in a dedicated app window instead of a browser tab.
- **Fast keyboard control**: Trigger Quick Chat, hide/restore the app, and stay in flow.
- **Trust-first defaults**: No telemetry, DeepSeek auth, and clear transparency/security docs.

## 🌟 Feature Highlights

- **Multi-tab conversations** — keep multiple chat contexts open and switch instantly.
- **Launch at startup** — optionally start with your system and open minimized.
- **Quick Chat** — summon a Spotlight-style prompt from anywhere with a global hotkey.
- **Peek and Hide** — hide to tray and restore instantly when you need it.
- **Response notifications** — get notified when DeepSeek finishes while the app is unfocused.
- **Always On Top** — keep DeepSeek visible above other windows when multitasking.

## 📥 Installation

Download the latest release for your platform from [GitHub Releases](https://github.com/mervick/deepseek-desktop/releases).

### Windows

- **Windows (x64):** `DeepSeek-Desktop-x.x.x-x64-installer.exe`
- **Windows (ARM64):** `DeepSeek-Desktop-x.x.x-arm64-installer.exe`

### macOS

- **Apple Silicon (M1/M2/M3)**: `DeepSeek-Desktop-x.x.x-arm64.dmg`
- **Intel**: `DeepSeek-Desktop-x.x.x-x64.dmg`

> ⚠️ The app is not code-signed yet. On first launch, remove quarantine:
>
> ```bash
> xattr -rd com.apple.quarantine "/Applications/DeepSeek Desktop.app"
> ```

### Linux

- **AppImage**: `DeepSeek-Desktop-x.x.x-x64.AppImage`
- **Debian/Ubuntu**: `DeepSeek-Desktop-x.x.x-x64.deb`

```bash
# AppImage
chmod +x "DeepSeek-Desktop-x.x.x-x64.AppImage"
./"DeepSeek-Desktop-x.x.x-x64.AppImage"

# Debian/Ubuntu
sudo dpkg -i "DeepSeek-Desktop-x.x.x-x64.deb"
```

## 🔒 Privacy & Security

DeepSeek Desktop has **no telemetry** and only connects to DeepSeek domains for DeepSeek access.
Authentication is handled by DeepSeek, and sessions are stored using Chromium's standard local mechanisms.
For full details, read the [Transparency Report](docs/TRANSPARENCY.md), [Privacy Policy](docs/PRIVACY.md), and [Security Policy](docs/SECURITY.md).

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+Alt+Space` (`Cmd+Shift+Alt+Space` on macOS) — Toggle Quick Chat
- `Ctrl+Shift+Space` (`Cmd+Shift+Space` on macOS) — Peek and Hide (toggle app visibility)
- `Ctrl+P` (`Cmd+P` on macOS) — Print current page to PDF

> 💡 You can customize hotkeys in Settings.

## 🗺️ What's Next

- Continue improving desktop-native quality and reliability across Windows, macOS, and Linux.
- Expand productivity workflows around Quick Chat, startup behavior, and window controls.
- Keep strengthening test quality and release confidence for faster, safer updates.

See detailed shipped history and planning in [docs/ROADMAP.md](docs/ROADMAP.md).

## 🤝 Contributing

Contributions are welcome. For setup, standards, and workflow expectations, see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## ⚖️ Legal

This is an unofficial, open-source project and is **not** affiliated with DeepSeek.
**DeepSeek** is a trademark of its respective owner.
This project is based on the unofficial [Gemini Desktop](https://github.com/bwendell/gemini-desktop)
project by [Ben Wendell](https://github.com/bwendell).
Use this software at your own risk; it is provided "as is" without any warranty. See [docs/DISCLAIMER.md](docs/DISCLAIMER.md) for full terms, including user responsibility and warranty disclaimers.

## 📄 License

[MIT](LICENSE) © 2025 Ben Wendell, © 2026 Andrey Izman
