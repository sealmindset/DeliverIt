from typing import Any

import httpx

from app.config import settings


class JiraClient:
    """Jira REST API client. Reads base URL and auth token from env."""

    def __init__(self) -> None:
        self.base_url = settings.JIRA_BASE_URL.rstrip("/")
        self.auth_token = settings.JIRA_AUTH_TOKEN

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def list_projects(
        self, start_at: int = 0, max_results: int = 50
    ) -> dict[str, Any]:
        """List Jira projects via /rest/api/2/project/search."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/rest/api/2/project/search",
                headers=self._headers(),
                params={"startAt": start_at, "maxResults": max_results},
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def search_issues(
        self, jql: str, start_at: int = 0, max_results: int = 50
    ) -> dict[str, Any]:
        """Search Jira issues via /rest/api/3/search/jql."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/rest/api/3/search/jql",
                headers=self._headers(),
                params={
                    "jql": jql,
                    "startAt": start_at,
                    "maxResults": max_results,
                },
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def create_issue(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a Jira issue."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/rest/api/3/issue",
                headers=self._headers(),
                json=payload,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def update_issue_status(
        self, issue_key: str, transition_id: str
    ) -> dict[str, Any]:
        """Transition a Jira issue to a new status."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/rest/api/3/issue/{issue_key}/transitions",
                headers=self._headers(),
                json={"transition": {"id": transition_id}},
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json() if resp.content else {}


jira_client = JiraClient()
