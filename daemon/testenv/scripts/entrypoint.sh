#!/bin/bash
# Fill in the PassEnvironment list on chatmail-init.service (systemd cannot
# expand a glob there) and then exec systemd as PID 1.
set -eo pipefail

SERVICE_PATH="/lib/systemd/system/chatmail-init.service"
env_vars="MAIL_DOMAIN CMDEPLOY_STAGES CHATMAIL_INI PATH"
sed -i "s|<envs_list>|$env_vars|g" "$SERVICE_PATH"

exec /lib/systemd/systemd "$@"
