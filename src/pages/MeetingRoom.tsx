import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { getAllMeetingForUser } from "../services/meetingService";

export default function MeetingRoom() {
  const [dataMeetingRoom, setDataMeetingRoom] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  useEffect(() => {
    const getData = async () => {
      const response = await getAllMeetingForUser(user.id);
      console.log(response);
      setDataMeetingRoom(response?.result || []);
    };
    getData();
  }, [user.id]);
  return (
    <div>
      <div className="grid lg:grid-cols-5 gap-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
        {dataMeetingRoom.map((item, index) => (
          <Card key={"" + index}>x</Card>
        ))}
      </div>
    </div>
  );
}
