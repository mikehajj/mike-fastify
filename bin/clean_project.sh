#!/usr/bin/env bash

echo "Cleaning Project in: $PWD"

if [[ "$1" != "--yes" ]]; then
    echo "This will permanently delete under $PWD:"
    echo "  apis, database, drivers, models, modules, migrations, commands, config"
    read -r -p "Type YES to continue: " confirm
    if [[ "$confirm" != "YES" ]]; then
        echo "Aborted."
        exit 1
    fi
fi

pushd "$PWD" >/dev/null || exit 1

echo "Cleaning APIs ..."
rm -Rf "$PWD/apis"

echo "Cleaning Databases & Drivers ..."
rm -Rf "$PWD/database"

echo "Cleaning Drivers ..."
rm -Rf "$PWD/drivers"

echo "Cleaning Models ..."
rm -Rf "$PWD/models"

echo "Cleaning Modules ..."
rm -Rf "$PWD/modules"

echo "Cleaning Migrations ..."
rm -Rf "$PWD/migrations"

echo "Cleaning Commands ..."
rm -Rf "$PWD/commands"

echo "Cleaning Global Configuration ..."
rm -Rf "$PWD/config"

popd >/dev/null || true
