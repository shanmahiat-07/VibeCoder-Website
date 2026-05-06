export interface WebsiteSite {
  itemId: string;
  siteName: string;
  siteSlug: string;
  ownerUserId: string;
  status: string;
  themeJson: string;
  customDomain: string;
  createdDate?: string;
  lastUpdatedDate?: string;
}

export interface WebsitePage {
  itemId: string;
  siteId: string;
  ownerUserId: string;
  pageName: string;
  pageSlug: string;
  pageOrder: number;
  status: string;
  isHomePage: boolean;
  layoutJson: string;
  seoTitle: string;
  seoDescription: string;
  createdDate?: string;
  lastUpdatedDate?: string;
}

export interface CreateSiteInput {
  siteName: string;
  siteSlug: string;
  ownerUserId: string;
  status?: string;
  themeJson?: string;
  customDomain?: string;
}

export interface CreatePageResponse {
  acknowledged: boolean;
  itemId: string;
  totalImpactedData: number;
  message?: string;
}

export interface SavePageInput {
  siteId: string;
  pageId: string;
  json: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
}

export interface SiteListResponse {
  items: WebsiteSite[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PageListResponse {
  items: WebsitePage[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateSiteResponse {
  acknowledged: boolean;
  itemId: string;
  totalImpactedData: number;
  message?: string;
}

export interface SavePageResponse {
  itemId: string;
  totalImpactedData: number;
  acknowledged: boolean;
}
