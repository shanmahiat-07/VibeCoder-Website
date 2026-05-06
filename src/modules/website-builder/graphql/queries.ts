export const GET_WEBSITE_SITES_QUERY = `
  query GetWebsiteSites($where: WebsiteSiteFilterInput, $order: [WebsiteSiteSortInput!], $paging: PaginationInput) {
    getWebsiteSites(where: $where, order: $order, paging: $paging) {
      items {
        ItemId
        siteName
        siteSlug
        ownerUserId
        status
        themeJson
        customDomain
        CreatedDate
        LastUpdatedDate
      }
      totalCount
      pageNo
      pageSize
      totalPages
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const GET_WEBSITE_PAGES_QUERY = `
  query GetWebsitePages($where: WebsitePageFilterInput, $order: [WebsitePageSortInput!], $paging: PaginationInput) {
    getWebsitePages(where: $where, order: $order, paging: $paging) {
      items {
        ItemId
        siteId
        onwerUserId
        pageName
        pageSlug
        pageOrder
        status
        isHomePage
        layoutJson
        seoTitle
        seoDescription
        CreatedDate
        LastUpdatedDate
      }
      totalCount
      pageNo
      pageSize
      totalPages
      hasNextPage
      hasPreviousPage
    }
  }
`;
