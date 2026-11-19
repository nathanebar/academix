import { useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { login, storeUserInfo } from "../../services/ntlmService";
import styles from "./Login.module.css";

type Values = { username: string; password: string };

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async ({ username, password }: Values) => {
    setLoading(true);
    setError(null);
    try {
      const user = await login(username.trim(), password);
      storeUserInfo(user);
      // Rechargement complet : tous les stores repartent avec l'utilisateur connecté
      window.location.reload();
    } catch (err: any) {
      setError(
        err?.response?.status === 401
          ? "שם משתמש או סיסמה שגויים"
          : "שגיאה בהתחברות, נסה שוב מאוחר יותר"
      );
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img
          className={styles.logo}
          src={`${process.env.PUBLIC_URL}/logoweb.png`}
          alt="Academix"
        />
        <h1 className={styles.title}>התחברות</h1>

        {error && <Alert className={styles.alert} type="error" message={error} showIcon />}

        <Form<Values> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="שם משתמש"
            name="username"
            rules={[{ required: true, message: "יש להזין שם משתמש" }]}
          >
            <Input prefix={<UserOutlined />} autoComplete="username" autoFocus size="large" />
          </Form.Item>
          <Form.Item
            label="סיסמה"
            name="password"
            rules={[{ required: true, message: "יש להזין סיסמה" }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            כניסה
          </Button>
        </Form>
      </div>
    </div>
  );
}
