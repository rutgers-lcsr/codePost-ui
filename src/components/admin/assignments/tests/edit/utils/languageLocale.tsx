import React from 'react';

import { Icon, Tooltip } from 'antd';

const locale: { [language: string]: { [attr: string]: any } } = {
  java: {
    base: false,
    installCmd: 'apk add',
    environment: 'Run on a Linux server in a container built from openjdk:8-jdk-alpine base image.',
  },
  'python-3.7': {
    base: false,
    installCmd: 'pip install',
    environment: 'Run on a Linux server in a container built from python:3.7-alpine base image.',
  },
  'python-2.7': {
    base: false,
    installCmd: 'pip install',
    environment: 'Run on a Linux server in a container built from python:2.7-alpine base image.',
  },
  'c/c++': {
    base: false,
    installCmd: 'apk add',
    environment: 'Run on a Linux server in a container built from frolvlad/alpine-gxx base image.',
  },
  ubuntu: {
    base: true,
    name: 'Custom (ubuntu)',
    installCmd: 'apt-get -y install',
    environment: 'Run on a Linux server in a container built from ubuntu:18.04 base image.',
  },
  alpine: {
    base: true,
    name: 'Custom (alpine-linux)',
    installCmd: 'apk add',
    environment: 'Run on a Linux server in a container built from alpine:3.7 base image.',
  },
};

export default locale;
