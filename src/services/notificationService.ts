import { Notification } from "../interface/notification";
import fetchApi from "../utils/api";
import { v4 as uuid } from "uuid";

export const saveNotification = async (notification: Notification) => {
    const token = localStorage.getItem('token') || '';
    const data = {
        "notificationId": notification.id || uuid(),
        "sender": typeof notification.sender === 'string' ? notification.sender : notification.sender.employeeCode,
        "receive": notification.receiver,
        "content": notification.content,
        "timestamp": notification.timestamp,
        "isRead": notification.read,
      };
    const response = await fetchApi("notifications", {
        method: "POST",
        token: token,
        body: JSON.stringify(data),
    });
    return response;
}

export const getAllNotification = async (employeeCode: string) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi(`notifications?employeeCode=${employeeCode}`, {
        method: "GET",
        token: token,
    });
    return response;
}

export const markAsReadNotification = async (employeeCode: string) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetchApi(`notifications/read/${employeeCode}`, {
        method: "PUT",
        token: token,
    });
    return response;
}
