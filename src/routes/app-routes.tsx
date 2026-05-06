import { Navigate, Route, Routes } from 'react-router-dom';

import { NotFoundPage } from '@/modules/error-view/pages/not-found/not-found';
import { PublicWebsitePage } from '@/modules/website-builder/pages/public-website-page/public-website-page';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { WebsiteBuilderPage } from '@/modules/website-builder/pages/website-builder/website-builder';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RequireAuth } from '@/state/auth/RequireAuth';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/website-builder"
        element={
          <RequireAuth>
            <WebsiteBuilderPage />
          </RequireAuth>
        }
      />
      <Route
        path="/website-builder/:siteId"
        element={
          <RequireAuth>
            <WebsiteBuilderPage />
          </RequireAuth>
        }
      />
      <Route
        path="/website-builder/:siteId/:pageId"
        element={
          <RequireAuth>
            <WebsiteBuilderPage />
          </RequireAuth>
        }
      />
      <Route
        path="/site/:siteId/:pageId"
        element={<PublicWebsitePage />}
      />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
