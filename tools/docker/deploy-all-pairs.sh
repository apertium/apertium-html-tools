#!/bin/sh

run_in_apy() {
    docker-compose exec apy bash -c "cd /source && $1"
}

run_in_apy "apt-get -qq update && apt-get upgrade -qq && apt-get install -qq curl"
run_in_apy "curl https://raw.githubusercontent.com/apertium/apertium-get/master/apertium-get > apertium-get && chmod +x apertium-get"
run_in_apy "./apertium-get -m | grep -v '^$\\|^\\s*\\#' | sort | xargs -n 1 -P 6 timeout 8m ./apertium-get -s -d 1"
run_in_apy "./apertium-get -l | grep -v '^$\\|^\\s*\\#' | sort | xargs -n 1 -P 6 timeout 8m ./apertium-get -d 1"
docker-compose pull
docker-compose up -d --build
