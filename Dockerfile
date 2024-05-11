##################
# BUILD FOR PRODUCTION
###################

FROM node:20-alpine as build

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run build

ENV NODE_ENV production

USER node

###################
# PRODUCTION
###################

FROM node:20-alpine As production

WORKDIR /app

COPY --chown=node:node --from=build /app/build /app/node_modules ./
COPY --chown=node:node --from=build /app/package.json /app/package-lock.json ./

CMD [ "node", "index.js" ]
