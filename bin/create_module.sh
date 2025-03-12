#!/bin/bash

echo "Creating new Module ..."
pushd $PWD

if [ -z "$1" ]; then
  echo "Please provide the name of the module as an argument"
  exit 1
fi

MODULE_FOLDER=$1
MODULE_DECORATOR=$(echo $MODULE_FOLDER | tr '[:upper:]' '[:lower:]')
FORCE=$2

FILE=$PWD/modules/$MODULE_FOLDER/index.js
if test -f "$FILE"; then
  echo "*******************************************"
  echo "*"
  echo "* This Module already exists, if you want to reset and override everything in it, run the command again with argument 2 set to true"
  echo "* ./bin/create_module.sh $MODULE_FOLDER true"
  echo "*"
  echo "*******************************************"
else
  FORCE='true'
fi

if [[ "$FORCE" == 'true' ]]; then

  echo "Generating Module files $MODULE_FOLDER ..."
  mkdir -p $PWD/modules/$MODULE_FOLDER
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/modules/Sample/* $PWD/modules/$MODULE_FOLDER/

  echo "Generating Module class ..."
  sed "s/Sample/$MODULE_FOLDER/g" $PWD/modules/$MODULE_FOLDER/module.js >$PWD/modules/$MODULE_FOLDER/m.js
  mv $PWD/modules/$MODULE_FOLDER/m.js $PWD/modules/$MODULE_FOLDER/module.js

  echo "Generating Module decorator ..."
  sed "s/sample/$MODULE_DECORATOR/g" $PWD/modules/$MODULE_FOLDER/index.js >$PWD/modules/$MODULE_FOLDER/i.js
  mv $PWD/modules/$MODULE_FOLDER/i.js $PWD/modules/$MODULE_FOLDER/index.js

  node $PWD/bin/update-config-file.js modules $MODULE_FOLDER

fi

popd