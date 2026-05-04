#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=framework-root.sh
source "$SCRIPT_DIR/framework-root.sh"
resolve_framework_root || exit 1

echo "Creating new Model ..."
pushd "$PWD" >/dev/null || exit 1

if [ -z "$1" ]; then
  echo "Please provide the name of the model as an argument"
  exit 1
fi

MODEL_FOLDER=$1
FORCE=$2

FILE=$PWD/models/drivers/$MODEL_FOLDER/index.js
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
  mkdir -p "$PWD/models/drivers/$MODEL_FOLDER"
  cp -R "$FRAMEWORK_ROOT/app/templates/models/drivers/Sample/"* "$PWD/models/drivers/$MODEL_FOLDER/"
  if [ -f "$FRAMEWORK_ROOT/app/templates/models/README.md" ]; then
    cp "$FRAMEWORK_ROOT/app/templates/models/README.md" "$PWD/models/drivers/$MODEL_FOLDER/README.md"
  fi

  echo "Generating Model Driver ..."
  sed "s/Sample/$MODEL_FOLDER/g" "$PWD/models/drivers/$MODEL_FOLDER/index.js" >"$PWD/models/drivers/$MODEL_FOLDER/i.js"
  mv "$PWD/models/drivers/$MODEL_FOLDER/i.js" "$PWD/models/drivers/$MODEL_FOLDER/index.js"

  export MIKE_FASTIFY_PROJECT_ROOT="$PWD"
  node "$SCRIPT_DIR/update-config-file.js" models "$MODEL_FOLDER"
fi

popd >/dev/null || true
