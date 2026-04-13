#!/bin/bash
# Cowork bridge — inject supervisor signal if a new one has arrived.
# Registered as a UserPromptSubmit hook in ~/.claude/settings.json.
# Cost: one stat(1) call. Zero LLM tokens unless a new signal exists.

SIGNAL_FILE="$HOME/.claude/cowork-bridge/signal.json"
MTIME_FILE="$HOME/.claude/cowork-bridge/.last_mtime"

# Nothing to do if signal file hasn't been created yet
if [ ! -f "$SIGNAL_FILE" ]; then
  exit 0
fi

# Current mtime (macOS stat)
CURRENT_MTIME=$(stat -f '%m' "$SIGNAL_FILE")

# Last recorded mtime (0 if never set)
LAST_MTIME=$(cat "$MTIME_FILE" 2>/dev/null || echo "0")

# No change — stay silent, let Claude Code continue normally
if [ "$CURRENT_MTIME" = "$LAST_MTIME" ]; then
  exit 0
fi

# New signal — record the new mtime first (prevents double-firing on retry)
echo "$CURRENT_MTIME" > "$MTIME_FILE"

# Output the signal so Claude Code sees it before acting
echo ""
echo "=== COWORK SIGNAL ==="
cat "$SIGNAL_FILE"
echo ""
echo "=== END COWORK SIGNAL ==="
echo ""
