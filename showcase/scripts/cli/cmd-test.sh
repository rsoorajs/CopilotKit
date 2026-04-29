#!/usr/bin/env bash
# showcase test — run probe tests against a showcase service
# Sourced by the main dispatcher; do not execute directly.

CMD_TEST_DESC="Run probe tests against a service"

usage_test() {
  cat <<'HELP'
Usage: showcase test <slug> [options]

Run probe tests against a showcase service.

Options:
  --d5             Run D5 (subagents/tool-rendering/agentic-chat) probes only
  --d6             Run D6 probes only
  --verbose        Verbose test output
  --cycle          On failure, auto-dump aimock logs from the test window
  --timeout <ms>   Test timeout in milliseconds (default: 30000)

Examples:
  showcase test mastra --d5 --verbose         # D5 probes with verbose output
  showcase test mastra --d5 --cycle           # D5 + aimock logs on failure
  showcase test langgraph-python              # all tests for a slug
  showcase test mastra --d5 --timeout 60000   # longer timeout
HELP
}

cmd_test() {
  local slug=""
  local d5_flag=""
  local d6_flag=""
  local verbose=""
  local cycle=""
  local timeout="30000"

  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --d5)      d5_flag=1;   shift ;;
      --d6)      d6_flag=1;   shift ;;
      --verbose) verbose=1;   shift ;;
      --cycle)   cycle=1;     shift ;;
      --timeout)
        shift
        timeout="${1:?--timeout requires a value}"
        shift
        ;;
      -h|--help)
        usage_test
        return 0
        ;;
      -*)
        die "Unknown option: $1 (see 'showcase test --help')"
        ;;
      *)
        if [[ -z "$slug" ]]; then
          slug="$1"
        else
          die "Unexpected argument: $1"
        fi
        shift
        ;;
    esac
  done

  need_slug "$slug"

  # Validate mutually-exclusive depth flags
  if [[ -n "$d5_flag" ]] && [[ -n "$d6_flag" ]]; then
    die "--d5 and --d6 are mutually exclusive"
  fi

  # Build filter argument
  local filter=""
  if [[ -n "$d5_flag" ]]; then
    filter="--d5"
  elif [[ -n "$d6_flag" ]]; then
    filter="--d6"
  fi

  # If --cycle, record aimock log position before the test
  local pre_test_ts=""
  local aimock_container="showcase-aimock"
  if [[ -n "$cycle" ]]; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${aimock_container}$"; then
      pre_test_ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    else
      warn "aimock container '$aimock_container' not running; --cycle log capture disabled"
    fi
  fi

  # Run the tests
  info "Testing $slug${filter:+ ($filter)}..."
  date -u +%Y-%m-%dT%H:%M:%SZ > "$SHOWCASE_ROOT/.last-test-ts"

  local test_exit=0

  if [[ -f "$SHOWCASE_ROOT/scripts/run-e2e-with-aimock.sh" ]]; then
    # Delegate to the existing e2e runner
    bash "$SHOWCASE_ROOT/scripts/run-e2e-with-aimock.sh" \
      "$slug" \
      ${filter:+"$filter"} \
      ${verbose:+--verbose} \
      ${timeout:+--timeout "$timeout"} \
      || test_exit=$?
  else
    # Fallback: direct Playwright invocation
    local pkg_dir="$SHOWCASE_ROOT/integrations/$slug"
    if [[ ! -d "$pkg_dir" ]]; then
      die "Package directory not found: $pkg_dir"
    fi

    (
      cd "$pkg_dir"

      local pw_args=()
      if [[ -n "$filter" ]]; then
        pw_args+=(--grep "$filter")
      fi
      if [[ -n "$verbose" ]]; then
        pw_args+=(--reporter=verbose)
      fi
      pw_args+=(--timeout "$timeout")

      npx playwright test "${pw_args[@]}"
    ) || test_exit=$?
  fi

  # --cycle: dump aimock log delta on failure
  if [[ $test_exit -ne 0 ]] && [[ -n "$cycle" ]] && [[ -n "$pre_test_ts" ]]; then
    echo ""
    echo "═══ aimock logs since test start ($pre_test_ts) ═══"
    docker logs --since "$pre_test_ts" "$aimock_container" 2>&1
    echo "═══════════════════════════════════════════════════"
  fi

  # Report result
  if [[ $test_exit -eq 0 ]]; then
    success "Tests passed for $slug"
  else
    warn "Tests failed for $slug (exit $test_exit)"
  fi

  return $test_exit
}
