#!/usr/bin/env bash
# Install (or replace) a macOS launchd job that runs sync_and_publish.sh every Monday 09:00.
# Remove with: launchctl bootout gui/$(id -u)/com.brijeshmishra.profile-sync && rm ~/Library/LaunchAgents/com.brijeshmishra.profile-sync.plist
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
label="com.brijeshmishra.profile-sync"
plist="$HOME/Library/LaunchAgents/$label.plist"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
cat > "$plist" <<P
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$root/scripts/sync_and_publish.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/profile-sync.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/profile-sync.log</string>
</dict></plist>
P
launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$plist"
echo "Installed: runs Mondays 09:00 (a missed run happens at next wake). Log: ~/Library/Logs/profile-sync.log"
