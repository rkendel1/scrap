#!/bin/sh
# wait-for-it.sh

TIMEOUT=15
QUIET=0
HOST=
PORT=
CMD=

echoerr() {
  if [ "$QUIET" -ne 1 ]; then printf "%s\n" "$*" 1>&2; fi
}

usage() {
  cat << USAGE >&2
Usage:
  $0 host:port [-t timeout] [-- command args]
  -h HOST | --host=HOST       Host or IP address to connect to
  -p PORT | --port=PORT       TCP port to connect to
  -t TIMEOUT | --timeout=TIMEOUT
                                      Timeout in seconds, zero for no timeout
  -- COMMAND ARGS             Execute command after the service is available
USAGE
  exit 1
}

wait_for_port() {
  local host="$1" port="$2"
  local start_ts=$(date +%s)
  while :; do
    if [ "$TIMEOUT" -gt 0 ] && [ "$(date +%s)" -gt "$((start_ts + TIMEOUT))" ]; then
      echoerr "Timeout occurred after $TIMEOUT seconds waiting for $host:$port."
      return 1
    fi
    nc -z "$host" "$port" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      echoerr "$host:$port is available."
      return 0
    fi
    sleep 1
  done
}

# parse arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    -h)
      HOST="$2"
      shift 2
      ;;
    --host=*)
      HOST="${1#*=}"
      shift 1
      ;;
    -p)
      PORT="$2"
      shift 2
      ;;
    --port=*)
      PORT="${1#*=}"
      shift 1
      ;;
    -t)
      TIMEOUT="$2"
      shift 2
      ;;
    --timeout=*)
      TIMEOUT="${1#*=}"
      shift 1
      ;;
    --)
      shift
      CMD="$@"
      break
      ;;
    -*)
      echoerr "Unknown option: $1"
      usage
      ;;
    *)
      if [ -z "$HOST" ]; then
        HOST="$(echo "$1" | cut -d: -f1)"
        PORT="$(echo "$1" | cut -d: -f2)"
      else
        echoerr "Too many arguments: $1"
        usage
      fi
      shift 1
      ;;
  esac
done

if [ -z "$HOST" ] || [ -z "$PORT" ]; then
  echoerr "Error: Host and port must be specified."
  usage
fi

echoerr "Waiting for $HOST:$PORT..."
if ! wait_for_port "$HOST" "$PORT"; then
  exit 1
fi

if [ -n "$CMD" ]; then
  echoerr "Executing command: $CMD"
  exec "$CMD"
fi