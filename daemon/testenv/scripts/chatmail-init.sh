#!/bin/bash
# First-boot init for the ephemeral test relay: generate config + self-signed
# cert and run cmdeploy's configure+activate stages against @local.
set -euo pipefail

export CHATMAIL_INI="${CHATMAIL_INI:-/etc/chatmail/chatmail.ini}"
CMDEPLOY=/opt/cmdeploy/bin/cmdeploy
MAIL_DOMAIN="${MAIL_DOMAIN:-_chatmail.example}"

# opendkim genkey (present in the tree; harmless for a self-signed test relay).
if [ ! -f /etc/dkimkeys/opendkim.private ]; then
    /usr/sbin/opendkim-genkey -D /etc/dkimkeys -d "$MAIL_DOMAIN" -s opendkim 2>/dev/null || true
    chown -R opendkim /etc/dkimkeys 2>/dev/null || true
fi

mkdir -p "$(dirname "$CHATMAIL_INI")"
if [ ! -f "$CHATMAIL_INI" ]; then
    $CMDEPLOY init --config "$CHATMAIL_INI" "$MAIL_DOMAIN"
fi

# No IPv6 in the bridged test network; bind IPv4 only.
if grep -q '^disable_ipv6 = False' "$CHATMAIL_INI"; then
    sed -i 's/^disable_ipv6 = False/disable_ipv6 = True/' "$CHATMAIL_INI"
elif ! grep -q '^disable_ipv6' "$CHATMAIL_INI"; then
    echo 'disable_ipv6 = True' >> "$CHATMAIL_INI"
fi

# mailboxes dir (chatmail-metadata needs it before first delivery).
mkdir -p "/home/vmail/mail/${MAIL_DOMAIN}"
chown -R vmail:vmail /home/vmail 2>/dev/null || true

# configure + activate. --skip-dns-check because there is no DNS and the
# domain is an underscore/self-signed domain.
export CMDEPLOY_STAGES="${CMDEPLOY_STAGES:-configure,activate}"
$CMDEPLOY run --config "$CHATMAIL_INI" --ssh-host @local --skip-dns-check

# Restore the build-time version hash (cmdeploy run overwrites it).
cp /etc/chatmail-image-version /etc/chatmail-version 2>/dev/null || true

# --- TLS 1.2 concession for the test harness only ---
# Delta Chat core (rustls) cannot complete a TLS 1.3 handshake to this relay
# over podman's port-forwarding path on some hosts (notably the macOS podman
# machine's gvproxy): dovecot logs `SSL_accept() failed: unsupported protocol`
# and postfix STARTTLS reports `bad protocol version`, while an OpenSSL client
# (curl) on the same socket succeeds. Chatmail ships a TLS-1.3-only floor
# (dovecot ssl_min_protocol=TLSv1.3; postfix smtps/submission
# smtpd_tls_mandatory_protocols=>=TLSv1.3). Lowering the *floor* to 1.2 lets
# core negotiate 1.2 through the forwarder; a real client on a real relay still
# negotiates 1.3. This only affects the throwaway test relay.
if grep -q '^ssl_min_protocol = TLSv1.3' /etc/dovecot/dovecot.conf 2>/dev/null; then
    sed -i 's/^ssl_min_protocol = TLSv1.3/ssl_min_protocol = TLSv1.2/' /etc/dovecot/dovecot.conf
    systemctl restart dovecot || true
fi
if grep -q 'smtpd_tls_mandatory_protocols=>=TLSv1.3' /etc/postfix/master.cf 2>/dev/null; then
    sed -i 's|smtpd_tls_mandatory_protocols=>=TLSv1.3|smtpd_tls_mandatory_protocols=>=TLSv1.2|g' \
        /etc/postfix/master.cf
    systemctl restart postfix || true
fi

# Forward journald to console so `podman logs` shows service output.
grep -q '^ForwardToConsole=yes' /etc/systemd/journald.conf \
    || echo "ForwardToConsole=yes" >> /etc/systemd/journald.conf
systemctl restart systemd-journald || true

# Signal readiness for the healthcheck.
touch /run/chatmail-init.done
