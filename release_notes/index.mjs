import { core } from "../libs/gh.mjs";
import { getContextAndGraphQL } from "./gha.mjs";

/* Regex to find Jira URLs */
const JIRA_URL_REGEX = /https:\/\/jira[^\/]+\/browse\/([A-Z]+-(\d+))/i;

/* Regex to find links to GH Issues */
const GH_ISSUE_REGEX = /#(\d+)/;

const { context, graphql } = getContextAndGraphQL();

run();

async function run() {
  // Get the PRs that belong to the milestone
  const prs = await getPRsForMilestone(
    context.repo.owner,
    context.repo.repo,
    context.payload.milestone.title
  );
  console.log("Found %d PRs", prs.length);

  console.log(buildReleaseNotes(context.payload.milestone, prs));

  core.setOutput(
    "release_notes",
    buildReleaseNotes(context.payload.milestone, prs)
  );
}

/********************************
 *    HELPER FUNCTIONS
 *********************************/

function buildReleaseNotes(milestone, prs) {
  // Get list of PR Items
  const prItems = prs.map(generatePRItem).join("\n");

  // Get the milestone description if it exists
  const milestoneDescription = milestone.description
    ? `\n\n${milestone.description}`
    : "";

  // Return the Markdown with the release notes
  return `Release ${milestone.title}${milestoneDescription}\n\n## Scope:\n${prItems} `;
}

function generatePRItem(pr) {
  let issueLink = pr.issueUrl
    ? // If there's a issue URL, create the link using the name (eg. ADI-1234) and the URL
      `[${pr.issueName}](${pr.issueUrl})`
    : // If there's no issue URL, it's either a GH Issue (eg. #140) or there's no issue associated
      pr.issueName;

  // The item will contain the title and the issue link if available
  return `- ${pr.title}${issueLink ? ` (${issueLink})` : ""}`;
}

async function getPRsForMilestone(owner, repo, milestoneName) {
  console.log(
    "Searching for PRs for repo %s/%s - Milestone %s",
    owner,
    repo,
    milestoneName
  );
  // Graphql query to return the PRs for the milestone
  const query = `query issuesForMilestone($searchQuery: String!) {
                  search(first: 100, type: ISSUE, query: $searchQuery) {
                    edges {
                      node {
                        ... on PullRequest {
                          number
                          title
                          body
                        }
                      }
                    }
                  }
              }`;

  const result = await graphql(query, {
    searchQuery: `is:pr user:${owner} repo:${repo} milestone:${milestoneName}`,
  });

  return result.search.edges.map((item) => parseGithubPR(item.node));
}

function parseGithubPR(pr) {
  const issue = getIssueInfo(pr.body);

  return {
    number: pr.number,
    // Removes the issue number/name from the start of the pr.title (eg. "1456 - Something" becomes "Something")
    title: pr.title.replace(
      new RegExp(`^(${issue.number}|${issue.name})\\s*-\\s*(.*)`),
      (match, _, title) => title || match
    ),
    // Use the name, or if not found, the PR name
    issueName: issue.name || `#${pr.number}`,
    issueUrl: issue.url,
  };
}

/**
 * Extract the associated issue from the PR's description.
 * It tries to find the first link to a Jira issue or, if not found, the first GH link (eg. #123)
 */
function getIssueInfo(body) {
  let match = JIRA_URL_REGEX.exec(body);
  if (!match) match = GH_ISSUE_REGEX.exec(body);
  if (!match) return {};

  return {
    name: match.length > 2 ? match[1] : match[0],
    number: match.length > 2 ? match[2] : match[1],
    url: match.length > 2 ? match[0] : null,
  };
}
