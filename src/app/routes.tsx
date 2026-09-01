import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import Professional from "./pages/Professional";
import Members from "./pages/Members";
import DEI from "./pages/DEI";
import Recruitment from "./pages/Recruitment";
import Apply from "./pages/Apply";
import Admin from "./pages/Admin";
import AdminHome from "./pages/admin/AdminHome";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminProfessional from "./pages/admin/AdminProfessional";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminDEI from "./pages/admin/AdminDEI";
import AdminRecruitment from "./pages/admin/AdminRecruitment";
import AdminApply from "./pages/admin/AdminApply";
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
      { path: "admin", Component: Admin },
      { path: "admin/home", Component: AdminHome },
      { path: "admin/about", Component: AdminAbout },
      { path: "admin/professional", Component: AdminProfessional },
      { path: "admin/members", Component: AdminMembers },
      { path: "admin/dei", Component: AdminDEI },
      { path: "admin/recruitment", Component: AdminRecruitment },
      { path: "admin/apply", Component: AdminApply },
      { path: "*", Component: NotFound },
    ],
  },
]);

