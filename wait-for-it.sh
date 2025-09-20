#!/bin/sh
# wait-for-it.sh

TIMEOUT=15
QUIET=0
HOST=
PORT=
CMD=

usage() {
  echo "Usage: $0 host:port [-t timeout] [-- command args]"
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    *:*)
      HOST=$(echo "$1" | cut -d: -f1)
      PORT=$(echo "$1" | cut -d: -f2)
      shift
      ;;
    -t)
      TIMEOUT="$2"
      shift 2
      ;;
    -q)
      QUIET=1
      shift
      ;;
    --)
      shift
      CMD="$@"
      break
      ;;
    *)
      usage
      ;;
  es-ac
done

if [ -z "$HOST" ] || [ -z "$PORT" ]; then
  usage
fi

wait_for_port() {
  for i in $(seq $TIMEOUT); do
    nc -z "$HOST" "$PORT" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      if [ $QUIET -eq 0 ]; then
        echo "Service $HOST:$PORT is available after $i seconds."
      fi
      return 0
    fi
    sleep 1
  done
  if [ $QUIET -eq 0 ]; then
    echo "Timeout after $TIMEOUT seconds waiting for $HOST:$PORT"
  fi
  return 1
}

if wait_for_port; then
  if [ -n "$CMD" ]; then
    exec $CMD
  fi
else
  exit 1
fi