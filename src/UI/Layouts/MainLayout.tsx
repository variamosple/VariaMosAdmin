import { FC } from "react";
import { Outlet } from "react-router-dom";
import { Footer } from "../Components/Footer";
import { Header } from "../Components/Header";

export const MainLayout: FC<unknown> = () => {
  return (
    <>
      <Header />

      <Outlet />

      <Footer />
    </>
  );
};
