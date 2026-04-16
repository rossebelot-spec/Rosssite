#!/bin/bash
# Cowork bridge — notify Cowork that Claude Code has finished a task.
# Registered as a Stop hook in ~/.claude/settings.json.
# Fires after Claude Code completes a response and waits for input.

COWORK_SIGNAL="$HOME/rosssite/cowork-bridge/cowork-signal.json"

echo "{\"status\": \"done\", \"timestamp\": $(date +%s)}" > "$COWORK_SIGNAL"
