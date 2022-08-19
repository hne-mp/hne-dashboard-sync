FROM node:14
WORKDIR /app
COPY . /app
RUN yarn install --production
RUN yarn tsc
CMD ["yarn", "start" ]