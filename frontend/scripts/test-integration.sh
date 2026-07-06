#!/usr/bin/env bash
set -euo pipefail

compose_file="${PLEROMANET_INTEGRATION_COMPOSE_FILE:-tests/integration/pleroma/compose.yaml}"
project_name="${PLEROMANET_INTEGRATION_PROJECT:-pleromanet-integration}"
port="${PLEROMANET_INTEGRATION_PORT:-4400}"
skip_docker="${PLEROMANET_INTEGRATION_SKIP_DOCKER:-0}"
wait_seconds="${PLEROMANET_INTEGRATION_WAIT_SECONDS:-180}"

export PLEROMANET_INTEGRATION_PORT="$port"
export PLEROMANET_INTEGRATION_INSTANCE_URL="${PLEROMANET_INTEGRATION_INSTANCE_URL:-http://127.0.0.1:${port}}"

compose=(docker compose -f "$compose_file" -p "$project_name")

cleanup() {
	if [[ "$skip_docker" != "1" ]]; then
		"${compose[@]}" down --volumes --remove-orphans >/dev/null
	fi
}

wait_for_instance() {
	local status_url="${PLEROMANET_INTEGRATION_INSTANCE_URL%/}/api/v2/instance"
	local deadline=$((SECONDS + wait_seconds))

	until node --input-type=module -e 'const response = await fetch(process.argv[1]); if (!response.ok) process.exit(1);' "$status_url" >/dev/null 2>&1; do
		if (( SECONDS >= deadline )); then
			"${compose[@]}" logs --no-color pleroma
			return 1
		fi

		sleep 2
	done
}

if [[ "$skip_docker" != "1" ]]; then
	trap cleanup EXIT
	cleanup
	"${compose[@]}" up -d --wait --build
	wait_for_instance
fi

pnpm exec playwright test --config=playwright.integration.config.ts
