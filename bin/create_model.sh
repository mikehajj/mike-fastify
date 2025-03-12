#!/bin/bash

echo "Creating new Model ..."
pushd $PWD

if [ -z "$1" ]; then
  echo "Please provide the name of the model as an argument"
  exit 1
fi

MODEL_FOLDER=$1
FORCE=$2

FILE=$PWD/models/drivers/MODEL_FOLDER/index.js
if test -f "$FILE"; then
  echo "*******************************************"
  echo "*"
  echo "* This Model already exists, if you want to reset and override everything in it, run the command again with argument 2 set to true"
  echo "* ./bin/create_model.sh $MODEL_FOLDER true"
  echo "*"
  echo "*******************************************"
else
  FORCE='true'
fi

if [[ "$FORCE" == 'true' ]]; then

  echo "Generating Model files $MODEL_FOLDER ..."
  mkdir -p $PWD/models/drivers/$MODEL_FOLDER
  cp -R $PWD/node_modules/mike-fastify-framework/app/templates/models/drivers/Sample/* $PWD/models/drivers/$MODEL_FOLDER/

  echo "Generating Model Driver ..."
  sed "s/Sample/$MODEL_FOLDER/g" $PWD/models/drivers/$MODEL_FOLDER/index.js >$PWD/models/drivers/$MODEL_FOLDER/i.js
  mv $PWD/models/drivers/$MODEL_FOLDER/i.js $PWD/models/drivers/$MODEL_FOLDER/index.js

  node $PWD/bin/update-config-file.js models $MODEL_FOLDER
fi

popd