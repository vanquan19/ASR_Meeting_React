"use client";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createDepartment,
  getAllDepartments,
} from "../../services/departmentService";
import { DepartmentType } from "../../interface/department";
import {
  createUser,
  deleteUser,
  getAllUsers,
  updateUser,
} from "../../services/userService";
import { UserType } from "../../interface/auth";
import { toast } from "react-toastify";

const degrees = [
  { code: "BACHELOR", name: "Cử nhân" },
  { code: "MASTER", name: "Thạc sĩ" },
  { code: "DOCTORATE", name: "Tiến sĩ" },
  { code: "ASSOCIATE_PROFESSOR", name: "Cao đẳng" },
  { code: "PROFESSOR", name: "Giáo sư" },
  { code: "OTHER", name: "Khác" },
];
const positions = [
  {
    code: "ROLE_ADMIN",
    name: "Quản trị viên",
  },
  {
    code: "ROLE_USER",
    name: "Người dùng",
  },
  {
    code: "ROLE_SECRETARY",
    name: "Thư ký",
  },
];

export default function AccountsPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    employeeCode: "",
    name: "",
    email: "",
    dob: "",
    degree: "",
    department: "",
    position: "",
  });
  const [progressUser, setProgressUser] = useState<UserType>({} as UserType);
  const [newDepartment, setNewDepartment] = useState<DepartmentType>(
    {} as DepartmentType
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableDegrees, setAvailableDegrees] = useState(degrees);
  const [availableDepartments, setAvailableDepartments] = useState<
    DepartmentType[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availablePositions, setAvailablePositions] = useState(positions);

  useEffect(() => {
    const fetchDpt = async () => {
      const departments = await getAllDepartments();
      setAvailableDepartments(departments.result);
    };
    fetchDpt();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      // Fetch users from API
      const response = await getAllUsers();
      console.log(response);
      if (response.code !== 200) {
        alert("Lấy danh sách người dùng thất bại");
        return;
      }
      setUsers(response.result);
    };
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    const userToAdd = {
      employeeCode: newUser.employeeCode,
      name: newUser.name,
      email: newUser.email,
      departmentId: newUser.department,
      role: newUser.position,
      dob: newUser.dob,
      degree: newUser.degree,
    };

    const respone = await createUser(userToAdd);

    if (respone.code !== 200) {
      toast.error("Thêm người dùng thất bại");
      return;
    }
    setUsers([...users, respone.result]);
    toast.success("Thêm người dùng thành công");

    setNewUser({
      name: "",
      email: "",
      department: "",
      position: "",
      dob: "",
      employeeCode: "",
      degree: "",
    });
    setIsAddUserDialogOpen(false);
  };

  const handleEditUser = async (id: number) => {
    const userToEdit = {
      employeeCode: newUser.employeeCode,
      name: newUser.name,
      email: newUser.email,
      departmentId: newUser.department,
      role: newUser.position,
      dob: newUser.dob,
      degree: newUser.degree,
    };
    const respone = await updateUser(id, userToEdit);
    if (respone.code !== 200) {
      toast.error("Chỉnh sửa người dùng thất bại");
      return;
    }
    setUsers(
      users.map((user) => {
        if (user.id === id) {
          return {
            ...user,
            ...userToEdit,
          };
        }
        return user;
      })
    );
    toast.success("Chỉnh sửa người dùng thành công");
    setNewUser({
      name: "",
      email: "",
      department: "",
      position: "",
      dob: "",
      employeeCode: "",
      degree: "",
    });
    setIsEditUserDialogOpen(false);
  };

  const handleAddDepartment = async () => {
    if (newDepartment && !availableDepartments.includes(newDepartment)) {
      const respone = await createDepartment({
        departmentCode: newDepartment.departmentCode,
        name: newDepartment.name,
      });
      if (respone.code !== 200) {
        toast.error("Thêm phòng ban thất bại");
        return;
      }
      toast.success("Thêm phòng ban thành công");
      setAvailableDepartments([...availableDepartments, newDepartment]);
      setNewDepartment({} as DepartmentType);
      setIsDepartmentDialogOpen(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    // Call API to delete user
    const agree = confirm(
      "Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác."
    );
    if (!agree) {
      toast.info("Hủy bỏ xóa người dùng");
      return;
    }
    const response = await deleteUser(id);
    if (response.code !== 204) {
      toast.error("Xóa người dùng thất bại");
      return;
    }
    toast.success("Xóa người dùng thành công");
    setUsers(users.filter((user) => user.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản lý tài khoản
          </h1>
          <p className="text-muted-foreground">
            Quản lý người dùng và quyền truy cập trong tổ chức của bạn
          </p>
        </div>
        <Dialog
          open={isAddUserDialogOpen}
          onOpenChange={setIsAddUserDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm tài khoản
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Thêm mới tài khoản</DialogTitle>
              <DialogDescription>
                Nhập thông tin tài khoản mới
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Mã nhân viên</Label>
                <Input
                  id="employeeCode"
                  value={newUser.employeeCode}
                  onChange={(e) =>
                    setNewUser({ ...newUser, employeeCode: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Họ tên</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dob">Ngày sinh</Label>
                <Input
                  id="dob"
                  type="date"
                  value={newUser.dob}
                  onChange={(e) =>
                    setNewUser({ ...newUser, dob: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="degree">Bằng cấp</Label>
                </div>
                <Select
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, degree: value })
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn bằng cấp" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {availableDegrees.map((deg) => (
                      <SelectItem key={deg.code} value={deg.code}>
                        {deg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="department">Phòng ban</Label>
                  <Dialog
                    open={isDepartmentDialogOpen}
                    onOpenChange={setIsDepartmentDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Thêm phòng ban mới</DialogTitle>
                        <DialogDescription>
                          Nhập tên phòng ban mới
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="departmentCode">Mã phòng ban</Label>
                          <Input
                            id="departmentCode"
                            value={newDepartment.departmentCode}
                            onChange={(e) =>
                              setNewDepartment({
                                ...newDepartment,
                                departmentCode: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="departmentName">Tên phòng ban</Label>
                          <Input
                            id="departmentName"
                            value={newDepartment.name}
                            onChange={(e) =>
                              setNewDepartment({
                                ...newDepartment,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDepartmentDialogOpen(false)}
                        >
                          Hủy bỏ
                        </Button>
                        <Button onClick={handleAddDepartment}>Thêm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, department: value })
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {availableDepartments.map((dept) => (
                      <SelectItem
                        key={dept.departmentCode}
                        value={dept.id + ""}
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="position">Chức vụ</Label>
                </div>
                <Select
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, position: value })
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {availablePositions.map((pos) => (
                      <SelectItem key={pos.code} value={pos.code}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddUserDialogOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button onClick={handleAddUser}>Thêm tài khoản</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Danh sách người dùng trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MNV</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày sinh</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Bằng cấp</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.employeeCode}
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.dob}</TableCell>
                  <TableCell>{user.department?.name || "N/A"}</TableCell>
                  <TableCell>
                    {positions.find((pos) => pos.code === user.role)?.name ||
                      "N/A"}
                  </TableCell>
                  <TableCell>{user.degree}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNewUser({
                            employeeCode: user.employeeCode,
                            name: user.name,
                            email: user.email,
                            dob: user.dob,
                            degree: user.degree,
                            department: user.department?.id + "",
                            position: user.role,
                          });
                          setProgressUser(user);
                          setIsEditUserDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
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
      <Dialog
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin người dùng
            </DialogDescription>
          </DialogHeader>
          {/* Add form fields for editing user information */}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Họ tên</Label>
              <Input
                id="name"
                defaultValue={newUser.name}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={newUser.email}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    email: e.target.value,
                  })
                }
              />
            </div>
            {/* Add other fields as necessary */}
            <div className="grid gap-2">
              <Label htmlFor="dob">Ngày sinh</Label>
              <Input
                id="dob"
                type="date"
                value={newUser.dob}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    dob: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degree">Bằng cấp</Label>
              <Select
                defaultValue={newUser.degree}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, degree: value })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chọn bằng cấp" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {availableDegrees.map((deg) => (
                    <SelectItem key={deg.code} value={deg.code}>
                      {deg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Phòng ban</Label>
              <Select
                defaultValue={newUser.department + ""}
                onValueChange={(value) =>
                  setNewUser({
                    ...newUser,
                    department: value,
                  })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept.departmentCode} value={dept.id + ""}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Chức vụ</Label>
              <Select
                defaultValue={newUser.position}
                onValueChange={(value) =>
                  setNewUser({
                    ...newUser,
                    position: value,
                  })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chọn chức vụ" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {availablePositions.map((pos) => (
                    <SelectItem key={pos.code} value={pos.code}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button onClick={() => handleEditUser(progressUser.id)}>
              Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
