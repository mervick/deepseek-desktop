# DeepSeek Desktop

> **Unofficial open-source desktop client for DeepSeek. This project is not affiliated with, endorsed by, or sponsored by DeepSeek.**

[![Platform](<https://img.shields.io/badge/platform-Windows%20(x64%2C%20ARM64)%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square>)](https://github.com/mervick/deepseek-desktop/releases)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/mervick/deepseek-desktop/badge)](https://securityscorecards.dev/viewer/?uri=github.com/mervick/deepseek-desktop)
[![CodeQL](https://img.shields.io/badge/CodeQL-enabled-brightgreen?logo=github)](https://github.com/mervick/deepseek-desktop/security/code-scanning)

A privacy-focused desktop client that brings DeepSeek into a dedicated native-style application with global shortcuts, Quick Chat, multi-tab conversations, and desktop integrations — without telemetry.

DeepSeek Desktop is based on the unofficial [Gemini Desktop](https://github.com/bwendell/gemini-desktop) project originally created by [Ben Wendell](https://github.com/bwendell).



<div align="center">

![DeepSeek Desktop Main Window](docs/assets/main_window.png)

</div>

## Why DeepSeek Desktop

DeepSeek Desktop provides a dedicated desktop experience without requiring DeepSeek to stay open in a browser tab.

There is no application telemetry or analytics. Authentication remains handled by DeepSeek.

## Features

- **Multi-tab conversations** — keep multiple conversations open and switch between them instantly.
- **Peek and Hide** — instantly show or hide the application without interrupting your workflow.
- **Always on Top** — keep the DeepSeek window above other applications when needed.
- **Launch at startup** — optionally start DeepSeek Desktop with your system and open it minimized.
- **Cross-platform support** — available for Windows, macOS, and Linux.
- **No telemetry** — the application does not collect usage analytics or application telemetry.

## Installation

Download the latest release from:

https://github.com/mervick/deepseek-desktop/releases

### Windows

- **Windows x64:** `DeepSeek-Desktop-x.x.x-x64-installer.exe`
- **Windows ARM64:** `DeepSeek-Desktop-x.x.x-arm64-installer.exe`

### macOS

- **Apple Silicon:** `DeepSeek-Desktop-x.x.x-arm64.dmg`
- **Intel:** `DeepSeek-Desktop-x.x.x-x64.dmg`

The application is currently not code-signed. If macOS prevents the application from launching, remove the quarantine attribute after installing it:

```bash
xattr -rd com.apple.quarantine "/Applications/DeepSeek Desktop.app"
```

### Linux

- **AppImage:** `DeepSeek-Desktop-x.x.x-x64.AppImage`
- **Debian / Ubuntu:** `DeepSeek-Desktop-x.x.x-x64.deb`

#### AppImage:

```bash
chmod +x "DeepSeek-Desktop-x.x.x-x64.AppImage"
./"DeepSeek-Desktop-x.x.x-x64.AppImage"
```

#### Debian / Ubuntu:
```bash
sudo dpkg -i "DeepSeek-Desktop-x.x.x-x64.deb"
```

## Privacy & Security

DeepSeek Desktop does not include application telemetry or analytics.

The application connects to DeepSeek services to provide access to DeepSeek. Authentication is handled directly by DeepSeek, and session data is stored locally using Chromium's standard storage mechanisms.

The project includes automated security checks through CodeQL and OpenSSF Scorecard.

Additional information:

- [Transparency Report](docs/TRANSPARENCY.md)
- [Privacy Policy](docs/PRIVACY.md)
- [Security Policy](docs/SECURITY.md)


## Contributing

Contributions, bug reports, and improvements are welcome.

Development setup, project conventions, and contribution guidelines are available in:

[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

## Legal

DeepSeek Desktop is an independent, unofficial open-source project.

It is **not affiliated with, endorsed by, sponsored by, or officially associated with DeepSeek**.

DeepSeek and related names, trademarks, and logos belong to their respective owners.

This project is based on the unofficial [Gemini Desktop](https://github.com/bwendell/gemini-desktop) project created by [Ben Wendell](https://github.com/bwendell).

The software is provided "as is", without warranty of any kind. See [docs/DISCLAIMER.md](docs/DISCLAIMER.md) for additional terms and disclaimers.

## License

[MIT](LICENSE)

© 2025 Ben Wendell  
© 2026 Andrey Izman

