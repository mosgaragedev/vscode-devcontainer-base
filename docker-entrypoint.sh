#!/bin/bash
# This script starts the container. It runs the code-server workspace stack
# when the :code-server target is used, otherwise it drops into a login shell.
if [[ -x /usr/local/bin/workspace-start && "${MOSGARAGE_MODE:-}" == "code-server" ]]; then
    exec /usr/local/bin/workspace-start
fi

if [[ $(id -u) = "0" ]]; then
    exec su -l mosgarage
else
    echo "Unable to switch to mosgarage user, starting a shell."
    exec /usr/bin/zsh
fi
