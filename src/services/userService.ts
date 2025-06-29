import fetchApi from "../utils/api";
export const getAllUsers = async () => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("users", {
    method: "GET",
    token: token,
  });
  return response;
};

export const getUserById = async (userId: string) => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("users/" + userId, {
    method: "GET",
    token: token,
  });
  return response;
};

export const getMyInfo = async () => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("users/my-info", {
    method: "GET",
    token: token,
  });
  return response;
};

export const createUser = async ({
  name,
  employeeCode,
  email,
  dob,
  role = "ROLE_USER",
  departmentId,
  degree,
}: {
  name: string;
  employeeCode: string;
  email: string;
  dob: string;
  role?: string;
  departmentId: string;
  degree: string;
}) => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("users/create", {
    method: "POST",
    token: token,
    body: JSON.stringify({
      name,
      employeeCode,
      email,
      dob,
      role,
      departmentId,
      degree,
    }),
  });
  return response;
};
export const updateUser = async (
  id: number,
  {
    name,
    employeeCode,
    email,
    dob,
    role = "ROLE_USER",
    departmentId,
    degree,
  }: {
    name?: string;
    employeeCode?: string;
    email?: string;
    dob?: string;
    role?: string;
    departmentId?: string;
    degree?: string;
  }
) => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("users/" + id, {
    method: "PUT",
    token: token,
    body: JSON.stringify({
      name,
      employeeCode,
      email,
      dob,
      role,
      departmentId,
      degree,
    }),
  });
  return response;
};

export const updateMyInfo = async ({
  name,
  dob,
  phoneNumber,
  identification,
  address,
  bankName,
  bankNumber,
  email,
  img,
}: {
  name?: string;
  dob?: string;
  phoneNumber?: string;
  identification?: string;
  address?: string;
  bankName?: string;
  bankNumber?: string;
  email?: string;
  img?: string;
}) => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("users/profile/my-info", {
    method: "PUT",
    token: token,
    body: JSON.stringify({
      name,
      dob,
      phoneNumber,
      identification,
      address,
      bankName,
      bankNumber,
      email,
      img,
    }),
  });
  if (response.code !== 200) {
    throw new Error(`Error: ${response.message}`);
  }
  return response;
};

export const deleteUser = async (id: number) => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("users/" + id, {
    method: "DELETE",
    token: token,
  });
  return response;
};

export const changePassword = async ({
  oldPassword,
  newPassword,
}: {
  oldPassword: string;
  newPassword: string;
}) => {
  const token = localStorage.getItem("token") || "";
  const response = await fetchApi("auth/change-password", {
    method: "PUT",
    token: token,
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return response;
};
