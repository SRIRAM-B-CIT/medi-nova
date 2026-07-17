#!/usr/bin/env bash

# MediNova Services - Stop All Script
# Stops only processes listening on MediNova's service ports.

set -u

PORTS=(3000 5001)

echo "Stopping MediNova services..."
echo

if ! command -v fuser >/dev/null 2>&1; then
    echo "Error: the 'fuser' command is required."
    echo "On Ubuntu/Debian, install it with: sudo apt install psmisc"
    exit 1
fi

found_any=false

for port in "${PORTS[@]}"; do
    pids=$(fuser -n tcp "$port" 2>/dev/null || true)

    if [ -z "$pids" ]; then
        echo "- Port $port: already free"
        continue
    fi

    found_any=true
    echo "- Port $port: stopping PID(s)$pids"
    # shellcheck disable=SC2086
    kill -TERM $pids 2>/dev/null || true
done

if [ "$found_any" = true ]; then
    sleep 2
fi

remaining=false
for port in "${PORTS[@]}"; do
    pids=$(fuser -n tcp "$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        remaining=true
        echo "- Port $port: force-stopping remaining PID(s)$pids"
        # shellcheck disable=SC2086
        kill -KILL $pids 2>/dev/null || true
    fi
done

echo
if [ "$remaining" = true ]; then
    sleep 1
fi

all_free=true
for port in "${PORTS[@]}"; do
    if fuser -n tcp "$port" >/dev/null 2>&1; then
        echo "Warning: port $port is still in use"
        all_free=false
    fi
done

if [ "$all_free" = true ]; then
    echo "All MediNova service ports are free."
    exit 0
fi

echo "Some services could not be stopped. Try running this script with sufficient permissions."
exit 1
