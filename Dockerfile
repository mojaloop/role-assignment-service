# Arguments
ARG NODE_VERSION=lts-alpine

# NOTE: Ensure you set NODE_VERSION Build Argument as follows...
#
#  export NODE_VERSION="$(cat .nvmrc)-alpine" \
#  docker build \
#    --build-arg NODE_VERSION=$NODE_VERSION \
#    -t mojaloop/sdk-scheme-adapter:local \
#    . \
#

# Build Image
FROM node:${NODE_VERSION} as builder
USER root

WORKDIR /opt/app

RUN apk add --no-cache -t build-dependencies git make gcc g++ python3 libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/app/
RUN npm ci

# check in .dockerignore what is skipped during copy
COPY . .

# cleanup
RUN apk del build-dependencies

FROM node:${NODE_VERSION}
WORKDIR /opt/app

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ra-user
RUN adduser -D ra-user
USER ra-user

COPY --chown=ra-user --from=builder /opt/app .

RUN npm prune --production

EXPOSE 3008
CMD ["npm", "run", "start"]
