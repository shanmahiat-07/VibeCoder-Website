import { graphqlClient } from '@/lib/graphql-client';
import { getCurrentUserId } from '@/state/auth/auth.storage';
import { UPDATE_WEBSITE_SITE_MUTATION, INSERT_WEBSITE_SITE_MUTATION } from '../graphql/mutations';
import { GET_WEBSITE_SITES_QUERY } from '../graphql/queries';
import type {
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

type WebsiteSiteConnection = {
  items: WebsiteSiteGraphQLNode[];
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

type InsertWebsiteSiteResponse = {
  insertWebsiteSite: CreateSiteResponse;
};

type UpdateWebsiteSiteResponse = {
  updateWebsiteSite: SavePageResponse;
};

type StoredPage = {
  id: string;
  name: string;
  layout: Record<string, unknown>;
};

type StoredSiteContent = {
  id: string;
  userId: string;
  name: string;
  pages: StoredPage[];
  isPublished?: boolean;
  publishedAt?: string;
  publishedPages?: StoredPage[];
};

const DEFAULT_PAGING = {
  pageNo: 1,
  pageSize: 50,
};

const EMPTY_PAGE_LAYOUT_JSON = JSON.stringify({ components: [] });

const EMPTY_SITE_LIST: SiteListResponse = {
  items: [],
  totalCount: 0,
  pageNo: 1,
  pageSize: DEFAULT_PAGING.pageSize,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_PAGE_LIST: PageListResponse = {
  items: [],
  totalCount: 0,
  pageNo: 1,
  pageSize: DEFAULT_PAGING.pageSize,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const slugify = (value: string, fallback: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
};

const randomId = () => Math.random().toString(36).slice(2, 10);

const parseContent = (site: WebsiteSiteGraphQLNode): StoredSiteContent => {
  try {
    const parsed = JSON.parse(site.themeJson || '{}') as Partial<StoredSiteContent>;

    return {
      id: typeof parsed.id === 'string' ? parsed.id : site.ItemId,
      userId: typeof parsed.userId === 'string' ? parsed.userId : site.ownerUserId,
      name: typeof parsed.name === 'string' ? parsed.name : site.siteName,
      isPublished: Boolean(parsed.isPublished),
      publishedAt: typeof parsed.publishedAt === 'string' ? parsed.publishedAt : undefined,
      pages: Array.isArray(parsed.pages)
        ? parsed.pages
            .filter((page): page is StoredPage => Boolean(page && typeof page === 'object'))
            .map((page) => ({
              id: typeof page.id === 'string' ? page.id : `page-${randomId()}`,
              name: typeof page.name === 'string' ? page.name : 'Untitled Page',
              layout:
                page.layout && typeof page.layout === 'object' ? page.layout : { components: [] },
            }))
        : [],
      publishedPages: Array.isArray(parsed.publishedPages)
        ? parsed.publishedPages
            .filter((page): page is StoredPage => Boolean(page && typeof page === 'object'))
            .map((page) => ({
              id: typeof page.id === 'string' ? page.id : `page-${randomId()}`,
              name: typeof page.name === 'string' ? page.name : 'Untitled Page',
              layout:
                page.layout && typeof page.layout === 'object' ? page.layout : { components: [] },
            }))
        : [],
    };
  } catch {
    return {
      id: site.ItemId,
      userId: site.ownerUserId,
      name: site.siteName,
      pages: [],
      isPublished: false,
      publishedPages: [],
    };
  }
};

const mapSite = (site: WebsiteSiteGraphQLNode): WebsiteSite => ({
  ...(() => {
    const content = parseContent(site);
    return {
      isPublished: content.isPublished ?? false,
      publishedAt: content.publishedAt,
    };
  })(),
  itemId: site.ItemId,
  userId: site.ownerUserId,
  siteName: site.siteName,
  siteSlug: site.siteSlug,
  ownerUserId: site.ownerUserId,
  status: site.status,
  themeJson: site.themeJson,
  customDomain: site.customDomain,
  createdDate: site.CreatedDate,
  lastUpdatedDate: site.LastUpdatedDate,
});

const findSiteById = async (siteId: string, includeOwnerFilter: boolean): Promise<WebsiteSite | null> => {
  const currentUserId = getCurrentUserId();
  const where = includeOwnerFilter
    ? {
        ItemId: siteId,
        ownerUserId: currentUserId,
      }
    : {
        ItemId: siteId,
      };

  const response = await graphqlClient.query<GetWebsiteSitesResponse>({
    query: GET_WEBSITE_SITES_QUERY,
    variables: {
      where,
      order: [],
      paging: {
        pageNo: 1,
        pageSize: 1,
      },
    },
  });

  const site = response.getWebsiteSites.items?.[0];
  return site ? mapSite(site) : null;
};

const mapSiteConnection = (connection: WebsiteSiteConnection): SiteListResponse => ({
  ...connection,
  items: (connection.items || []).map(mapSite),
});

const pageLayoutToJson = (layout: Record<string, unknown>) => JSON.stringify(layout || { components: [] });

const mapStoredPageToWebsitePage = (
  site: WebsiteSite,
  page: StoredPage,
  index: number
): WebsitePage => ({
  itemId: page.id,
  siteId: site.itemId,
  ownerUserId: site.ownerUserId,
  pageName: page.name,
  pageSlug: slugify(page.name, `page-${index + 1}`),
  pageOrder: index + 1,
  status: 'draft',
  isHomePage: index === 0,
  layoutJson: pageLayoutToJson(page.layout),
  seoTitle: page.name,
  seoDescription: '',
});

const updateSiteContent = async (
  site: WebsiteSite,
  update: (content: StoredSiteContent) => StoredSiteContent
): Promise<SavePageResponse> => {
  const content = parseContent({
    ItemId: site.itemId,
    siteName: site.siteName,
    siteSlug: site.siteSlug,
    ownerUserId: site.ownerUserId,
    status: site.status,
    themeJson: site.themeJson,
    customDomain: site.customDomain,
  });

  const nextContent = update(content);

  const response = await graphqlClient.mutate<UpdateWebsiteSiteResponse>({
    query: UPDATE_WEBSITE_SITE_MUTATION,
    variables: {
      filter: JSON.stringify({
        _id: site.itemId,
        ownerUserId: site.ownerUserId,
      }),
      input: {
        siteName: nextContent.name,
        themeJson: JSON.stringify(nextContent),
      },
    },
  });

  if (!response.updateWebsiteSite?.acknowledged) {
    throw new Error('Site update failed');
  }

  return response.updateWebsiteSite;
};

export const getSites = async (ownerUserId?: string): Promise<SiteListResponse> => {
  const currentUserId = getCurrentUserId();
  const userId = ownerUserId ?? currentUserId;

  if (!userId) {
    return EMPTY_SITE_LIST;
  }

  const response = await graphqlClient.query<GetWebsiteSitesResponse>({
    query: GET_WEBSITE_SITES_QUERY,
    variables: {
      where: {
        ownerUserId: userId,
      },
      order: [],
      paging: DEFAULT_PAGING,
    },
  });

  return mapSiteConnection(response.getWebsiteSites);
};

export const getSiteById = async (siteId: string): Promise<WebsiteSite | null> => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    return null;
  }

  return findSiteById(siteId, true);
};

export const getPages = async (siteId: string): Promise<PageListResponse> => {
  const site = await getSiteById(siteId);

  if (!site) {
    return EMPTY_PAGE_LIST;
  }

  const content = parseContent({
    ItemId: site.itemId,
    siteName: site.siteName,
    siteSlug: site.siteSlug,
    ownerUserId: site.ownerUserId,
    status: site.status,
    themeJson: site.themeJson,
    customDomain: site.customDomain,
  });

  const items = content.pages.map((page, index) => mapStoredPageToWebsitePage(site, page, index));

  return {
    ...EMPTY_PAGE_LIST,
    items,
    totalCount: items.length,
    totalPages: items.length > 0 ? 1 : 0,
  };
};

export const getPage = async (siteId: string, pageId: string): Promise<WebsitePage | null> => {
  const pages = await getPages(siteId);
  return pages.items.find((page) => page.itemId === pageId) ?? null;
};

export const getPublishedSiteById = async (siteId: string): Promise<WebsiteSite | null> => {
  const site = await findSiteById(siteId, false);
  if (!site?.isPublished) {
    return null;
  }

  return site;
};

export const getPublishedPages = async (siteId: string): Promise<PageListResponse> => {
  const site = await getPublishedSiteById(siteId);
  if (!site) {
    return EMPTY_PAGE_LIST;
  }

  const content = parseContent({
    ItemId: site.itemId,
    siteName: site.siteName,
    siteSlug: site.siteSlug,
    ownerUserId: site.ownerUserId,
    status: site.status,
    themeJson: site.themeJson,
    customDomain: site.customDomain,
  });

  const publishedPages = content.publishedPages || [];
  const items = publishedPages.map((page, index) => mapStoredPageToWebsitePage(site, page, index));

  return {
    ...EMPTY_PAGE_LIST,
    items,
    totalCount: items.length,
    totalPages: items.length > 0 ? 1 : 0,
  };
};

export const getPublishedPage = async (siteId: string, pageId: string): Promise<WebsitePage | null> => {
  const pages = await getPublishedPages(siteId);
  return pages.items.find((page) => page.itemId === pageId) ?? null;
};

export const getLayout = async (siteId: string, pageId: string): Promise<string> => {
  const page = await getPage(siteId, pageId);
  if (!page) {
    throw new Error('Page not found');
  }

  return page.layoutJson || EMPTY_PAGE_LAYOUT_JSON;
};

export const createSite = async (input: CreateSiteInput | string): Promise<CreateSiteResponse> => {
  const currentUserId = getCurrentUserId();
  const siteName = typeof input === 'string' ? input.trim() : input.siteName.trim();
  const ownerUserId =
    (typeof input === 'string' ? currentUserId : currentUserId ?? input.ownerUserId) || '';

  if (!ownerUserId) {
    throw new Error('User not found');
  }

  const safeSiteName = siteName || 'Untitled Site';
  const existingSites = await getSites(ownerUserId);
  const existingSlugs = new Set(existingSites.items.map((site) => site.siteSlug));

  const baseSlug = slugify(safeSiteName, 'site');
  let siteSlug = baseSlug;
  let suffix = 2;

  while (existingSlugs.has(siteSlug)) {
    siteSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const siteContent: StoredSiteContent = {
    id: `site-${randomId()}`,
    userId: ownerUserId,
    name: safeSiteName,
    pages: [],
  };

  const response = await graphqlClient.mutate<InsertWebsiteSiteResponse>({
    query: INSERT_WEBSITE_SITE_MUTATION,
    variables: {
      input: {
        siteName: safeSiteName,
        siteSlug,
        ownerUserId,
        status: typeof input === 'string' ? 'draft' : input.status ?? 'draft',
        themeJson: JSON.stringify(siteContent),
        customDomain: typeof input === 'string' ? '' : input.customDomain ?? '',
      },
    },
  });

  return response.insertWebsiteSite;
};

export const createPage = async (siteId: string, name: string): Promise<WebsitePage> => {
  const site = await getSiteById(siteId);

  if (!site) {
    throw new Error('Access denied');
  }

  const pageName = name.trim() || 'Untitled Page';
  const pageId = `page-${randomId()}`;
  const currentContent = parseContent({
    ItemId: site.itemId,
    siteName: site.siteName,
    siteSlug: site.siteSlug,
    ownerUserId: site.ownerUserId,
    status: site.status,
    themeJson: site.themeJson,
    customDomain: site.customDomain,
  });
  const pageOrder = currentContent.pages.length + 1;
  const nextPage: StoredPage = {
    id: pageId,
    name: pageName,
    layout: { components: [] },
  };

  await updateSiteContent(site, (content) => ({
    ...content,
    pages: [...content.pages, nextPage],
  }));

  return {
    itemId: pageId,
    siteId,
    ownerUserId: site.ownerUserId,
    pageName,
    pageSlug: slugify(pageName, `page-${pageOrder}`),
    pageOrder,
    status: 'draft',
    isHomePage: pageOrder === 1,
    layoutJson: EMPTY_PAGE_LAYOUT_JSON,
    seoTitle: pageName,
    seoDescription: '',
  };
};

export const deletePage = async (siteId: string, pageId: string): Promise<SavePageResponse> => {
  const site = await getSiteById(siteId);

  if (!site) {
    throw new Error('Access denied');
  }

  return updateSiteContent(site, (content) => {
    const nextPages = content.pages.filter((page) => page.id !== pageId);

    if (nextPages.length === content.pages.length) {
      throw new Error('Page not found');
    }

    return {
      ...content,
      pages: nextPages,
    };
  });
};

export const saveLayout = async (
  siteId: string,
  pageId: string,
  layoutJSON: string
): Promise<SavePageResponse> => {
  const site = await getSiteById(siteId);

  if (!site) {
    throw new Error('Access denied');
  }

  let parsedLayout: Record<string, unknown> = { components: [] };

  try {
    parsedLayout = JSON.parse(layoutJSON) as Record<string, unknown>;
  } catch {
    parsedLayout = { components: [] };
  }

  return updateSiteContent(site, (content) => {
    const pageFound = content.pages.some((page) => page.id === pageId);

    if (!pageFound) {
      throw new Error('Page not found');
    }

    return {
      ...content,
      pages: content.pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              layout: parsedLayout,
            }
          : page
      ),
    };
  });
};

export const savePage = async ({ siteId, pageId, json }: SavePageInput): Promise<SavePageResponse> =>
  saveLayout(siteId, pageId, json);

export const publishSite = async (siteId: string): Promise<SavePageResponse> => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error('Access denied');
  }

  const publishedAt = new Date().toISOString();

  return updateSiteContent(site, (content) => ({
    ...content,
    isPublished: true,
    publishedAt,
    publishedPages: content.pages.map((page) => ({
      id: page.id,
      name: page.name,
      layout: page.layout,
    })),
  }));
};
