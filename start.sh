#!/bin/zsh -i
# Loads keys from ~/.zshrc (OpenRouter) and optional ./.env, then starts the server.
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
exec node server.mjs
