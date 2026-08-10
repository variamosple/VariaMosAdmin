import { render } from "@testing-library/react";
import type React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

export const renderWithRouter = (
  ui: React.ReactElement,
  { route = "/", path = "/" } = {},
) => {
  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
};
