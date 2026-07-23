#!/usr/bin/env bash
set -e
source ./config.sh
sudo debootstrap --variant=minbase "$DISTRO" rootfs "$MIRROR"
sudo chroot rootfs apt update
xargs -a packages.list sudo chroot rootfs apt install -y
sudo cp -r ../rootfs-overlay/* rootfs/
sudo tar -C rootfs -cf ../rootfs.tar .
