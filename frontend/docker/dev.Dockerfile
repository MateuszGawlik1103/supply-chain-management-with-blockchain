FROM node:23.7-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CERTS_PATH=/run/certs
ENV KEY_PATH=/run/secrets/appUser1-key.pem
ENV DATABASE_PASSWORD_FILE=/run/secrets/db_pass.txt
ENV APP_USER=appUser1
ENV DATABASE_HOST=postgres
ENV DATABASE_USER=coffee_user
ENV DATABASE_NAME=coffee_db
ENV JWT_SECRET=supersecret

COPY frontend/package.json /app/package.json

RUN npm install --include dev

COPY ./frontend .

# For frontend
EXPOSE 4000
