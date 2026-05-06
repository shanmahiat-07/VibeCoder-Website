export const INSERT_WEBSITE_SITE_MUTATION = `
  mutation InsertWebsiteSite($input: WebsiteSiteInsertInput!) {
    insertWebsiteSite(input: $input) {
      acknowledged
      itemId
      totalImpactedData
      message
    }
  }
`;

export const INSERT_WEBSITE_PAGE_MUTATION = `
  mutation InsertWebsitePage($input: WebsitePageInsertInput!) {
    insertWebsitePage(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UPDATE_WEBSITE_PAGE_MUTATION = `
  mutation UpdateWebsitePage($filter: String!, $input: WebsitePageUpdateInput!) {
    updateWebsitePage(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;
