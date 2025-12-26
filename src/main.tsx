import { StrictMode } from "react";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  useRouter,
} from "@tanstack/react-router";
import "./index.css";

// Компонент для Not Found сторінки
const NotFoundComponent = () => {
  const router = useRouter();

  useEffect(() => {
    const currentPath = router.state.location.pathname;
    const windowPath = window.location.pathname;

    // Перевіряємо, чи це Windows шлях (наприклад /C:/, /D:/)
    const windowsDrivePattern = /^\/[A-Za-z]:\//;

    // Автоматично перенаправляємо на корінь, якщо шлях неправильний
    if (
      currentPath !== "/" &&
      (currentPath.includes("index.html") ||
        currentPath.includes("dist") ||
        windowsDrivePattern.test(windowPath) ||
        windowsDrivePattern.test(currentPath))
    ) {
      router.navigate({ to: "/" });
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
