import fetchApi from "../utils/api";

export const getStats = async () => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("meetings/stats", {
    method: "GET",
    token: token,
  });
  if (response.code !== 200) {
    console.error("Error fetching stats:", response.message);
    return null;
  }
  return response;
};

export const iUserStats = async () => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi(`users/count`, {
    method: "GET",
    token: token,
  });
  if (response.code !== 200) {
    console.error("Error fetching user stats:", response.message);
    return null;
  }
  return response;
};

export const getCurrentMeeting = async () => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("meetings/last4-meetings", {
    method: "GET",
    token: token,
  });
  if (response.code !== 200) {
    console.error("Error fetching current meeting:", response.message);
    return null;
  }
  return response;
};
