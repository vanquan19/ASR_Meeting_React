import fetchApi from "../utils/api";
const getAllDepartments = async () => {
  const response = await fetchApi("departments",{
    method: "GET",
    token: localStorage.getItem('token') || '',
  });
  if(!response || response.code !== 200) {
    throw new Error("Failed to fetch departments");
  }

 return response;
}

const getDepartmentById = async (id: string) => {
  const response = await fetchApi(`/departments/${id}`,{    
    method: "GET",
    token: localStorage.getItem('token') || '',
  });

 return response;
}
const createDepartment = async ({departmentCode, name}: {
    departmentCode: string;
    name: string;
}) => {
    const response = await fetchApi("departments", {
        method: "POST",
        token: localStorage.getItem('token') || '',
        body: JSON.stringify({ departmentCode, name }),
    });

    return response
}
const updateDepartment = async (id: number, {departmentCode, name}: {
    departmentCode: string;
    name: string;
}) => {
    const response = await fetchApi(`departments/${id}`, {
        method: "PUT",
        token: localStorage.getItem('token') || '',
        body: JSON.stringify({ departmentCode, name }),
    });

    return response
}
const deleteDepartment = async (id: number) => {
    const response = await fetchApi(`departments/${id}`, {
        method: "DELETE",
        token: localStorage.getItem('token') || '',
    });

    return response
}
export {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
}