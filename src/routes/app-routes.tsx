import { Navigate, Route, Routes } from 'react-router-dom';

import { NotFoundPage } from '@/modules/error-view/pages/not-found/not-found';
import { PublicWebsitePage } from '@/modules/website-builder/pages/public-website-page/public-website-page';
import { WebsiteBuilderPage } from '@/modules/website-builder/pages/website-builder/website-builder';
import { HomePage } from '@/pages/HomePage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/website-builder" element={<WebsiteBuilderPage />} />
      <Route path="/site/:siteId/:pageId" element={<PublicWebsitePage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
