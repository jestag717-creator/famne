#!/bin/bash

# Pastikan speedtest sudah terinstall
# sudo apt install curl unzip -y
# curl -s https://install.speedtest.net/app/cli/install.deb.sh | sudo bash
# sudo apt install speedtest -y

echo "Mulai speedtest loop setiap 1 detik..."

while true; do
    date
    speedtest
    sleep 1
done
