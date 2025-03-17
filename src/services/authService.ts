import { UserType } from "../context/AuthContext";
import fetchApi from "../utils/api";

interface loginResponse {
  code: number;
  message: string;
  result?: {
    token: string;
    authenticated: boolean;
    user?: UserType;
  };
}

export const loginService: (
  username: string,
  password: string
) => Promise<loginResponse> = async (username, password) => {
  // This is a placeholder for a real login function
  const response = await fetchApi("auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  return response as loginResponse;
};

export const logoutService = async (token:string | null) => {
  // This is a placeholder for a real logout function
  await fetchApi("auth/logout", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
};


export const checkAuth: (token: string) => Promise<boolean> = async (
  token
) => {
  const response = await fetchApi("auth/introspect", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

  
  return response.code === 200 ? response.result?.valid : false;
}