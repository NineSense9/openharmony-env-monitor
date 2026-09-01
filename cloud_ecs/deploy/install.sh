#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/NineSense9/openharmony-env-monitor.git}"
INSTALL_ROOT="${INSTALL_ROOT:-/opt/openharmony-env-monitor}"
SERVICE_USER="${SERVICE_USER:-envmonitor}"
SERVICE_UNIT_NAME="openharmony-env-monitor.service"
SERVICE_UNIT_SRC="${SERVICE_UNIT_SRC:-$INSTALL_ROOT/deploy/$SERVICE_UNIT_NAME}"
SERVICE_UNIT_DST="/etc/systemd/system/$SERVICE_UNIT_NAME"

export DEBIAN_FRONTEND=noninteractive

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "/home/$SERVICE_USER" --shell /bin/bash "$SERVICE_USER"
fi

apt-get update
apt-get install -y git python3 python3-venv python3-pip

if [ -d "$INSTALL_ROOT/.git" ]; then
  git -C "$INSTALL_ROOT" pull --ff-only
else
  rm -rf "$INSTALL_ROOT"
  git clone "$REPO_URL" "$INSTALL_ROOT"
fi

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_ROOT"

sudo -u "$SERVICE_USER" python3 -m venv "$INSTALL_ROOT/cloud_ecs/.venv"
sudo -u "$SERVICE_USER" "$INSTALL_ROOT/cloud_ecs/.venv/bin/pip" install --upgrade pip
sudo -u "$SERVICE_USER" "$INSTALL_ROOT/cloud_ecs/.venv/bin/pip" install -r "$INSTALL_ROOT/cloud_ecs/requirements.txt"

mkdir -p "$INSTALL_ROOT/cloud_ecs/data"
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_ROOT/cloud_ecs/data"

install -m 0644 "$SERVICE_UNIT_SRC" "$SERVICE_UNIT_DST"
systemctl daemon-reload
systemctl enable "$SERVICE_UNIT_NAME"
systemctl restart "$SERVICE_UNIT_NAME"

systemctl --no-pager --full status "$SERVICE_UNIT_NAME"
