import fetchApi from "../utils/api";

const getAllRooms = async () => {
  const response = await fetchApi("rooms", {
    method: "GET",
    token: localStorage.getItem('token') || '',
  });

return response;
}
const getRoomById = async (id: string) => {
  const response = await fetchApi(`/rooms/${id}`, {
    method: "GET",
    token: localStorage.getItem('token') || '',
  });

return response;
}

const createRoom = async ({roomCode, roomName}: {
    roomCode: string;
    roomName: string;
}) => {
    const response = await fetchApi("rooms", {
        method: "POST",
        token: localStorage.getItem('token') || '',
        body: JSON.stringify({ roomCode, roomName }),
    });

    

    return response;
}

const updateRoom = async (id: number, {roomCode, roomName}: {
    roomCode: string;
    roomName: string;
}) => {
    const response = await fetchApi(`rooms/${id}`, {
        method: "PUT",
        token: localStorage.getItem('token') || '',
        body: JSON.stringify({ roomCode, roomName }),
    });
    console.log(response);
    if (response.code !== 200) {
        console.error("Network response was not ok");
       return ;
    }
    return response;
}

const deleteRoom = async (id: number) => {
    const response = await fetchApi(`rooms/${id}`, {
        method: "DELETE",
        token: localStorage.getItem('token') || '',
    });
    console.log(response);
    if (response.code !== 200) {
        console.error("Network response was not ok");
       return ;
    }
    return response;
}

export {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
}