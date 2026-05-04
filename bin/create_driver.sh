#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=framework-root.sh
source "$SCRIPT_DIR/framework-root.sh"
resolve_framework_root || exit 1

echo "Creating new Driver ..."
pushd "$PWD" >/dev/null || exit 1

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
  mkdir -p "$PWD/drivers/drivers/$DRIVER_FOLDER"
  cp -R "$FRAMEWORK_ROOT/app/templates/drivers/drivers/Sample/"* "$PWD/drivers/drivers/$DRIVER_FOLDER/"
  if [ -f "$FRAMEWORK_ROOT/app/templates/drivers/README.md" ]; then
    cp "$FRAMEWORK_ROOT/app/templates/drivers/README.md" "$PWD/drivers/drivers/$DRIVER_FOLDER/README.md"
  fi

  echo "Generating Driver Driver ..."
  sed "s/Sample/$DRIVER_FOLDER/g" "$PWD/drivers/drivers/$DRIVER_FOLDER/index.js" >"$PWD/drivers/drivers/$DRIVER_FOLDER/i.js"
  mv "$PWD/drivers/drivers/$DRIVER_FOLDER/i.js" "$PWD/drivers/drivers/$DRIVER_FOLDER/index.js"

  export MIKE_FASTIFY_PROJECT_ROOT="$PWD"
  node "$SCRIPT_DIR/update-config-file.js" drivers "$DRIVER_FOLDER"
fi

popd >/dev/null || true
