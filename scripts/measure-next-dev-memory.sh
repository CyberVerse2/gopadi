#!/usr/bin/env bash
set -euo pipefail

base_url="${1:-http://127.0.0.1:3000}"
rounds="${2:-8}"

routes=(
  "/"
  "/errands"
  "/post-errand"
  "/post-errand/matching"
  "/post-errand/success"
  "/admin"
  "/pitch"
)

printf "round,next_rss_kb,postcss_rss_kb,total_rss_kb,next_cache,route_errors,total_request_ms,max_request_ms\n"

for round in $(seq 1 "$rounds"); do
  errors=0
  total_request_us=0
  max_request_us=0

  for route in "${routes[@]}"; do
    time_total="$(
      curl -fsS -o /dev/null -w '%{time_total}' "$base_url$route" ||
        printf 'ERR'
    )"
    if [[ "$time_total" == "ERR" ]]; then
      errors=$((errors + 1))
      continue
    fi

    request_us="$(awk -v seconds="$time_total" 'BEGIN { printf "%d", seconds * 1000000 }')"
    total_request_us=$((total_request_us + request_us))
    if (( request_us > max_request_us )); then
      max_request_us="$request_us"
    fi
  done

  next_rss="$(
    ps -axo rss=,command= |
      awk '/next-server \(v16\.2\.6\)/ && !/awk/ { sum += $1 } END { print sum + 0 }'
  )"
  postcss_rss="$(
    ps -axo rss=,command= |
      awk '/[.]next\/dev\/build\/postcss[.]js/ { sum += $1 } END { print sum + 0 }'
  )"
  total_rss=$((next_rss + postcss_rss))
  cache_size="$(du -sh .next/dev/cache 2>/dev/null | awk '{print $1}')"
  cache_size="${cache_size:-0}"

  total_request_ms=$((total_request_us / 1000))
  max_request_ms=$((max_request_us / 1000))

  printf "%s,%s,%s,%s,%s,%s,%s,%s\n" "$round" "$next_rss" "$postcss_rss" "$total_rss" "$cache_size" "$errors" "$total_request_ms" "$max_request_ms"
  sleep 2
done
