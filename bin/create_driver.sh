#!/bin/bash

echo "Creating new Driver ..."
pushd $PWD

if [ -z "$1" ]; then
  echo "Please provide the name of the driver as an argument"
  exit 1
fi

DRIVER_FOLDER=$1
FORCE=$2

FILE=$PWD/drivers/drivers/$DRIVER_FOLDER/index.js
if test -f "$FILE"; then
  echo "*******************************************"
  echo "*"
  echo "* This Driver already exists, if you want to reset and override everything in it, run the command again with argument 2 set to true"
  echo "* ./bin/create_driver.sh $DRIVER_FOLDER true"
  echo "*"
  echo "*******************************************"
else
  FORCE='true'
fi

if [[ "$FORCE" == 'true' ]]; then

  echo "Generating Driver files $DRIVER_FOLDER ..."
  mkdir -p $PWD/drivers/drivers/$DRIVER_FOLDER
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/drivers/drivers/Sample/* $PWD/drivers/drivers/$DRIVER_FOLDER/

  echo "Generating Driver Driver ..."
  sed "s/Sample/$DRIVER_FOLDER/g" $PWD/drivers/drivers/$DRIVER_FOLDER/index.js >$PWD/drivers/drivers/$DRIVER_FOLDER/i.js
  mv $PWD/drivers/drivers/$DRIVER_FOLDER/i.js $PWD/drivers/drivers/$DRIVER_FOLDER/index.js

  node $PWD/bin/update-config-file.js drivers $DRIVER_FOLDER
fi

popd