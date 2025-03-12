#!/bin/bash

echo "Copying executables ..."
cp -R node_modules/mike-fastify-framework/bin .

echo "Copying application entry points ..."
cp node_modules/mike-fastify-framework/server.js .
cp node_modules/mike-fastify-framework/coverage_check.js .

FILE=node_modules/mike-fastify-framework/tests/helper.js
if test -f "$FILE"; then
  echo "Found existing testing platform, skipping ..."
else
  echo "Copying testing platform ..."
  cp -R node_modules/mike-fastify-framework/tests .
fi

FILE=node_modules/mike-fastify-framework/.env
if test -f "$FILE"; then
  echo "Found existing .env file, skipping ..."
else
  echo "Copying env file ..."
  cp node_modules/mike-fastify-framework/.env .
fi
