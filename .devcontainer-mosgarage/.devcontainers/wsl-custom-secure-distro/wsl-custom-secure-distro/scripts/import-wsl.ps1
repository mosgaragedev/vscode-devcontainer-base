param (
[string]$DistroName = "CustomWSL",
[string]$InstallPath = "C:\WSL\CustomWSL",
[string]$TarPath = ".\rootfs.tar"
)
wsl --import $DistroName $InstallPath $TarPath --version 2
