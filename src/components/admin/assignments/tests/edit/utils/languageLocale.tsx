const locale: { [language: string]: { [attr: string]: any } } = {
  java: {
    dependencies: 'Upload dependencies as custom dependencies',
    environment: 'Run on a Linux server in a container built from openjdk:8-jdk-alpine Docker image.',
  },
  'python-3.7': {
    dependencies: 'Installed via pip',
    environment: 'Run on a Linux server in a container built from python:3.7-alpine Docker image.',
  },
  'python-2.7': {
    dependencies: 'Installed via pip',
    environment: 'Run on a Linux server in a container built from python:2.7-alpine Docker image.',
  },
  'c/c++': {
    dependencies: 'Upload dependencies as custom dependencies',
    environment: 'Run on a Linux server in a container built from frolvlad/alpine-gxx Docker image.',
  },
};

export default locale;
