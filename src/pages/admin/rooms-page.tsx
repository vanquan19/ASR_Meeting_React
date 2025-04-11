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
import { DepartmentType } from "../../interface/department";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  updateDepartment,
} from "../../services/departmentService";
import { toast } from "react-toastify";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<DepartmentType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    departmentCode: "",
    name: "",
  });
  const [progressDepartment, setProgressDepartment] = useState<DepartmentType>(
    {} as DepartmentType
  );

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getAllDepartments();
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
    const departmentToAdd = {
      departmentCode: newRoom.departmentCode,
      name: newRoom.name,
    };
    const response = await createDepartment(departmentToAdd);
    if (!response || response.code !== 200) {
      throw new Error("Failed to create room");
    }
    setRooms((prev) => [...prev, response.result]);
    toast.success("Thêm phòng ban thành công");
    setNewRoom({ name: "", departmentCode: "" });
    setIsAddDialogOpen(false);
  };

  const handleUpdateRoom = async (id: number) => {
    const departmentToUpdate = {
      departmentCode: newRoom.departmentCode,
      name: newRoom.name,
    };
    const response = await updateDepartment(id, departmentToUpdate);
    console.log(response);
    if (!response || response.code !== 200) {
      throw new Error("Failed to update room");
    }
    setRooms((prev) =>
      prev.map((room) => (room.id === id ? response.result : room))
    );
    toast.success("Cập nhật phòng ban thành công");
    setNewRoom({ name: "", departmentCode: "" });
    setIsEditDialogOpen(false);
  };

  const handleDeleteDepartment = async (id: number) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác."
    );
    if (!confirmDelete) return;
    const response = await deleteDepartment(id);
    console.log(response);
    if (!response || response.code !== 204) {
      toast.error("Xóa phòng ban thất bại");
      return;
    }
    toast.success("Xóa phòng ban thành công");
    setRooms(rooms.filter((room) => room.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản lý phòng ban
          </h1>
          <p className="text-muted-foreground">
            Quản lý danh sách phòng ban trong tổ chức của bạn
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm phòng ban
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm phòng ban mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin phòng ban mới để thêm vào danh sách
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="departmentCode">Mã phòng</Label>
                <Input
                  id="departmentCode"
                  value={newRoom.departmentCode}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, departmentCode: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Tên phòng</Label>
                <Input
                  id="name"
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
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
              <Button onClick={handleAddRoom}>Thêm phòng ban</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phòng ban</CardTitle>
          <CardDescription>
            Danh sách các phòng ban trong tổ chức của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phòng ban</TableHead>
                <TableHead>Tên phòng ban</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">
                    {room.departmentCode}
                  </TableCell>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProgressDepartment(room);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDepartment(room.id)}
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
            <DialogTitle>Cập nhật phòng ban</DialogTitle>
            <DialogDescription>
              Nhập thông tin phòng ban để cập nhật
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="departmentCode">Mã phòng</Label>
              <Input
                id="departmentCode"
                defaultValue={progressDepartment.departmentCode}
                onChange={(e) =>
                  setNewRoom({
                    ...progressDepartment,
                    departmentCode: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Tên phòng</Label>
              <Input
                id="name"
                defaultValue={progressDepartment.name}
                onChange={(e) =>
                  setNewRoom({
                    ...progressDepartment,
                    name: e.target.value,
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
              onClick={() =>
                progressDepartment && handleUpdateRoom(progressDepartment.id)
              }
            >
              Cập nhật phòng ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
