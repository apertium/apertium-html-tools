#!/bin/sh

docker-compose exec apy bash -c "cd /source && ./apertium-get -m | grep -v '^$\|^\s*\#' | sort | xargs -n 1 -P 6 timeout 10m ./apertium-get"
docker-compose exec apy bash -c "cd /source && ./apertium-get -l | grep -v '^$\|^\s*\#' | sort | xargs -n 1 -P 6 timeout 10m ./apertium-get"
docker-compose exec apy bash -c "cd /root/apertium-apy && git pull"
docker-compose restart apy html-tools
