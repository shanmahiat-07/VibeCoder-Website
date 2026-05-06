import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/app-routes';
import { AuthProvider } from './state/auth/auth-context';
import { ThemeProvider } from './styles/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
