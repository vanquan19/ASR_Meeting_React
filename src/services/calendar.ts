import fetchApi from "../utils/api";

export const getCalendar = async (month: number, year: number) => {
    const date = new Date();
    month = month || date.getMonth() + 1;
    year = year || date.getFullYear();
    const token = localStorage.getItem("token") || "";
    const response = await fetchApi(`meetings/schedule/by-month?month=${month}&year=${year}`, {
        method: "GET",
        token: token,
    });
    console.log("Calendar response:", response);
    return response;
}