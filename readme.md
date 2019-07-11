# Nodify - Ultimate Panel for Debian

## How to install?
Nodify comes up with one handy command for install process. It will check for your system version and install all needed dependencies itself.
```sh
wget -O -q start.sh https://raw.githubusercontent.com/pieczorx/nodify/master/install.sh
```
It installs dependencies in the following order:
1. curl
2. node.js 10.15.3 (with configured `node ...` environment variable)
3. git core

## What to do next?
Just go to `http://your-server-ip:5000` and follow instructions on screen.


## Dependencies
- `node.js`
- `git`
