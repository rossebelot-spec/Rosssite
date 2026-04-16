#!/bin/bash
# Installs the Cowork bridge to ~/.claude/
# Run once from your terminal: bash cowork-bridge/install.sh

set -e

BRIDGE_DIR="$HOME/.claude/cowork-bridge"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing Cowork bridge to $BRIDGE_DIR..."

# Create directories
mkdir -p "$BRIDGE_DIR/hooks"

# Copy hook scripts
cp "$SOURCE_DIR/hooks/check-signal.sh" "$BRIDGE_DIR/hooks/check-signal.sh"
chmod +x "$BRIDGE_DIR/hooks/check-signal.sh"

cp "$SOURCE_DIR/hooks/notify-cowork.sh" "$BRIDGE_DIR/hooks/notify-cowork.sh"
chmod +x "$BRIDGE_DIR/hooks/notify-cowork.sh"

# Copy initial signal.json (only if not already present — don't overwrite live signals)
if [ ! -f "$BRIDGE_DIR/signal.json" ]; then
  cp "$SOURCE_DIR/signal.json" "$BRIDGE_DIR/signal.json"
fi

# Seed .last_mtime so the hook doesn't fire on the first prompt
stat -f '%m' "$BRIDGE_DIR/signal.json" > "$BRIDGE_DIR/.last_mtime"

# Merge hook into ~/.claude/settings.json
SETTINGS="$HOME/.claude/settings.json"
if [ ! -f "$SETTINGS" ]; then
  cp "$SOURCE_DIR/settings.json" "$SETTINGS"
  echo "Created $SETTINGS"
else
  echo ""
  echo "⚠️  $SETTINGS already exists."
  echo "   Manually add these to ~/.claude/settings.json:"
  echo ""
  echo '   hooks.UserPromptSubmit: { "hooks": [{ "type": "command", "command": "~/.claude/cowork-bridge/hooks/check-signal.sh" }] }'
  echo '   hooks.Stop:             { "hooks": [{ "type": "command", "command": "~/.claude/cowork-bridge/hooks/notify-cowork.sh" }] }'
  echo ""
fi

echo ""
echo "✓ Cowork bridge installed."
echo "  Inbound signal:  $BRIDGE_DIR/signal.json  (Cowork → Claude Code)"
echo "  Outbound signal: ~/rosssite/cowork-bridge/cowork-signal.json  (Claude Code → Cowork)"
echo "  Hook scripts:    $BRIDGE_DIR/hooks/"
echo "  Settings:        $SETTINGS"
