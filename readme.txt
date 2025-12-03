

sudo apt update
sudo apt install nodejs npm -y 
sudo apt-get install xvfb -y

npm install puppeteer-real-browser fingerprint-generator colors chalk@4 user-agents random-referer cluster request
npx puppeteer browsers install chrome

wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb
echo 'export CHROME_PATH=/usr/bin/google-chrome' >> ~/.bashrc
source ~/.bashrc