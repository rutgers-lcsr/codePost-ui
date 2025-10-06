const locale: { [language: string]: { [attr: string]: any } } = {
  java: {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/openjdk">openjdk:8-jdk-alpine</a> base image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/openjdk">openjdk:8-jdk-alpine</a>]
      </span>
    ),
  },
  'python-3.7': {
    base: false,
    installCmd: 'pip install',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/python">python:3.7-slim-buster</a> base image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/python">python:3.7-slim-buster</a>]
      </span>
    ),
  },
  'python-2.7': {
    base: false,
    installCmd: 'pip install',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/python">python:2.7-slim-buster</a> base image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/python">python:2.7-slim-buster</a>]
      </span>
    ),
  },
  'c/c++': {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/r/frolvlad/alpine-gxx/">frolvlad/alpine-gxx</a> base image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/r/frolvlad/alpine-gxx/">frolvlad/alpine-gxx</a>]
      </span>
    ),
  },
  javascript: {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/node/?tab=description&page=1&name=13.8.0">node:13.8.0-alpine3.10</a> base
        image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux |{' '}
        <a href="https://hub.docker.com/_/node/?tab=description&page=1&name=13.8.0">node:13.8.0-alpine3.10</a>]
      </span>
    ),
  },
  haskell: {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/haskell">haskell:8</a> base
        image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/haskell">haskell:8</a>]
      </span>
    ),
  },
  ocaml: {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/r/ocaml/ocaml">ocaml/ocaml:latest</a> base image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/r/ocaml/ocaml">ocaml/ocaml:latest</a>]
      </span>
    ),
  },
  ruby: {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/ruby">ruby:2.7-alpine</a> base
        image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/ruby">ruby:2.7-alpine</a>]
      </span>
    ),
  },
  php: {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/php">php:7.4-cli-alpine</a>{' '}
        base image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/php">php:7.4-cli-alpine</a>]
      </span>
    ),
  },
  ubuntu: {
    base: true,
    name: 'Custom (ubuntu)',
    installCmd: 'apt-get -y install',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/ubuntu/">ubuntu:18.04</a> base
        image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/ubuntu/">ubuntu:18.04</a>]
      </span>
    ),
  },
  alpine: {
    base: true,
    name: 'Custom (alpine-linux)',
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/alpine/">alpine:3.7</a> base
        image.
      </span>
    ),
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/alpine/">alpine:3.7</a>]
      </span>
    ),
  },
};

export default locale;
