# role-assignment-service (Work in Progress)
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/role-assignment-service.svg?style=flat)](https://github.com/mojaloop/role-assignment-service/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/role-assignment-service.svg?style=flat)](https://github.com/mojaloop/role-assignment-service/releases)
[![CircleCI](https://circleci.com/gh/mojaloop/role-assignment-service.svg?style=svg)](https://circleci.com/gh/mojaloop/role-assignment-service)

## Overview

- [Documentation](./docs/README.md)

## Runtime Configuration

Runtime configuration is handled by `rc`, and can be specified using either Environment Variables, or a `.json` file.

See [`./config/default.json`](./config/default.json) for an example config file.

When setting configuration using environment variables, the `ROLE_ASSIGNMENT_SERVICE` environment variable prefix is required. See [`src/shared/config.ts`](src/shared/config.ts) to understand how these variables are configured.

### Key Config Options

> ***Note:** See [`./config/default.json`](./config/default.json) for all available config options, and their default values.*

## Setup

### Clone repo
```bash
git clone git@github.com:mojaloop/role-assignment-service.git
```

### Improve local DNS resolver
Add the `127.0.0.1   role-assignment-service.local` entry in your `/etc/hosts` so the _role-assignment-service_ is reachable on `http://role-assignment-service.local:3008`. Elsewhere use `http://localhost:3008`

### Install service dependencies
```bash
cd role-assignment-service
npm ci
```

### Run local dockerized _role-assignment-service_
```bash
npm run docker:build
npm run docker:run
```

To check the role-assignment-service health visit [http://role-assignment-service.local:3008/health](http://role-assignment-service.local:3008/health)

