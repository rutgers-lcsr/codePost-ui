# Build set
FROM node:10 AS build

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

WORKDIR /app

RUN npm install

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build


# Production set
FROM nginx:latest AS production

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
