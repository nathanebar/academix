import { notification } from "antd";

type NotificationProps = {
    msg: string;
    type: string;
}

/**
 * Shows an antd toast at the top of the page. Call it as a plain function from an event
 * handler or a mutation callback: `Notification({ type: "success", msg: "..." })`.
 * It is not a component (it used to be typed React.FC, but nothing renders it as JSX);
 * it still returns null, so a JSX use would keep compiling.
 */
function Notification({ msg, type }: NotificationProps): null {

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
