// Formats a project key + issue number into a display key, e.g. PROJ-14
function formatIssueKey(projectKey, issueNumber) {
  return `${projectKey}-${issueNumber}`;
}

module.exports = { formatIssueKey };
