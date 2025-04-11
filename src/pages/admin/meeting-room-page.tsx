import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { toast } from "react-toastify";
import { RoomType } from "../../interface/room";
import {
  createRoom,
  deleteRoom,
  getAllRooms,
  updateRoom,
} from "../../services/roomService";

export default function MeetingRoomPage() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomCode: "",
    roomName: "",
  });
  const [progressRoom, setProgressRoom] = useState<RoomType>({} as RoomType);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getAllRooms();
        if (!response || response.code !== 200) {
          throw new Error("Failed to fetch departments");
        }
        setRooms(response.result);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  const handleAddRoom = async () => {
    const roomToAdd = {
      roomCode: newRoom.roomCode,
      roomName: newRoom.roomName,
    };
    const response = await createRoom(roomToAdd);
    if (!response || response.code !== 201) {
      throw new Error("Failed to create room");
    }
    setRooms((prev) => [...prev, response.result]);
    toast.success("Thêm phòng thành công");
    setNewRoom({ roomCode: "", roomName: "" });
    setIsAddDialogOpen(false);
  };

  const handleUpdateRoom = async (id: number) => {
    const roomToUpdate = {
      roomCode: newRoom.roomCode,
      roomName: newRoom.roomName,
    };
    const response = await updateRoom(id, roomToUpdate);
    console.log(response);
    if (!response || response.code !== 200) {
      throw new Error("Failed to update room");
    }
    toast.success("Cập nhật phòng thành công");
    setRooms((prev) =>
      prev.map((room) => (room.id === id ? response.result : room))
    );
    setNewRoom({ roomCode: "", roomName: "" });
    setIsEditDialogOpen(false);
  };

  const handleDeleteRoom = async (id: number) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác."
    );
    if (!confirmDelete) return;
    const response = await deleteRoom(id);
    console.log(response);
    if (!response || response.code !== 200) {
      toast.error("Xóa phòng thất bại");
      return;
    }
    toast.success("Xóa phòng thành công");
    setRooms(rooms.filter((room) => room.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý phòng</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách phòng trong tổ chức của bạn
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm phòng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm phòng mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin phòng mới để thêm vào danh sách
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="departmentCode">Mã phòng</Label>
                <Input
                  id="departmentCode"
                  value={newRoom.roomCode}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, roomCode: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Tên phòng</Label>
                <Input
                  id="name"
                  value={newRoom.roomName}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, roomName: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button onClick={handleAddRoom}>Thêm phòng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phòng</CardTitle>
          <CardDescription>
            Danh sách các phòng trong tổ chức của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phòng</TableHead>
                <TableHead>Tên phòng</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.roomCode}</TableCell>
                  <TableCell className="font-medium">{room.roomName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProgressRoom(room);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật phòng </DialogTitle>
            <DialogDescription>
              Nhập thông tin phòng để cập nhật
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="departmentCode">Mã phòng</Label>
              <Input
                id="departmentCode"
                defaultValue={progressRoom.roomCode}
                onChange={(e) =>
                  setNewRoom({
                    ...progressRoom,
                    roomCode: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Tên phòng</Label>
              <Input
                id="name"
                defaultValue={progressRoom.roomName}
                onChange={(e) =>
                  setNewRoom({
                    ...progressRoom,
                    roomName: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={() => progressRoom && handleUpdateRoom(progressRoom.id)}
            >
              Cập nhật phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
