import { Routes, Route, Navigate } from 'react-router-dom';
import { NotFoundPage, ServiceUnavailablePage } from '@/modules/error-view';
import { PublicWebsitePage, WebsiteBuilderPage } from '@/modules/website-builder';
import { ThemeProvider } from '@/styles/theme/theme-provider';
import { Toaster } from '@/components/ui-kit/toaster';
import { useLanguageContext } from '@/i18n/language-context';
import { LoadingOverlay } from '@/components/core/loading-overlay/loading-overlay';
import { HomePage } from '@/pages/HomePage';

export const AppRoutes = () => {
  const { isLoading } = useLanguageContext();

  if (isLoading) {
    return <LoadingOverlay />;
  }
  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/site/:siteId/:pageId" element={<PublicWebsitePage />} />
          <Route path="/website-builder" element={<WebsiteBuilderPage />} />
          <Route path="/website-builder/:siteId" element={<WebsiteBuilderPage />} />
          <Route path="/website-builder/:siteId/:pageId" element={<WebsiteBuilderPage />} />
          <Route path="/503" element={<ServiceUnavailablePage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </ThemeProvider>
      <Toaster />
    </div>
  );
};
