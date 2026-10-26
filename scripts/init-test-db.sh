#!/bin/sh
set -eu

case "${POSTGRES_TEST_DB:-trailerdesk_test}" in
  *[!a-zA-Z0-9_]*)
    echo "POSTGRES_TEST_DB must contain only letters, numbers, and underscores." >&2
    exit 1
    ;;
esac

psql --set ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --command "CREATE DATABASE \"${POSTGRES_TEST_DB:-trailerdesk_test}\""
