import { graphql } from "../libs/gh-graphql-local.mjs";

// Add the Personal Access Token
const ghToken = "...";

/** Local hardcoded values to test the logic */
export function getContextAndGraphQL() {
  // Add the repo owner and name and the milestone data
  const context = {
    repo: { owner: "", repo: "" },
    payload: { milestone: { title: "", description: "" } },
  };

  const graphqlWithAuth = graphql.defaults({
    headers: { authorization: `token ${ghToken}` },
  });

  return { context, graphql: graphqlWithAuth };
}
