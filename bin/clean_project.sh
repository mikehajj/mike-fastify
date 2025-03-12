#!/bin/bash

echo "Cleaning Project in: $PWD"

pushd $PWD

echo "Cleaning APIs ..."
rm -Rf $PWD/apis

echo "Cleaning Databases & Drivers ..."
rm -Rf $PWD/database

echo "Cleaning Drivers ..."
rm -Rf $PWD/drivers

echo "Cleaning Models ..."
rm -Rf $PWD/models

echo "Cleaning Modules ..."
rm -Rf $PWD/modules

echo "Cleaning Migrations ..."
rm -Rf $PWD/migrations

echo "Cleaning Commands ..."
rm -Rf $PWD/commands

echo "Cleaning Global Configuration ..."
rm -Rf $PWD/config

popd