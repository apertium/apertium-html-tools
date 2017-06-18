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

CMD (nohup socat TCP4-LISTEN:2737,fork TCP4:apy:2737 &) && \
    cd apertium-html-tools && make -j32 && \
    while true; do inotifywait . -r -e MODIFY && make -j32; done;
