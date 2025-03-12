#!/bin/bash

echo "Creating new API ..."
pushd $PWD

if [[ "$1" != 'main' && "$1" != 'maintenance' ]]
  then
    echo "Please provide the type of the API as argument 1 [ main | maintenance ]"
    exit 1
fi

if [ -z "$2" ]
  then
    echo "Please provide an alphanumeric name for this API [ Ex: userCreate ]"
    exit 1
fi

if [[ "$3" != "GET" && "$3" != "POST" && "$3" != "PUT" && "$3" != "DELETE" && "$3" != "OPTIONS" && "$3" != "PATCH" ]]
  then
    echo "Please provide the method of the API as argument 2 [ GET | POST | PUT | DELETE | OPTIONS | PATCH ]"
    exit 1
fi

if [ -z "$4" ]
  then
    echo "Please provide the route of the API as argument 3 [Ex: /route/endpoint ]"
    exit 1
fi

TYPE=$1
TYPE=$(echo $TYPE | tr '[:upper:]' '[:lower:]')
NAME=$2
METHOD=$3
ROUTE=$4

echo "Generating API files FOR $TYPE ..."
mkdir -p $PWD/apis/$TYPE/
cp $PWD/node_modules/mike-fastify-framework/app/templates/apis/maintenance/heartbeat.js $PWD/apis/$TYPE/$NAME.js

node $PWD/bin/update-config-file.js apis $NAME $METHOD $ROUTE $TYPE

popd