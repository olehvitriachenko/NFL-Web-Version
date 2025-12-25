import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";

// Імпорт роутів (буде згенеровано автоматично)
import { routeTree } from "./routeTree.gen";

// Створення роутера
const router = createRouter({ routeTree });

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
