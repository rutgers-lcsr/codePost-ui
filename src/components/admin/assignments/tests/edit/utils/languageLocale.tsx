import React from 'react';

import { Icon, Tooltip } from 'antd';

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
  },
};

export default locale;
