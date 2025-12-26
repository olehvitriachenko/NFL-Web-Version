import { useEffect } from 'react';
import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router';
import { saveCurrentPath } from '../utils/navigation';

export const Route = createRootRoute({
  component: () => {
    const router = useRouter();

    useEffect(() => {
      // Зберігаємо поточний шлях при зміні (тільки якщо це не Windows шлях)
      const path = router.state.location.pathname;
      // Перевіряємо, чи це не Windows шлях типу /C:/home
      const windowsDrivePattern = /^\/[A-Za-z]:\//;
      if (!windowsDrivePattern.test(path)) {
        saveCurrentPath(path);
      }
    }, [router.state.location.pathname]);

    return (
      <div>
        <Outlet />
      </div>
    );
  },
});

