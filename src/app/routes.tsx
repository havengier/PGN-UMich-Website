import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import Professional from "./pages/Professional";
import Members from "./pages/Members";
import DEI from "./pages/DEI";
import Recruitment from "./pages/Recruitment";
import Apply from "./pages/Apply";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: AboutUs },
      { path: "professional", Component: Professional },
      { path: "members", Component: Members },
      { path: "dei", Component: DEI },
      { path: "recruitment", Component: Recruitment },
      { path: "apply", Component: Apply },
      { path: "*", Component: NotFound },
    ],
  },
]);
