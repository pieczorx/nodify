#!/bin/bash
stringInvalidVersion="You must be running Debian 8 in order to install Nodify"
if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    . /etc/os-release
    currentOsName=$NAME
    currentOsVersion=$VERSION_ID
    echo $currentOsName;
    if ! [ "$currentOsName" = "Debian GNU/Linux" -a "$currentOsVersion" = "8" ]; then
      echo $stringInvalidVersion;
      exit;
    fi

else
  echo $stringInvalidVersion;
  exit;
fi

echo "You are running Debian 8, installing...";
if ! [ -x "$(command -v curl)" ]; then
  echo "Installing curl...";
  apt update;
  apt -y install curl;
fi

if ! [ -x "$(command -v nodejs)" ]; then
  echo 'Downloading Node.js 10.15.3...';
  curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
  bash nodesource_setup.sh;

  # Install node.js
  echo 'Installing Node.js...';
  apt -y install nodejs

  # Install node.js build scripts
  apt -y install build-essential
fi

#Create symbolic link to node (If command not found)
if ! [ -x "$(command -v node)" ]; then
  ln -s /usr/bin/nodejs /usr/bin/node
fi

# Install git
apt -y install git-core
