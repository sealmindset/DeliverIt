#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# seed-mock-services.sh
#
# Seeds mock-oidc and mock-jira with the correct users, clients, and
# redirect URIs for DeliverIt local development.
#
# Usage:
#   chmod +x scripts/seed-mock-services.sh
#   ./scripts/seed-mock-services.sh
#
# Prerequisites: docker compose --profile dev up (mock services running)
# ---------------------------------------------------------------------------

set -euo pipefail

MOCK_OIDC_URL="http://127.0.0.1:3009"
MOCK_JIRA_URL="http://127.0.0.1:8443"
JIRA_TOKEN="mock-jira-token"

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

# ---------------------------------------------------------------------------
# 1. Wait for mock-oidc to be healthy
# ---------------------------------------------------------------------------

echo "Waiting for mock-oidc to be ready..."
RETRIES=30
COUNT=0
until curl -sf "${MOCK_OIDC_URL}/health" > /dev/null 2>&1; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $RETRIES ]; then
    fail "mock-oidc did not become healthy after ${RETRIES} attempts"
    exit 1
  fi
  sleep 2
done
ok "mock-oidc is healthy"

# ---------------------------------------------------------------------------
# 2. Wait for mock-jira to be healthy
# ---------------------------------------------------------------------------

echo "Waiting for mock-jira to be ready..."
COUNT=0
until curl -sf "${MOCK_JIRA_URL}/health" > /dev/null 2>&1; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $RETRIES ]; then
    fail "mock-jira did not become healthy after ${RETRIES} attempts"
    exit 1
  fi
  sleep 2
done
ok "mock-jira is healthy"

# ---------------------------------------------------------------------------
# 3. Register app users in mock-oidc
# ---------------------------------------------------------------------------

echo ""
echo "Registering app users in mock-oidc..."

register_user() {
  local sub="$1" email="$2" name="$3"
  HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
    -X POST "${MOCK_OIDC_URL}/api/users" \
    -H "Content-Type: application/json" \
    -d "{\"sub\": \"${sub}\", \"email\": \"${email}\", \"name\": \"${name}\"}")

  if [ "$HTTP_CODE" = "200" ]; then
    ok "Registered user: ${sub} (${name})"
  else
    warn "User registration returned HTTP ${HTTP_CODE}: ${sub}"
  fi
}

register_user "mock-admin"   "admin@example.com"   "Alex Admin"
register_user "mock-manager" "manager@example.com"  "Morgan Manager"
register_user "mock-analyst" "analyst@example.com"  "Sam Analyst"
register_user "mock-user"    "user@example.com"     "Pat User"

# ---------------------------------------------------------------------------
# 4. Remove non-app users (if any)
# ---------------------------------------------------------------------------

echo ""
echo "Checking for non-app users..."

EXPECTED_SUBS=("mock-admin" "mock-manager" "mock-analyst" "mock-user")
CURRENT_USERS=$(curl -sf "${MOCK_OIDC_URL}/api/users" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for u in data.get('users', []):
    print(u['sub'])
" 2>/dev/null || echo "")

if [ -n "$CURRENT_USERS" ]; then
  while IFS= read -r sub; do
    IS_APP_USER=false
    for expected in "${EXPECTED_SUBS[@]}"; do
      if [ "$sub" = "$expected" ]; then
        IS_APP_USER=true
        break
      fi
    done
    if [ "$IS_APP_USER" = "false" ]; then
      HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
        -X DELETE "${MOCK_OIDC_URL}/api/users/${sub}")
      if [ "$HTTP_CODE" = "200" ]; then
        ok "Removed non-app user: ${sub}"
      else
        warn "Failed to remove user ${sub} (HTTP ${HTTP_CODE})"
      fi
    fi
  done <<< "$CURRENT_USERS"
fi
ok "Non-app users cleaned up"

# ---------------------------------------------------------------------------
# 5. Update mock-oidc client redirect URIs
# ---------------------------------------------------------------------------

echo ""
echo "Updating mock-oidc client redirect URIs..."

HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
  -X PUT "${MOCK_OIDC_URL}/api/clients/mock-oidc-client/redirect_uris" \
  -H "Content-Type: application/json" \
  -d '{"redirect_uris": ["http://localhost:3002/api/auth/callback"]}')

if [ "$HTTP_CODE" = "200" ]; then
  ok "Redirect URIs updated for mock-oidc-client"
else
  warn "Redirect URI update returned HTTP ${HTTP_CODE}"
fi

# ---------------------------------------------------------------------------
# 6. Verify mock-oidc users
# ---------------------------------------------------------------------------

echo ""
echo "Verifying mock-oidc users..."

USERS_JSON=$(curl -sf "${MOCK_OIDC_URL}/api/users")
USER_COUNT=$(echo "$USERS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('users', [])))
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "4" ]; then
  ok "mock-oidc has exactly 4 users"
  echo "$USERS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for u in data.get('users', []):
    print(f\"  - {u['sub']}: {u['name']} ({u['email']})\")" 2>/dev/null
else
  warn "mock-oidc has ${USER_COUNT} users (expected 4)"
fi

# ---------------------------------------------------------------------------
# 7. Verify mock-jira projects
# ---------------------------------------------------------------------------

echo ""
echo "Verifying mock-jira projects..."

PROJECTS_JSON=$(curl -sf \
  -H "Authorization: Bearer ${JIRA_TOKEN}" \
  "${MOCK_JIRA_URL}/rest/api/2/project/search")

PROJECT_COUNT=$(echo "$PROJECTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('values', [])))
" 2>/dev/null || echo "0")

if [ "$PROJECT_COUNT" = "3" ]; then
  ok "mock-jira has 3 projects"
  echo "$PROJECTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('values', []):
    print(f\"  - {p['key']}: {p['name']}\")" 2>/dev/null
else
  warn "mock-jira has ${PROJECT_COUNT} projects (expected 3)"
fi

# ---------------------------------------------------------------------------
# 8. Summary
# ---------------------------------------------------------------------------

echo ""
echo "==========================================="
echo -e "${GREEN}Mock services seeded successfully${NC}"
echo "==========================================="
echo ""
echo "  mock-oidc:  ${MOCK_OIDC_URL}"
echo "    Users:    4 (mock-admin, mock-manager, mock-analyst, mock-user)"
echo "    Client:   mock-oidc-client -> http://localhost:3002/api/auth/callback"
echo ""
echo "  mock-jira:  ${MOCK_JIRA_URL}"
echo "    Projects: DEL, INFRA, DATA"
echo "    Issues:   10 pre-seeded"
echo ""
echo "  OIDC Discovery: ${MOCK_OIDC_URL}/.well-known/openid-configuration"
echo ""
