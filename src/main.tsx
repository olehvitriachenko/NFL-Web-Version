import { StrictMode } from "react";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  useRouter,
} from "@tanstack/react-router";
import "./index.css";

// Функція для нормалізації шляху - витягує правильний шлях з Windows шляху
const normalizeRouterPath = (path: string): string => {
  const windowsDrivePattern = /^\/[A-Za-z]:\//;
  
  // Якщо це Windows шлях типу /C:/home, витягуємо тільки /home
  if (windowsDrivePattern.test(path)) {
    // Видаляємо /C:/ або /D:/ і т.д.
    const match = path.match(/^\/[A-Za-z]:\/(.+)$/);
    if (match && match[1]) {
      return '/' + match[1];
    }
    return '/';
  }
  
  // Якщо шлях містить index.html або dist, нормалізуємо
  if (path.includes('index.html')) {
    return path.replace(/index\.html.*$/, '') || '/';
  }
  
  if (path.includes('dist')) {
    const distIndex = path.indexOf('dist');
    if (distIndex !== -1) {
      const afterDist = path.substring(distIndex + 4);
      const normalized = afterDist.replace(/\\/g, '/').replace(/index\.html$/, '');
      return normalized || '/';
    }
  }
  
  return path;
};

// Компонент для Not Found сторінки
const NotFoundComponent = () => {
  const router = useRouter();

  useEffect(() => {
    const currentPath = router.state.location.pathname;
    const normalized = normalizeRouterPath(currentPath);

    // Якщо шлях неправильний, виправляємо його
    if (currentPath !== normalized) {
      router.navigate({ to: normalized });
    }
  }, [router]);

  console.log("Not Found - Current location:", window.location.href);
  console.log("Router state:", router.state);
  console.log("Router location:", router.state.location);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <p>Current path: {window.location.pathname}</p>
      <p>Router path: {router.state.location.pathname}</p>
      <p>Full URL: {window.location.href}</p>
      <button onClick={() => router.navigate({ to: "/" })}>Go to Login</button>
    </div>
  );
};

// Імпорт роутів (буде згенеровано автоматично)
import { routeTree } from "./routeTree.gen";

// Створення роутера
// Для Electron з file:// протоколом використовуємо порожній basepath
// Для веб-версії використовуємо './' з vite.config.ts
const isElectron =
  typeof window !== "undefined" && window.location.protocol === "file:";

// Для Electron з file:// протоколом використовуємо порожній basepath
// та виправляємо шлях для правильного роутингу
let basepath = "./";
if (isElectron) {
  basepath = "";

  // Динамічно визначаємо та виправляємо pathname для Electron
  const currentPath = window.location.pathname;

  // Для file:// протоколу pathname містить повний шлях, потрібно витягти тільки частину після dist/
  let normalizedPath = "/";

  // Перевіряємо, чи це Windows шлях (наприклад /C:/, /D:/)
  const windowsDrivePattern = /^\/[A-Za-z]:\//;
  if (windowsDrivePattern.test(currentPath)) {
    // Це Windows шлях, потрібно витягти частину після dist/
    if (currentPath.includes("dist")) {
      const distIndex = currentPath.indexOf("dist");
      if (distIndex !== -1) {
        const afterDist = currentPath.substring(distIndex + 4); // +4 для "dist"
        normalizedPath = afterDist.replace(/\\/g, "/") || "/";
        // Видаляємо index.html якщо є
        normalizedPath = normalizedPath.replace(/index\.html$/, "");
        // Видаляємо початковий слеш, якщо він є після dist
        normalizedPath = normalizedPath.replace(/^\/+/, "/");
        if (!normalizedPath || normalizedPath === "/") {
          normalizedPath = "/";
        }
      } else {
        // Якщо немає dist, просто встановлюємо корінь
        normalizedPath = "/";
      }
    } else if (currentPath.includes("index.html")) {
      // Якщо шлях містить index.html, замінюємо на корінь
      normalizedPath = "/";
    } else {
      // Якщо це просто Windows шлях без dist/index.html, встановлюємо корінь
      normalizedPath = "/";
    }
  } else if (currentPath.includes("index.html")) {
    // Якщо шлях містить index.html, замінюємо на корінь
    normalizedPath = "/";
  } else if (currentPath.includes("dist")) {
    // Якщо шлях містить dist, витягуємо частину після dist/
    const distIndex = currentPath.indexOf("dist");
    if (distIndex !== -1) {
      const afterDist = currentPath.substring(distIndex + 4); // +4 для "dist"
      normalizedPath = afterDist.replace(/\\/g, "/") || "/";
      // Видаляємо index.html якщо є
      normalizedPath = normalizedPath.replace(/index\.html$/, "");
      if (!normalizedPath || normalizedPath === "/") {
        normalizedPath = "/";
      }
    }
  } else if (
    currentPath &&
    currentPath !== "/" &&
    !currentPath.startsWith("/")
  ) {
    // Якщо шлях не починається з /, це може бути Windows шлях
    normalizedPath = "/";
  }

  // Замінюємо шлях на нормалізований
  if (currentPath !== normalizedPath) {
    try {
      window.history.replaceState(null, "", normalizedPath);
    } catch {
      // Якщо не вдалося, використовуємо hash routing
      window.location.hash =
        normalizedPath === "/" ? "#/" : `#${normalizedPath}`;
    }
  }
}

const router = createRouter({
  routeTree,
  basepath,
  defaultPreload: "intent",
  // Для Electron виправляємо початковий шлях
  ...(isElectron && {
    context: {
      // Виправляємо початковий шлях для Electron
      initialPath: "/",
    },
  }),
  defaultNotFoundComponent: NotFoundComponent,
});

// Вимкнути Service Worker для Electron и в dev режиме (file:// протокол не підтримує Service Worker, а в dev он вызывает CORS ошибки)
if ('serviceWorker' in navigator) {
  // Отключаем все зарегистрированные service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {
        // Игнорируем ошибки при отключении
      });
    });
  });
  
  // Блокируем регистрацию новых service workers
  const originalRegister = navigator.serviceWorker.register;
  navigator.serviceWorker.register = function(...args) {
    console.log('[Main] Service worker registration blocked to prevent CORS issues');
    return Promise.reject(new Error('Service worker registration disabled'));
  };
}

// Реєстрація типів для TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
