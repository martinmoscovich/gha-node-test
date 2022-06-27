import { github, core } from "../libs/gh.mjs";

/** Uses the GitHub Actions Run Context */
export function getContextAndGraphQL() {
  const ghToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(ghToken);

  return { context, graphql: octokit.graphql.bind(octokit) };
}
