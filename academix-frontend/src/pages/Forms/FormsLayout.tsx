import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";

const FormsLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const hideBack = pathname === "/forms/formDashboard";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
    >
      {!hideBack && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            right: "7vw",
            top: "13vh",
            justifyContent: "flex-end",
            marginBottom: 16,
            direction: "rtl",
          }}
        >
          <Button
            type="default"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate("/forms/formDashboard")}
          >
            חזור
          </Button>
        </div>
      )}

      <Outlet />
    </div>
  );
};

export default FormsLayout;
