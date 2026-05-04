#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=framework-root.sh
source "$SCRIPT_DIR/framework-root.sh"
resolve_framework_root || exit 1

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

  pushd "$PWD" >/dev/null || exit 1

  echo "Generating Sample APIs ..."
  cp -R "$FRAMEWORK_ROOT/app/templates/apis" "$PWD/apis"

  echo "Generating Sample Databases & Drivers ..."
  cp -R "$FRAMEWORK_ROOT/app/templates/database" "$PWD/database"

  echo "Generating Sample Custom Drivers ..."
  cp -R "$FRAMEWORK_ROOT/app/templates/drivers" "$PWD/drivers"

  echo "Generating Sample Custom Models ..."
  cp -R "$FRAMEWORK_ROOT/app/templates/models" "$PWD/models"

  echo "Generating Sample Custom Modules ..."
  cp -R "$FRAMEWORK_ROOT/app/templates/modules" "$PWD/modules"

  echo "Generating Global Configuration ..."
  cp -R "$FRAMEWORK_ROOT/app/templates/config" "$PWD/config"

  echo "Generating Sample Commands ..."
  cp -R "$FRAMEWORK_ROOT/app/templates/commands" "$PWD/commands"

  echo "Generating Testing Platform ..."
  if [ -d "$FRAMEWORK_ROOT/tests" ]; then
    cp -R "$FRAMEWORK_ROOT/tests" "$PWD/tests"
  else
    echo "Warning: no tests/ directory at framework root; skipping tests copy." >&2
  fi
  if [ -f "$FRAMEWORK_ROOT/.nycrc.json" ]; then
    cp "$FRAMEWORK_ROOT/.nycrc.json" "$PWD/.nycrc.json"
  fi
  popd >/dev/null || true

fi
