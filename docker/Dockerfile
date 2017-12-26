FROM ubuntu:latest
LABEL maintainer sushain@skc.name
WORKDIR /root

# Install packaged dependencies

RUN apt-get --yes update && apt-get --yes install \
    curl \
    git \
    inotify-tools \
    locales \
    make \
    python3 \
    socat

# Repair locales

RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8

# Setup Html-tools

CMD (nohup socat TCP4-LISTEN:$APY_PORT,fork TCP4:apy:$APY_PORT &) && \
    (while ! curl --output /dev/null --silent --fail http://apy:$APY_PORT/listPairs; do sleep 1 && echo -n .; done;) && \
    cd apertium-html-tools && make -j32 -B && \
    while true; do inotifywait . -r -e MODIFY && make -j32; done;
