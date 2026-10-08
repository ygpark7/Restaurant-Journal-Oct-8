import { Route, Routes } from 'react-router';
import { AccountPage } from '@/features/auth/AccountPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { MyPlacesPage } from '@/features/lists/MyPlacesPage';
import { QuickLogPage } from '@/features/log/QuickLogPage';
import { DiscoverPage } from '@/features/restaurants/DiscoverPage';
import { RestaurantDetailPage } from '@/features/restaurants/RestaurantDetailPage';
import { AppShell } from './AppShell';
import { NotFoundPage } from './NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DiscoverPage />} />
        <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
        <Route
          path="log"
          element={
            <RequireAuth>
              <QuickLogPage />
            </RequireAuth>
          }
        />
        <Route
          path="places"
          element={
            <RequireAuth>
              <MyPlacesPage />
            </RequireAuth>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
