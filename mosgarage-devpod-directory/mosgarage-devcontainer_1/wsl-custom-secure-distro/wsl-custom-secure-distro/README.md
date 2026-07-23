# Custom Secure WSL Distro (Evolved)

## Features
- Reproducible build
- Security baseline
- Dev-ready
- Podman-ready
- GitHub CI

## Build
cd build
chmod +x build-rootfs.sh
./build-rootfs.sh

## Import
cd scripts
./import-wsl.ps1

## Run
wsl -d CustomWSL
