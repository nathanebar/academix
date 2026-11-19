import { createBrowserRouter, Outlet, useRouteError } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Calendar from "../pages/calendar/Calendar";
import CourseContent from "../pages/courseContent/CourseContent";
import ProtectedRoute from "../components/ProtectedRoute";
import CourseDashboard from "../pages/dashboard/CourseDashboard/CourseDashboard";
import TeamDashboard from "../pages/dashboard/TeamDashboard/TeamDashboard";
import DomainDashboard from "../pages/dashboard/DomainDashboard/DomainDashboard";
import CourseBatchDashboard from "../pages/dashboard/CourseBatchDashboard/courseBatchDashboard";
import TeamMemberDashboard from "../pages/dashboard/TeamMemberDashboard/TeamMemberDashboard";
import Forms from "../pages/Forms/Forms";
import CreateForms from "../components/Forms/CreateForms/CreateForms";
import FeedbackCreate from "../pages/Feedback/FeedbackCreate/FeedbackCreate";
import FeedbackDashboard from "../pages/Feedback/FeedbackDashboard/FeedbackDashboard";
import FeedbackEdit from "../pages/Feedback/FeedbackEdit/FeedbackEdit";
import ShowForm from "../pages/Forms/ShowForm/ShowForm";
import FormBody from "../pages/Forms/FormBody/FormBody";
import AnswerForms from "../pages/Forms/AnswerForm/AnswerForm";
import GradingForm from "../pages/Forms/GradingForm/GradingForm";
import FormsDashboard from "../pages/dashboard/FormsDashboard/FormsDashboard";
import DevDashboard from "../pages/dashboard/DevDashboard/DevDashboard";
import CreateSystem from "../pages/dashboard/CreateSystem/CreateSystem";
import EditForm from "../pages/Forms/EditForm/EditForm";
import StudentsStatus from "../pages/studentStatus/StudentsStatus";
import SurveyDashboard from "../pages/dashboard/SurveyDashboard/SurveyDashboard";
import SurveyMembersPage from "../pages/dashboard/SurveyDashboard/SurveyMembers/SurveyMembersPage";
import HoefOverview from "../components/HoefOverview/HoefOverview";
import HoefPersonalDashboard from "../components/HoefPersonalDashboard/HoefPersonalDashboard";
import KnowledgeRetention from "../pages/knowledgeRetention/KnowledgeRetention";
import {
  createProtectedRoute,
  createProtectedGroup,
} from "../utils/routeUtils";
import Notebook from "../pages/Notebook/Notebook";
import FormsLayout from "../pages/Forms/FormsLayout";
import ErrorPage from "../pages/ErrorPage/ErrorPage";

const ADMIN_ROLES = ["SYSTEM-ADMIN", "ADMIN"] as any;

const DOMAIN_ROLES = ["SYSTEM-ADMIN", "ADMIN", "DOMAIN_MANAGER"] as any;

const COURSE_ROLES = [
  "SYSTEM-ADMIN",
  "ADMIN",
  "DOMAIN_MANAGER",
  "COURSE_COMMANDER",
] as any;

const OVERLAP_ROLES = [
  "SYSTEM-ADMIN",
  "ADMIN",
  "DOMAIN_MANAGER",
  "COURSE_COMMANDER",
  "TEAM_COMMANDER",
  "OVERLAP",
] as any;

function RouteError() {
  const err = useRouteError() as { status?: number };
  return <ErrorPage code={err?.status ?? 500} />;
}

export const AppRoutes = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      createProtectedGroup(
        "/dashboard/dev",
        [
          { path: "", element: <DevDashboard /> },
          { path: "create", element: <CreateSystem /> },
        ],
        ADMIN_ROLES
      ),
      createProtectedRoute(
        "/dashboard/domain",
        <DomainDashboard />,
        DOMAIN_ROLES
      ),
      createProtectedRoute(
        "/dashboard/courseBatch",
        <CourseBatchDashboard />,
        COURSE_ROLES
      ),
      createProtectedRoute(
        "/dashboard/course",
        <CourseDashboard />,
        COURSE_ROLES
      ),
      createProtectedRoute("/dashboard/team", <TeamDashboard />, OVERLAP_ROLES),
      createProtectedRoute(
        "/dashboard/hoef-dashboard",
        <HoefPersonalDashboard />,
        OVERLAP_ROLES
      ),
      createProtectedRoute(
        "/dashboard/HoefOverview",
        <HoefOverview />,
        OVERLAP_ROLES
      ),
      { path: "/Notebook", element:<Notebook /> },
      { path: "/calendar", element: <Calendar /> },
      { path: "/dashboard/teamMember", element: <TeamMemberDashboard /> },

      {
        path: "/knowledge-retention",
        element: <Outlet />,
        children: [
          { path: "", element: <KnowledgeRetention /> },
          {
            path: "course/:courseId/batch/:batchId",
            element: <KnowledgeRetention />,
          },
          {
            path: "course/:courseId/batch/:batchId/team/:teamId",
            element: <KnowledgeRetention />,
          },
        ],
      },

      {
        path: "/forms",
        element: <FormsLayout />,
        children: [
          {
            path: "edit",
            element: <EditForm />,
            children: [
              {
                path: ":formId",
                element: (
                  <ProtectedRoute allowedRoles={OVERLAP_ROLES}>
                    <CreateForms />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: "show",
            element: <ShowForm />,
            children: [
              {
                path: ":taskAssignmentId",
                element: <FormBody renderFor="show" />,
              },
            ],
          },
          {
            path: "answer",
            element: <AnswerForms />,
            children: [
              {
                path: ":taskAssignmentId",
                element: <FormBody renderFor="answer" />,
              },
            ],
          },
          {
            path: "grading",
            children: [
              {
                index: true,
                element: <GradingForm />,
              },
            ],
          },
          {
            path: "create",
            element: (
              <ProtectedRoute allowedRoles={OVERLAP_ROLES}>
                <CreateForms />
              </ProtectedRoute>
            ),
          },
          {
            path: "formDashboard",
            element: <Forms />,
          },
          {
            path: "detailes",
            element: (
              <ProtectedRoute allowedRoles={OVERLAP_ROLES}>
                <FormsDashboard />
              </ProtectedRoute>
            ),
          },
        ],
      },

      createProtectedGroup(
        "/survey",
        [
          {
            path: "surveyDashboard",
            element: <SurveyDashboard />,
          },
          {
            path: "members",
            element: <SurveyMembersPage />,
          },
          {
            path: "create",
            element: <CreateForms />,
          },
          {
            path: "edit",
            element: <CreateForms />,
            children: [
              {
                path: ":formId",
                element: <CreateForms />,
              },
            ],
          },
        ],
        OVERLAP_ROLES
      ),

      {
        path: "/courseContent",
        element: <CourseContent />,
      },
      {
        path: "/studentStatus",
        element: (
          <ProtectedRoute allowedRoles={OVERLAP_ROLES}>
            <StudentsStatus />
          </ProtectedRoute>
        ),
      },
      {
        path: "/feedback",
        element: <Outlet />,
        children: [
          {
            path: "create",
            element: <FeedbackCreate />,
          },
          {
            path: ":taskId/fill/:teamId",
            element: <FeedbackEdit mode="fill" />,
          },
          {
            path: ":taskAssignmentId/view",
            element: <FeedbackEdit mode="view" />,
          },
          {
            path: "view/:feedbackId",
            element: <FeedbackCreate mode="view" />,
          },
          {
            path: "edit/:feedbackId",
            element: <FeedbackCreate mode="edit" />,
          },
        ],
      },
      {
        path: "/feedbackDashboard",
        element: <FeedbackDashboard />,
        children: [
          {
            path: ":userId",
          },
        ],
      },
      { path: "*", element: <ErrorPage code={404} /> },
     ],
  },
]);
