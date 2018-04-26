FROM debian:jessie-slim
LABEL maintainer sushain@skc.name
ENV LANG C.UTF-8
WORKDIR /root

# Install packaged dependencies

RUN apt-get -qq update && apt-get -qq install \
    curl \
    git \
    inotify-tools \
    make \
    python3 \
    python3-pip \
    socat

# Install some (optional) dependencies
COPY requirements-prod.txt .
RUN pip3 install -U -r requirements-prod.txt

# Setup Html-tools

CMD (nohup socat TCP4-LISTEN:$APY_PORT,fork TCP4:apy:$APY_PORT &) && \
    (while ! curl --output /dev/null --silent --fail http://apy:$APY_PORT/listPairs; do sleep 1 && echo -n .; done;) && \
    cd apertium-html-tools && make -j32 -B && \
    while true; do inotifywait . -r -e MODIFY && make -j32; done;
