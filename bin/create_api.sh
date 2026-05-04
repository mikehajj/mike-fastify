6#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=framework-root.sh
source "$SCRIPT_DIR/framework-root.sh"
resolve_framework_root || exit 1

echo "Creating new API ..."
pushd "$PWD" >/dev/null || exit 1

if [[ "$1" != 'main' && "$1" != 'maintenance' ]]; then
    echo "Please provide the type of the API as argument 1 [ main | maintenance ]"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Please provide an alphanumeric name for this API [ Ex: userCreate ]"
    exit 1
fi

if [[ "$3" != "GET" && "$3" != "POST" && "$3" != "PUT" && "$3" != "DELETE" && "$3" != "OPTIONS" && "$3" != "PATCH" ]]; then
    echo "Please provide the HTTP method as argument 3 [ GET | POST | PUT | DELETE | OPTIONS | PATCH ]"
    exit 1
fi

if [ -z "$4" ]; then
    echo "Please provide the route of the API as argument 4 [ Ex: /route/endpoint ]"
    exit 1
fi

TYPE=$1
TYPE=$(echo "$TYPE" | tr '[:upper:]' '[:lower:]')
NAME=$2
METHOD=$3
ROUTE=$4

echo "Generating API files FOR $TYPE ..."
mkdir -p "$PWD/apis/$TYPE/"
cp "$FRAMEWORK_ROOT/app/templates/apis/_stub.js" "$PWD/apis/$TYPE/$NAME.js"

export MIKE_FASTIFY_PROJECT_ROOT="$PWD"
node "$SCRIPT_DIR/update-config-file.js" apis "$NAME" "$METHOD" "$ROUTE" "$TYPE"

popd >/dev/null || true
