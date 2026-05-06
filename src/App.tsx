import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/app-routes';
import { ThemeProvider } from './styles/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
