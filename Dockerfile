FROM node:lts
ADD . /var/www
WORKDIR /var/www/server
RUN yarn
WORKDIR /var/www
RUN yarn && yarn build:all
CMD ["yarn", "start:prod"]