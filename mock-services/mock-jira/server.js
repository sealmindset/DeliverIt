/**
 * Mock Jira REST API for DeliverIt local development.
 *
 * Implements the Jira REST endpoints that DeliverIt's Jira integration
 * client consumes. Pre-seeded with 3 projects and 10 issues.
 */

const express = require("express");

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN || "mock-jira-token";

app.use(express.json());

// ---------------------------------------------------------------------------
// Auth middleware (case-insensitive Bearer check)
// ---------------------------------------------------------------------------

function requireAuth(req, res, next) {
  // Skip auth for health check
  if (req.path === "/health") return next();

  const authHeader = req.headers.authorization || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ errorMessages: ["Authentication required"] });
  }

  const token = authHeader.slice(7).trim();
  if (token !== AUTH_TOKEN) {
    return res.status(403).json({ errorMessages: ["Invalid authentication token"] });
  }

  next();
}

app.use(requireAuth);

// ---------------------------------------------------------------------------
// Pre-seeded data
// ---------------------------------------------------------------------------

const projects = [
  {
    id: "10001",
    key: "DEL",
    name: "DeliverIt",
    projectTypeKey: "software",
    lead: { accountId: "user-admin", displayName: "Alex Admin" },
    style: "classic",
  },
  {
    id: "10002",
    key: "INFRA",
    name: "Infrastructure",
    projectTypeKey: "software",
    lead: { accountId: "user-manager", displayName: "Morgan Manager" },
    style: "classic",
  },
  {
    id: "10003",
    key: "DATA",
    name: "Data Platform",
    projectTypeKey: "software",
    lead: { accountId: "user-analyst", displayName: "Sam Analyst" },
    style: "classic",
  },
];

let issueCounter = 10;

const issues = [
  {
    id: "1001",
    key: "DEL-1",
    fields: {
      summary: "Set up project repository",
      status: { name: "Done", id: "3" },
      assignee: { accountId: "user-admin", displayName: "Alex Admin" },
      priority: { name: "High", id: "2" },
      project: { id: "10001", key: "DEL", name: "DeliverIt" },
      issuetype: { name: "Task", id: "10001" },
      created: "2026-03-01T09:00:00.000+0000",
      updated: "2026-03-05T14:30:00.000+0000",
    },
  },
  {
    id: "1002",
    key: "DEL-2",
    fields: {
      summary: "Implement user authentication",
      status: { name: "In Progress", id: "2" },
      assignee: { accountId: "user-admin", displayName: "Alex Admin" },
      priority: { name: "High", id: "2" },
      project: { id: "10001", key: "DEL", name: "DeliverIt" },
      issuetype: { name: "Story", id: "10002" },
      created: "2026-03-02T10:00:00.000+0000",
      updated: "2026-03-10T16:00:00.000+0000",
    },
  },
  {
    id: "1003",
    key: "DEL-3",
    fields: {
      summary: "Design task board UI",
      status: { name: "To Do", id: "1" },
      assignee: { accountId: "user-user", displayName: "Pat User" },
      priority: { name: "Medium", id: "3" },
      project: { id: "10001", key: "DEL", name: "DeliverIt" },
      issuetype: { name: "Task", id: "10001" },
      created: "2026-03-03T08:30:00.000+0000",
      updated: "2026-03-03T08:30:00.000+0000",
    },
  },
  {
    id: "1004",
    key: "DEL-4",
    fields: {
      summary: "Add readiness checklist feature",
      status: { name: "To Do", id: "1" },
      assignee: { accountId: "user-manager", displayName: "Morgan Manager" },
      priority: { name: "High", id: "2" },
      project: { id: "10001", key: "DEL", name: "DeliverIt" },
      issuetype: { name: "Story", id: "10002" },
      created: "2026-03-04T11:00:00.000+0000",
      updated: "2026-03-04T11:00:00.000+0000",
    },
  },
  {
    id: "1005",
    key: "INFRA-1",
    fields: {
      summary: "Provision staging environment",
      status: { name: "In Progress", id: "2" },
      assignee: { accountId: "user-manager", displayName: "Morgan Manager" },
      priority: { name: "High", id: "2" },
      project: { id: "10002", key: "INFRA", name: "Infrastructure" },
      issuetype: { name: "Task", id: "10001" },
      created: "2026-03-01T08:00:00.000+0000",
      updated: "2026-03-09T12:00:00.000+0000",
    },
  },
  {
    id: "1006",
    key: "INFRA-2",
    fields: {
      summary: "Configure CI/CD pipeline",
      status: { name: "To Do", id: "1" },
      assignee: { accountId: "user-admin", displayName: "Alex Admin" },
      priority: { name: "Medium", id: "3" },
      project: { id: "10002", key: "INFRA", name: "Infrastructure" },
      issuetype: { name: "Task", id: "10001" },
      created: "2026-03-02T09:30:00.000+0000",
      updated: "2026-03-02T09:30:00.000+0000",
    },
  },
  {
    id: "1007",
    key: "INFRA-3",
    fields: {
      summary: "Set up monitoring and alerting",
      status: { name: "Done", id: "3" },
      assignee: { accountId: "user-analyst", displayName: "Sam Analyst" },
      priority: { name: "Low", id: "4" },
      project: { id: "10002", key: "INFRA", name: "Infrastructure" },
      issuetype: { name: "Task", id: "10001" },
      created: "2026-03-01T10:00:00.000+0000",
      updated: "2026-03-07T15:00:00.000+0000",
    },
  },
  {
    id: "1008",
    key: "DATA-1",
    fields: {
      summary: "Design data warehouse schema",
      status: { name: "In Progress", id: "2" },
      assignee: { accountId: "user-analyst", displayName: "Sam Analyst" },
      priority: { name: "High", id: "2" },
      project: { id: "10003", key: "DATA", name: "Data Platform" },
      issuetype: { name: "Story", id: "10002" },
      created: "2026-03-03T07:00:00.000+0000",
      updated: "2026-03-11T09:00:00.000+0000",
    },
  },
  {
    id: "1009",
    key: "DATA-2",
    fields: {
      summary: "Build ETL pipeline for task metrics",
      status: { name: "To Do", id: "1" },
      assignee: { accountId: "user-analyst", displayName: "Sam Analyst" },
      priority: { name: "Medium", id: "3" },
      project: { id: "10003", key: "DATA", name: "Data Platform" },
      issuetype: { name: "Task", id: "10001" },
      created: "2026-03-05T13:00:00.000+0000",
      updated: "2026-03-05T13:00:00.000+0000",
    },
  },
  {
    id: "1010",
    key: "DATA-3",
    fields: {
      summary: "Create reporting dashboard",
      status: { name: "Done", id: "3" },
      assignee: { accountId: "user-user", displayName: "Pat User" },
      priority: { name: "Medium", id: "3" },
      project: { id: "10003", key: "DATA", name: "Data Platform" },
      issuetype: { name: "Story", id: "10002" },
      created: "2026-03-02T14:00:00.000+0000",
      updated: "2026-03-08T17:00:00.000+0000",
    },
  },
];

// Status transition map
const TRANSITIONS = {
  "1": [
    { id: "21", name: "Start Progress", to: { id: "2", name: "In Progress" } },
  ],
  "2": [
    { id: "31", name: "Done", to: { id: "3", name: "Done" } },
    { id: "11", name: "Back to To Do", to: { id: "1", name: "To Do" } },
  ],
  "3": [
    { id: "11", name: "Reopen", to: { id: "1", name: "To Do" } },
  ],
};

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

app.get("/rest/api/2/project/search", (req, res) => {
  const startAt = parseInt(req.query.startAt || "0", 10);
  const maxResults = parseInt(req.query.maxResults || "50", 10);
  const slice = projects.slice(startAt, startAt + maxResults);

  res.json({
    self: `${req.protocol}://${req.get("host")}/rest/api/2/project/search`,
    maxResults,
    startAt,
    total: projects.length,
    isLast: startAt + maxResults >= projects.length,
    values: slice,
  });
});

// ---------------------------------------------------------------------------
// Search issues by JQL
// ---------------------------------------------------------------------------

app.get("/rest/api/3/search/jql", (req, res) => {
  const jql = (req.query.jql || "").toLowerCase();
  const startAt = parseInt(req.query.startAt || "0", 10);
  const maxResults = parseInt(req.query.maxResults || "50", 10);

  let filtered = [...issues];

  // Basic JQL parsing for common patterns
  if (jql) {
    // project = "KEY"
    const projectMatch = jql.match(/project\s*=\s*["']?(\w+)["']?/);
    if (projectMatch) {
      const projectKey = projectMatch[1].toUpperCase();
      filtered = filtered.filter(
        (i) => i.fields.project.key === projectKey
      );
    }

    // status = "Status Name"
    const statusMatch = jql.match(/status\s*=\s*["']([^"']+)["']/);
    if (statusMatch) {
      const statusName = statusMatch[1].toLowerCase();
      filtered = filtered.filter(
        (i) => i.fields.status.name.toLowerCase() === statusName
      );
    }

    // assignee = "accountId"
    const assigneeMatch = jql.match(/assignee\s*=\s*["']?([^"'\s]+)["']?/);
    if (assigneeMatch) {
      const assigneeId = assigneeMatch[1];
      filtered = filtered.filter(
        (i) => i.fields.assignee && i.fields.assignee.accountId === assigneeId
      );
    }
  }

  const slice = filtered.slice(startAt, startAt + maxResults);

  res.json({
    startAt,
    maxResults,
    total: filtered.length,
    issues: slice,
  });
});

// ---------------------------------------------------------------------------
// Create issue
// ---------------------------------------------------------------------------

app.post("/rest/api/2/issue", (req, res) => {
  const { fields } = req.body || {};
  if (!fields || !fields.summary) {
    return res.status(400).json({
      errorMessages: ["Field 'summary' is required"],
    });
  }

  const projectKey =
    (fields.project && (fields.project.key || "DEL")) || "DEL";
  issueCounter++;
  const key = `${projectKey}-${issueCounter}`;
  const id = `${2000 + issueCounter}`;
  const now = new Date().toISOString();

  const project = projects.find((p) => p.key === projectKey) || projects[0];

  const newIssue = {
    id,
    key,
    fields: {
      summary: fields.summary,
      status: { name: "To Do", id: "1" },
      assignee: fields.assignee || null,
      priority: fields.priority || { name: "Medium", id: "3" },
      project: { id: project.id, key: project.key, name: project.name },
      issuetype: fields.issuetype || { name: "Task", id: "10001" },
      created: now,
      updated: now,
      ...(fields.description && { description: fields.description }),
    },
  };

  issues.push(newIssue);

  res.status(201).json({
    id: newIssue.id,
    key: newIssue.key,
    self: `${req.protocol}://${req.get("host")}/rest/api/2/issue/${newIssue.key}`,
  });
});

// ---------------------------------------------------------------------------
// Update issue
// ---------------------------------------------------------------------------

app.put("/rest/api/2/issue/:key", (req, res) => {
  const issue = issues.find((i) => i.key === req.params.key);
  if (!issue) {
    return res.status(404).json({
      errorMessages: [`Issue ${req.params.key} not found`],
    });
  }

  const { fields } = req.body || {};
  if (fields) {
    if (fields.summary !== undefined) issue.fields.summary = fields.summary;
    if (fields.assignee !== undefined) issue.fields.assignee = fields.assignee;
    if (fields.priority !== undefined) issue.fields.priority = fields.priority;
    if (fields.description !== undefined) issue.fields.description = fields.description;
    issue.fields.updated = new Date().toISOString();
  }

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Get issue (convenience endpoint used by some clients)
// ---------------------------------------------------------------------------

app.get("/rest/api/2/issue/:key", (req, res) => {
  const issue = issues.find((i) => i.key === req.params.key);
  if (!issue) {
    return res.status(404).json({
      errorMessages: [`Issue ${req.params.key} not found`],
    });
  }
  res.json(issue);
});

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

app.get("/rest/api/2/issue/:key/transitions", (req, res) => {
  const issue = issues.find((i) => i.key === req.params.key);
  if (!issue) {
    return res.status(404).json({
      errorMessages: [`Issue ${req.params.key} not found`],
    });
  }

  const currentStatusId = issue.fields.status.id;
  const available = TRANSITIONS[currentStatusId] || [];

  res.json({ transitions: available });
});

app.post("/rest/api/2/issue/:key/transitions", (req, res) => {
  const issue = issues.find((i) => i.key === req.params.key);
  if (!issue) {
    return res.status(404).json({
      errorMessages: [`Issue ${req.params.key} not found`],
    });
  }

  const { transition } = req.body || {};
  if (!transition || !transition.id) {
    return res.status(400).json({
      errorMessages: ["Field 'transition.id' is required"],
    });
  }

  const currentStatusId = issue.fields.status.id;
  const available = TRANSITIONS[currentStatusId] || [];
  const match = available.find((t) => t.id === transition.id);

  if (!match) {
    return res.status(400).json({
      errorMessages: [
        `Transition ${transition.id} is not available from status ${issue.fields.status.name}`,
      ],
    });
  }

  issue.fields.status = { ...match.to };
  issue.fields.updated = new Date().toISOString();

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock Jira API running on port ${PORT}`);
  console.log(`Projects: ${projects.map((p) => p.key).join(", ")}`);
  console.log(`Issues: ${issues.length} pre-seeded`);
});
