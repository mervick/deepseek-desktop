# Transparency Report

This document describes how DeepSeek Desktop interacts with your system, network, and data.

DeepSeek Desktop is an independent, unofficial open-source project. It is not affiliated with, endorsed by, or sponsored by DeepSeek.

## Network Activity

DeepSeek Desktop communicates with:

| Domain | Purpose |
| --- | --- |
| `*.deepseek.com` | DeepSeek web interface, authentication, and related services |
| `api.github.com` | Checking for application updates |

DeepSeek Desktop does not operate its own backend service. Communication with DeepSeek happens directly between the application and DeepSeek services.

## Data & Privacy

DeepSeek Desktop does not collect application telemetry or usage analytics.

The application does not independently collect or transmit:

- prompts or conversation history;
- DeepSeek account credentials;
- usage analytics or telemetry.

The following data may be stored locally:

- cookies and session data used by the embedded Chromium environment;
- application preferences;
- window position and size;
- other settings required for desktop features.

Authentication is performed through DeepSeek's own web interface.

For additional information, see:

- [Privacy Policy](PRIVACY.md)
- [Security Policy](SECURITY.md)

## Security Model

DeepSeek Desktop limits navigation and permissions available to the embedded web interface.

Key protections include:

- **Restricted navigation** — application navigation is limited to approved DeepSeek HTTPS domains.
- **External links** — links outside the allowed DeepSeek domains are opened in the system browser.
- **Permission restrictions** — browser permissions are restricted according to their origin.
- **Centralized domain configuration** — allowed DeepSeek domains are defined explicitly in the application source.
- **No remote executable loading** — the application does not download and execute application code from third-party servers.

Because the project is open source, these behaviors can be reviewed directly in the repository.

## Release Verification

Official builds are published only through the project's GitHub Releases page:

https://github.com/mervick/deepseek-desktop/releases

SHA-256 checksum files are published with releases and can be used to verify downloaded artifacts.

### Windows

```powershell
Get-FileHash .\DeepSeek-Desktop-x.y.z-x64-installer.exe -Algorithm SHA256
```

Compare the result with the checksum published for the release.

Windows releases are digitally signed. You can inspect the signature from:

`Properties → Digital Signatures`

### macOS

```bash
shasum -a 256 DeepSeek-Desktop-x.y.z-arm64.dmg
```

### Linux

```bash
sha256sum DeepSeek-Desktop-x.y.z-x64.AppImage
```

Compare the resulting SHA-256 hash with the corresponding checksum file included with the release.

## Open Source

The complete source code, build configuration, security-related code, and release history are publicly available in this repository.

DeepSeek Desktop is based on the unofficial [Gemini Desktop](https://github.com/bwendell/gemini-desktop) project originally created by [Ben Wendell](https://github.com/bwendell).

The DeepSeek Desktop fork is maintained by [Andrey Izman](https://github.com/mervick).

Security issues should be reported according to the project's [Security Policy](SECURITY.md).
