FROM node:14
WORKDIR /app
COPY . /app
RUN yarn install
CMD [ "yarn start" ]