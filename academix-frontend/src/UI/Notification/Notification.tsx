import { notification } from "antd";

type NotificationProps = {
    msg: string;
    type: string;
}

const Notification: React.FC<NotificationProps> = ({ msg, type }) => {

    if (type === 'error') {
        notification.error({
            message: "שגיאה!",
            description: msg,
            duration: 4,
            placement: "top",
            style: { direction: "rtl" },
        });
    } else if (type === 'success') {
        notification.success({
            message: "הצלחה!",
            description: msg,
            duration: 4,
            placement: "top",
            style: { direction: "rtl" },
        });
    }

    return null;
}

export default Notification;