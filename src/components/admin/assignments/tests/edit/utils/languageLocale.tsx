// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { ReactNode } from 'react';

export interface LanguageLocaleEntry {
  base: boolean;
  installCmd: string;
  environment: ReactNode;
  dependencyFile?: string;
  dependencyMode?: string;
  dependencyHelp?: ReactNode;
  pseudoterminal: ReactNode;
  name?: string;
}

const locale: Record<string, LanguageLocaleEntry> = {
  java: {
    base: false,
    installCmd: 'apk add',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/openjdk">openjdk:8-jdk-alpine</a> base image.
      </span>
    ),
    dependencyFile: 'pom.xml',
    dependencyMode: 'xml',
    dependencyHelp: 'Content here will be saved as pom.xml. Maven will be installed and run to resolve dependencies.',
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
    dependencyFile: 'Requirements.txt',
    dependencyMode: 'text',
    dependencyHelp: "Content here will be appended to the environment's requirements.txt (Python).",
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/python">python:3.7-slim-buster</a>]
      </span>
    ),
  },
  'python-3.12': {
    base: false,
    installCmd: 'pip install',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/python">python:3.12-slim-buster</a> base image.
      </span>
    ),
    dependencyFile: 'Requirements.txt',
    dependencyMode: 'text',
    dependencyHelp: "Content here will be appended to the environment's requirements.txt (Python).",
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/python">python:3.12-slim-buster</a>]
      </span>
    ),
  },
  'python-3.11': {
    base: false,
    installCmd: 'pip install',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/python">python:3.11-slim-buster</a> base image.
      </span>
    ),
    dependencyFile: 'Requirements.txt',
    dependencyMode: 'text',
    dependencyHelp: "Content here will be appended to the environment's requirements.txt (Python).",
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/python">python:3.11-slim-buster</a>]
      </span>
    ),
  },
  'python-3.10': {
    base: false,
    installCmd: 'pip install',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/python">python:3.10-slim-buster</a> base image.
      </span>
    ),
    dependencyFile: 'Requirements.txt',
    dependencyMode: 'text',
    dependencyHelp: "Content here will be appended to the environment's requirements.txt (Python).",
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/python">python:3.10-slim-buster</a>]
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
    dependencyFile: 'requirements.txt',
    dependencyMode: 'text',
    dependencyHelp: "Content here will be appended to the environment's requirements.txt (Python).",
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/python">python:2.7-slim-buster</a>]
      </span>
    ),
  },
  'java-17': {
    base: false,
    installCmd: 'apt-get install',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/openjdk">openjdk:17-jdk-slim</a> base image.
      </span>
    ),
    dependencyFile: 'pom.xml',
    dependencyMode: 'xml',
    dependencyHelp: 'Content here will be saved as pom.xml. Maven will be installed and run to resolve dependencies.',
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/openjdk">openjdk:17-jdk-slim</a>]
      </span>
    ),
  },
  'java-11': {
    base: false,
    installCmd: 'apt-get install',
    environment: (
      <span>
        Run on a Linux server in a container built from{' '}
        <a href="https://hub.docker.com/_/openjdk">openjdk:11-jdk-slim</a> base image.
      </span>
    ),
    dependencyFile: 'pom.xml',
    dependencyMode: 'xml',
    dependencyHelp: 'Content here will be saved as pom.xml. Maven will be installed and run to resolve dependencies.',
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/openjdk">openjdk:11-jdk-slim</a>]
      </span>
    ),
  },
  'node-20': {
    base: false,
    installCmd: 'apt-get install',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/node">node:20-slim</a> base
        image.
      </span>
    ),
    dependencyFile: 'package.json',
    dependencyMode: 'json',
    dependencyHelp: "Content here will be saved as package.json. 'npm install' will be run.",
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/node">node:20-slim</a>]
      </span>
    ),
  },
  'node-18': {
    base: false,
    installCmd: 'apt-get install',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/node">node:18-slim</a> base
        image.
      </span>
    ),
    dependencyFile: 'package.json',
    dependencyMode: 'json',
    dependencyHelp: "Content here will be saved as package.json. 'npm install' will be run.",
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/node">node:18-slim</a>]
      </span>
    ),
  },
  'r-4': {
    base: false,
    installCmd: 'apt-get install',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/r-base">r-base:4.3.1</a> base
        image.
      </span>
    ),
    dependencyFile: 'requirements.txt',
    dependencyMode: 'text',
    dependencyHelp: 'Content here will be parsed. Dependencies will be installed via install.packages().',
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/r-base">r-base:4.3.1</a>]
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
    dependencyFile: 'package.json',
    dependencyMode: 'json',
    dependencyHelp:
      'Content here will be saved as package.json. Run `npm install` in Install Packages if needed (or backend handles it).',
    pseudoterminal: (
      <span>
        [Running on Linux |{' '}
        <a href="https://hub.docker.com/_/node/?tab=description&page=1&name=13.8.0">node:13.8.0-alpine3.10</a>]
      </span>
    ),
  },
  r: {
    base: false,
    installCmd: 'apt-get install',
    environment: (
      <span>
        Run on a Linux server in a container built from <a href="https://hub.docker.com/_/r-base">r-base</a> base image.
      </span>
    ),
    dependencyFile: 'requirements.txt',
    dependencyMode: 'text',
    dependencyHelp: 'List R packages here (one per line). They will be installed via install.packages().',
    pseudoterminal: (
      <span>
        [Running on Linux | <a href="https://hub.docker.com/_/r-base">r-base</a>]
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
