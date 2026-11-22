import { lazy } from "react";
import { createBrowserRouter, Outlet, useRouteError } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import {
  createProtectedRoute,
  createProtectedGroup,
} from "../utils/routeUtils";
import ErrorPage from "../pages/ErrorPage/ErrorPage";

// Pages are loaded on demand (one chunk per page). The <Suspense> boundary is around the
// <Outlet /> in Layout, so the top bar / sidebar stay visible while a page chunk loads.
// Layout, ProtectedRoute and ErrorPage stay static: they are needed on every route.
const Calendar = lazy(() => import("../pages/calendar/Calendar"));
const CourseContent = lazy(() => import("../pages/courseContent/CourseContent"));
const CourseDashboard = lazy(() => import("../pages/dashboard/CourseDashboard/CourseDashboard"));
const TeamDashboard = lazy(() => import("../pages/dashboard/TeamDashboard/TeamDashboard"));
const DomainDashboard = lazy(() => import("../pages/dashboard/DomainDashboard/DomainDashboard"));
const CourseBatchDashboard = lazy(() => import("../pages/dashboard/CourseBatchDashboard/courseBatchDashboard"));
const TeamMemberDashboard = lazy(() => import("../pages/dashboard/TeamMemberDashboard/TeamMemberDashboard"));
const Forms = lazy(() => import("../pages/Forms/Forms"));
const CreateForms = lazy(() => import("../components/Forms/CreateForms/CreateForms"));
const FeedbackCreate = lazy(() => import("../pages/Feedback/FeedbackCreate/FeedbackCreate"));
const FeedbackDashboard = lazy(() => import("../pages/Feedback/FeedbackDashboard/FeedbackDashboard"));
const FeedbackEdit = lazy(() => import("../pages/Feedback/FeedbackEdit/FeedbackEdit"));
const ShowForm = lazy(() => import("../pages/Forms/ShowForm/ShowForm"));
const FormBody = lazy(() => import("../pages/Forms/FormBody/FormBody"));
const AnswerForms = lazy(() => import("../pages/Forms/AnswerForm/AnswerForm"));
const GradingForm = lazy(() => import("../pages/Forms/GradingForm/GradingForm"));
const FormsDashboard = lazy(() => import("../pages/dashboard/FormsDashboard/FormsDashboard"));
const DevDashboard = lazy(() => import("../pages/dashboard/DevDashboard/DevDashboard"));
const CreateSystem = lazy(() => import("../pages/dashboard/CreateSystem/CreateSystem"));
const EditForm = lazy(() => import("../pages/Forms/EditForm/EditForm"));
const StudentsStatus = lazy(() => import("../pages/studentStatus/StudentsStatus"));
const SurveyDashboard = lazy(() => import("../pages/dashboard/SurveyDashboard/SurveyDashboard"));
const SurveyMembersPage = lazy(() => import("../pages/dashboard/SurveyDashboard/SurveyMembers/SurveyMembersPage"));
const HoefOverview = lazy(() => import("../components/HoefOverview/HoefOverview"));
const HoefPersonalDashboard = lazy(() => import("../components/HoefPersonalDashboard/HoefPersonalDashboard"));
const KnowledgeRetention = lazy(() => import("../pages/knowledgeRetention/KnowledgeRetention"));
const Notebook = lazy(() => import("../pages/Notebook/Notebook"));
const FormsLayout = lazy(() => import("../pages/Forms/FormsLayout"));

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
  // Session could not be renewed (closed network, silent NTLM re-authentication failed): outside
  // Layout, which needs a valid session to load the permissions. See SESSION_ERROR_PATH (api/axios.ts).
  { path: "/session-error", element: <ErrorPage code={401} /> },
]);
