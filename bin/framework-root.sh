#!/usr/bin/env bash
# Resolve directory that contains app/templates (framework repo root or installed package).
# Walks upward from $PWD so scripts work from subdirectories (e.g. tests/fixture-app).

resolve_framework_root() {
    if [ -n "${FRAMEWORK_ROOT}" ] && [ -d "${FRAMEWORK_ROOT}/app/templates" ]; then
        return 0
    fi
    local d="$PWD"
    while [ -n "$d" ] && [ "$d" != "/" ]; do
        if [ -d "$d/app/templates" ]; then
            export FRAMEWORK_ROOT="$d"
            return 0
        fi
        if [ -d "$d/node_modules/mike-fastify-framework/app/templates" ]; then
            export FRAMEWORK_ROOT="$d/node_modules/mike-fastify-framework"
            return 0
        fi
        d=$(dirname "$d")
    done
    echo "Could not find mike-fastify-framework templates. Expected one of (searched upward from $PWD):" >&2
    echo "  - .../app/templates (clone of this repository)" >&2
    echo "  - .../node_modules/mike-fastify-framework/app/templates (npm dependency)" >&2
    return 1
}
