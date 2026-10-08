import { Route, Routes } from 'react-router';
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
        <Route path="log" element={<QuickLogPage />} />
        <Route path="places" element={<MyPlacesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
