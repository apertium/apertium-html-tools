FROM ubuntu:latest
LABEL maintainer sushain@skc.name
WORKDIR /root

# Install packaged dependencies

RUN apt-get --yes update && apt-get --yes install \
    apt-utils \
	automake \
    build-essential \
    gawk \
    gcc-multilib \
    git \
    locales \
	libtool \
    pkg-config \
    python \
    python3-dev \
    python3-pip \
    subversion \
    sqlite3 \
    wget \
    zlib1g-dev

# Install Apertium

ADD https://apertium.projectjj.com/apt/install-nightly.sh .
RUN bash install-nightly.sh
RUN apt-get --yes install apertium-all-dev

# Repair locales

RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8

# Install APy

RUN pip3 install --upgrade tornado
RUN git clone https://github.com/goavki/apertium-apy
RUN cd apertium-apy && make

# Install CLD2

RUN git clone https://github.com/CLD2Owners/cld2
RUN cd /root/cld2/internal && \
    ./compile_libs.sh && cp *.so /usr/lib/
RUN git clone https://github.com/mikemccand/chromium-compact-language-detector
RUN cd /root/chromium-compact-language-detector && \
    python3 setup.py build && python3 setup_full.py build && \
    python3 setup.py install && python3 setup_full.py install

# Install Apertium data

WORKDIR /source

ADD https://raw.githubusercontent.com/unhammer/apertium-get/master/apertium-get .
RUN chmod +x apertium-get

RUN apertium-get en-es
RUN apertium-get kaz-tat
RUN apertium-get nno-nob

CMD python3 /root/apertium-apy/servlet.py /source \
        --port $PORT \
        --lang-names /root/apertium-apy/langNames.db
