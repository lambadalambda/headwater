#!/bin/bash
# 0 when first-boot init finished and the core mail services are active.
set -e

test -f /run/chatmail-init.done

services="chatmail-metadata doveauth dovecot filtermail filtermail-incoming filtermail-transport nginx postfix unbound"

exec systemctl is-active $services
