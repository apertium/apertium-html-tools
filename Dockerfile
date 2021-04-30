FROM node:14-buster-slim
LABEL maintainer sushain@skc.name
WORKDIR /root

RUN apt-get -qq update && \
    apt-get -qq install --no-install-recommends git

COPY package.json .
COPY yarn.lock .
RUN yarn install --dev

COPY . .

ENTRYPOINT ["yarn"]
CMD ["build", "--prod"]
