FROM amazon/dynamodb-local

VOLUME /test/dynamodb

USER root

RUN yum install -y wget gzip xz tar

# Install Node.js
RUN \
  LOC=`pwd` && \
  cd /tmp && \
  VERSION=v11.4.0 && \
  DISTRO=linux-x64 && \
  wget http://nodejs.org/dist/latest/node-$VERSION-$DISTRO.tar.xz && \
  mkdir -p /usr/local/lib/nodejs && \
  tar -xJvf node-$VERSION-$DISTRO.tar.xz -C /usr/local/lib/nodejs  && \
  rm -f node-$VERSION-$DISTRO.tar.xz && \
  mv /usr/local/lib/nodejs/node-$VERSION-$DISTRO /usr/local/lib/nodejs/node-$VERSION && \
  cd $LOC && \
  printf '\n# Node.js\nexport NODEJS_HOME=/usr/local/lib/nodejs/node-%s/bin\nexport PATH=$NODEJS_HOME:$PATH' $VERSION >> /home/dynamodblocal/.bashrc


USER dynamodblocal
