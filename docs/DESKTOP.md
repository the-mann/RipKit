# Desktop builds

`npm run desktop:build` builds the React UI, gathers platform-specific tools,
and packages RipKit. Run this on the target operating system. Mac builds
currently target Apple Silicon on GitHub Actions; Windows builds target x64.

The app includes Electron, standalone yt-dlp, FFmpeg, ffprobe, and Node for
YouTube JavaScript challenges. Users do not install Python or Node. Files save
under Downloads/RipKit; application scratch files use the OS application-data
directory. Only the loopback interface serves the local UI.

The Desktop builds workflow runs on pushes to main and manually. Each runner
launches Electron in smoke-test mode to execute every bundled tool and check
the backend, then uploads installers as workflow artifacts. A v-prefixed tag
also creates a draft GitHub release.

These initial builds are unsigned. macOS notarization and Windows signing
require developer signing credentials. Automatic installation of updates is
not enabled; install newer build artifacts to update. YouTube may still
request authentication, and metadata depends on what the video provides.

FFmpeg static builds have their own redistribution licenses. Preserve the
licenses provided with these dependencies when distributing installers.
