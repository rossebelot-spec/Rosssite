#!/bin/bash
# Installs the Cowork bridge to ~/.claude/
# Run once from your terminal: bash cowork-bridge/install.sh

set -e

BRIDGE_DIR="$HOME/.claude/cowork-bridge"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing Cowork bridge to $BRIDGE_DIR..."

# Create directories
mkdir -p "$BRIDGE_DIR/hooks"

# Copy hook script
cp "$SOURCE_DIR/hooks/check-signal.sh" "$BRIDGE_DIR/hooks/check-signal.sh"
chmod +x "$BRIDGE_DIR/hooks/check-signal.sh"

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
  echo "   Manually add this to the 'hooks.UserPromptSubmit' array:"
  echo ""
  echo '   { "hooks": [{ "type": "command", "command": "~/.claude/cowork-bridge/hooks/check-signal.sh" }] }'
  echo ""
fi

echo ""
echo "✓ Cowork bridge installed."
echo "  Signal file: $BRIDGE_DIR/signal.json"
echo "  Hook script: $BRIDGE_DIR/hooks/check-signal.sh"
echo "  Settings:    $SETTINGS"
