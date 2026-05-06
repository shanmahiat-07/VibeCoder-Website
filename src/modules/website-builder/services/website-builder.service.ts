import { graphqlClient } from '@/lib/graphql-client';
import { GET_WEBSITE_PAGES_QUERY, GET_WEBSITE_SITES_QUERY } from '../graphql/queries';
import {
  INSERT_WEBSITE_PAGE_MUTATION,
  INSERT_WEBSITE_SITE_MUTATION,
  UPDATE_WEBSITE_PAGE_MUTATION,
} from '../graphql/mutations';
import type {
  CreatePageResponse,
  CreateSiteInput,
  CreateSiteResponse,
  PageListResponse,
  SavePageInput,
  SavePageResponse,
  SiteListResponse,
  WebsitePage,
  WebsiteSite,
} from '../types/website-builder.types';

type WebsiteSiteGraphQLNode = {
  ItemId: string;
  siteName: string;
  siteSlug: string;
  ownerUserId: string;
  status: string;
  themeJson: string;
  customDomain: string;
  CreatedDate?: string;
  LastUpdatedDate?: string;
};

type WebsitePageGraphQLNode = {
  ItemId: string;
  siteId: string;
  onwerUserId: string;
  pageName: string;
  pageSlug: string;
  pageOrder: number;
  status: string;
  isHomePage: boolean;
  layoutJson: string;
  seoTitle: string;
  seoDescription: string;
  CreatedDate?: string;
  LastUpdatedDate?: string;
};

type WebsiteSiteConnection = {
  items: WebsiteSiteGraphQLNode[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type WebsitePageConnection = {
  items: WebsitePageGraphQLNode[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type GetWebsiteSitesResponse = {
  getWebsiteSites: WebsiteSiteConnection;
};

type GetWebsitePagesResponse = {
  getWebsitePages: WebsitePageConnection;
};

type InsertWebsiteSiteResponse = {
  insertWebsiteSite: CreateSiteResponse;
};

type InsertWebsitePageResponse = {
  insertWebsitePage: CreatePageResponse;
};

type UpdateWebsitePageResponse = {
  updateWebsitePage: SavePageResponse;
};

const DEFAULT_PAGING = {
  pageNo: 1,
  pageSize: 50,
};

const EMPTY_PAGE_LAYOUT_JSON = JSON.stringify({ components: [] });

const slugifyPageName = (name: string) => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'page';
};

const createUniquePageSlug = (name: string, existingSlugs: string[]) => {
  const baseSlug = slugifyPageName(name);
  const usedSlugs = new Set(existingSlugs.filter(Boolean));
  let nextSlug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(nextSlug)) {
    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return nextSlug;
};

const getNextPageOrder = (pages: WebsitePage[]) => {
  const maxPageOrder = pages.reduce(
    (maxOrder, page) => Math.max(maxOrder, Number(page.pageOrder) || 0),
    0
  );

  return maxPageOrder + 1;
};

const getPageOwnerUserId = async (siteId: string, pages: WebsitePage[]) => {
  const pageOwnerUserId = pages.find((page) => page.ownerUserId)?.ownerUserId;
  if (pageOwnerUserId) {
    return pageOwnerUserId;
  }

  try {
    const sites = await getSites();
    return sites.items.find((site) => site.itemId === siteId)?.ownerUserId ?? '';
  } catch {
    return '';
  }
};

const mapSite = (site: WebsiteSiteGraphQLNode): WebsiteSite => ({
  itemId: site.ItemId,
  siteName: site.siteName,
  siteSlug: site.siteSlug,
  ownerUserId: site.ownerUserId,
  status: site.status,
  themeJson: site.themeJson,
  customDomain: site.customDomain,
  createdDate: site.CreatedDate,
  lastUpdatedDate: site.LastUpdatedDate,
});

const mapPage = (page: WebsitePageGraphQLNode): WebsitePage => ({
  itemId: page.ItemId,
  siteId: page.siteId,
  ownerUserId: page.onwerUserId,
  pageName: page.pageName,
  pageSlug: page.pageSlug,
  pageOrder: page.pageOrder,
  status: page.status,
  isHomePage: page.isHomePage,
  layoutJson: page.layoutJson,
  seoTitle: page.seoTitle,
  seoDescription: page.seoDescription,
  createdDate: page.CreatedDate,
  lastUpdatedDate: page.LastUpdatedDate,
});

const mapSiteConnection = (connection: WebsiteSiteConnection): SiteListResponse => ({
  ...connection,
  items: (connection.items || []).map(mapSite),
});

const mapPageConnection = (connection: WebsitePageConnection): PageListResponse => ({
  ...connection,
  items: (connection.items || []).map(mapPage).sort((firstPage, secondPage) => {
    const firstOrder = Number(firstPage.pageOrder) || 0;
    const secondOrder = Number(secondPage.pageOrder) || 0;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return firstPage.pageName.localeCompare(secondPage.pageName);
  }),
});

/**
 * Fetches websites for the current user or a specific owner.
 *
 * Auth token handling is delegated to the shared graphqlClient, which attaches
 * the Blocks API key and the persisted bearer token, then retries once on 401
 * using the refresh-token flow already implemented in src/lib/https.ts.
 */
export const getSites = async (ownerUserId?: string): Promise<SiteListResponse> => {
  const where = ownerUserId ? { ownerUserId } : {};

  const response = await graphqlClient.query<GetWebsiteSitesResponse>({
    query: GET_WEBSITE_SITES_QUERY,
    variables: {
      where,
      order: [],
      paging: DEFAULT_PAGING,
    },
  });

  return mapSiteConnection(response.getWebsiteSites);
};

/**
 * Fetches a single page by its siteId + pageId pair.
 * This hides the WebsitePage schema typo (`onwerUserId`) from the rest of the app.
 */
export const getPage = async (siteId: string, pageId: string): Promise<WebsitePage | null> => {
  const response = await graphqlClient.query<GetWebsitePagesResponse>({
    query: GET_WEBSITE_PAGES_QUERY,
    variables: {
      where: {
        ItemId: pageId,
        siteId,
      },
      order: [],
      paging: {
        pageNo: 1,
        pageSize: 1,
      },
    },
  });

  const [page] = response.getWebsitePages.items || [];
  return page ? mapPage(page) : null;
};

/**
 * Fetches all pages for a site so the builder can switch between them locally
 * while still saving each page independently to SELISE.
 */
export const getPages = async (siteId: string): Promise<PageListResponse> => {
  const response = await graphqlClient.query<GetWebsitePagesResponse>({
    query: GET_WEBSITE_PAGES_QUERY,
    variables: {
      where: {
        siteId,
      },
      order: [],
      paging: DEFAULT_PAGING,
    },
  });

  return mapPageConnection(response.getWebsitePages);
};

/**
 * Creates a page with an empty layout and page metadata derived from the current site.
 */
export const createPage = async (siteId: string, name: string): Promise<WebsitePage> => {
  const pageName = name.trim() || 'Untitled Page';
  const existingPages = (await getPages(siteId)).items;
  const ownerUserId = await getPageOwnerUserId(siteId, existingPages);
  const pageSlug = createUniquePageSlug(
    pageName,
    existingPages.map((page) => page.pageSlug)
  );
  const pageOrder = getNextPageOrder(existingPages);

  const response = await graphqlClient.mutate<InsertWebsitePageResponse>({
    query: INSERT_WEBSITE_PAGE_MUTATION,
    variables: {
      input: {
        siteId,
        ...(ownerUserId && { onwerUserId: ownerUserId }),
        pageName,
        pageSlug,
        pageOrder,
        status: 'draft',
        isHomePage: existingPages.length === 0,
        layoutJson: EMPTY_PAGE_LAYOUT_JSON,
        seoTitle: pageName,
        seoDescription: '',
      },
    },
  });

  const insertResult = response.insertWebsitePage;
  if (!insertResult?.acknowledged || !insertResult.itemId) {
    throw new Error('Page creation failed');
  }

  return {
    itemId: insertResult.itemId,
    siteId,
    ownerUserId,
    pageName,
    pageSlug,
    pageOrder,
    status: 'draft',
    isHomePage: existingPages.length === 0,
    layoutJson: EMPTY_PAGE_LAYOUT_JSON,
    seoTitle: pageName,
    seoDescription: '',
  };
};

/**
 * Saves the page layout JSON for a specific page.
 * The json argument should already be stringified before being passed in.
 */
export const savePage = async ({
  siteId,
  pageId,
  json,
  seoTitle,
  seoDescription,
  status = 'draft',
}: SavePageInput): Promise<SavePageResponse> => {
  const response = await graphqlClient.mutate<UpdateWebsitePageResponse>({
    query: UPDATE_WEBSITE_PAGE_MUTATION,
    variables: {
      filter: JSON.stringify({
        _id: pageId,
        siteId,
      }),
      input: {
        layoutJson: json,
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(status !== undefined && { status }),
      },
    },
  });

  if (!response.updateWebsitePage?.acknowledged) {
    throw new Error('Page save failed');
  }

  return response.updateWebsitePage;
};

/**
 * Creates a site record in SELISE Data Gateway.
 */
export const createSite = async ({
  siteName,
  siteSlug,
  ownerUserId,
  status = 'draft',
  themeJson = '{}',
  customDomain = '',
}: CreateSiteInput): Promise<CreateSiteResponse> => {
  const response = await graphqlClient.mutate<InsertWebsiteSiteResponse>({
    query: INSERT_WEBSITE_SITE_MUTATION,
    variables: {
      input: {
        siteName,
        siteSlug,
        ownerUserId,
        status,
        themeJson,
        customDomain,
      },
    },
  });

  return response.insertWebsiteSite;
};
