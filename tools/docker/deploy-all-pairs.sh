#!/bin/sh

run_in_apy() {
    docker-compose exec apy bash -c "$1"
}

run_in_apy "apt-get -qq update && apt-get upgrade -qq && apt-get install -qq wget"
run_in_apy "cd /source && wget -nv https://raw.githubusercontent.com/unhammer/apertium-get/master/apertium-get -O apertium-get && chmod +x apertium-get"
run_in_apy "cd /source && ./apertium-get -m | grep -v '^$\\|^\\s*\\#' | sort | xargs -n 1 -P 6 timeout 10m ./apertium-get -s"
run_in_apy "cd /source && ./apertium-get -l | grep -v '^$\\|^\\s*\\#' | sort | xargs -n 1 -P 6 timeout 10m ./apertium-get"
docker-compose pull
docker-compose up -d --build
