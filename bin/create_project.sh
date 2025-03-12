#!/bin/bash

echo "Creating Project in: $PWD"

FILE=$PWD/config/index.js
if test -f "$FILE"; then
  echo "*******************************************"
  echo "*"
  echo "* This Project is already set up, if you want to reset and override everything in it, run the command again with argument 1 set to true"
  echo "* ./bin/create_project.sh true"
  echo "*"
  echo "*******************************************"
else
  FORCE='true'
fi

if [[ "$FORCE" == 'true' ]]; then

  pushd $PWD

  echo "Generating Sample APIs ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/apis $PWD/apis

  echo "Generating Sample Databases & Drivers ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/database $PWD/database

  echo "Generating Sample Custom Drivers ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/drivers $PWD/drivers

  echo "Generating Sample Custom Models ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/models $PWD/models

  echo "Generating Sample Custom Modules ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/modules $PWD/modules

  echo "Generating Global Configuration ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/config $PWD/config

  echo "Generating Sample Commands ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/commands $PWD/commands

  echo "Generating Testing Platform ..."
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/tests $PWD/tests
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/.nycrc.json $PWD/.nycrc.json
  popd

fi
