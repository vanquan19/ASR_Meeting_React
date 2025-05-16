import type React from "react";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { useAuth } from "../../context/AuthContext";
import { UserType } from "../../interface/auth";
import { Camera } from "lucide-react";
import { changePassword, updateMyInfo } from "../../services/userService";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState<UserType>(user as UserType);

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    // setUser is already destructured at the top level
    e.preventDefault();
    // Handle profile update logic here
    const confirm = window.confirm(
      "Bạn có chắc chắn muốn cập nhật thông tin cá nhân không?"
    );
    if (!confirm) return;

    const response = await updateMyInfo({
      name: profile.name,
      dob: profile.dob,
      phoneNumber: profile.phoneNumber,
      identification: profile.identification,
      address: profile.address,
      bankName: profile.bankName,
      bankNumber: profile.bankNumber,
      email: profile.email,
    });
    console.log(response);
    if (response.code !== 200) {
      toast.error("Cập nhật thông tin không thành công");
      return;
    }
    setUser({ ...user, ...profile });
    localStorage.setItem("user", JSON.stringify({ ...user, ...profile }));
    toast.success("Cập nhật thông tin thành công");
    setProfile({ ...profile });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password change logic here
    if (password.new !== password.confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    const response = await changePassword({
      oldPassword: password.current,
      newPassword: password.new,
    });
    console.log(response);
    if (response.code !== 200) {
      toast.error("Cập nhật mật khẩu không thành công");
      return;
    }
    toast.success("Cập nhật mật khẩu thành công");
    setPassword({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="space-y-6 md:pb-0 pb-20">
      <div className="flex flex-col gap-6 md:flex-row h-fit">
        <Card className="w-full  md:w-1/3">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <div className="flex justify-center items-center">
              <label
                htmlFor="avatar-upload"
                className="md:cursor-pointer relative w-40 h-40"
              >
                <Avatar className="size-full ">
                  <AvatarImage src={profile?.img || ""} />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Camera className="absolute bottom-0 right-0 -translate-x-6 text-blue-600 bg-white rounded-full p-1 size-7" />
              </label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="avatar-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      setProfile({ ...profile, img: reader.result as string });
                      // Call API to upload image
                      updateMyInfo({
                        ...user,
                        img: base64String,
                      }).then((response) => {
                        if (response.code !== 200) {
                          toast.error("Cập nhật ảnh đại diện không thành công");
                          return;
                        }
                        setUser(response.result);
                        localStorage.setItem(
                          "user",
                          JSON.stringify({ ...user, img: base64String })
                        );
                        toast.success("Cập nhật ảnh đại diện thành công");
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold uppercase mt-5">
                {profile.name}
              </h3>
              <p className="text-base text-muted-foreground">
                {profile.role === "ROLE_ADMIN"
                  ? "Quản trị viên"
                  : profile.role === "ROLE_USER"
                  ? "Nhân viên"
                  : "Thư ký"}{" "}
                {profile.department && " tại " + profile.department?.name}
              </p>
            </div>
            <div className="text-left w-full flex flex-col gap-2">
              <div className="flex gap-2">
                <h3 className="text-base font-medium">MNV:</h3>
                <p className="text-base text-muted-foreground">
                  {profile.employeeCode}
                </p>
              </div>
              <div className="flex gap-2">
                <h3 className="text-base font-medium">Email:</h3>
                <p className="text-base text-muted-foreground">
                  {profile.email}
                </p>
              </div>
              <div className="flex gap-2">
                <h3 className="text-base font-medium">SĐT:</h3>
                <p className="text-base text-muted-foreground">
                  {profile.phoneNumber || "Chưa cập nhật"}
                </p>
              </div>
              <div className="flex gap-2">
                <h3 className="text-base font-medium">Ngày sinh:</h3>
                <p className="text-base text-muted-foreground">
                  {profile.dob || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            {/* <Button variant="outline" className="w-full">
              
            </Button> */}
          </CardContent>
        </Card>

        <div className="flex-1">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Hồ sơ</TabsTrigger>
              <TabsTrigger value="password">Mật khẩu</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thay đổi thông tin cá nhân</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) =>
                            setProfile({ ...profile, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="grid gap-2 w-full">
                          <Label htmlFor="phone">Số điện thoại</Label>
                          <Input
                            id="phone"
                            value={profile.phoneNumber}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                phoneNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dob">Ngày sinh</Label>
                          <Input
                            id="dob"
                            value={profile.dob}
                            type="date"
                            className="w-full"
                            onChange={(e) =>
                              setProfile({ ...profile, dob: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="addrss">Địa chỉ</Label>
                        <Input
                          id="addrss"
                          value={profile.address}
                          onChange={(e) =>
                            setProfile({ ...profile, address: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="identification">CCCD/Hộ chiếu</Label>
                        <Input
                          id="identification"
                          value={profile.identification}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              identification: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="grid gap-2 w-full">
                          <Label htmlFor="bankName">Ngân hàng</Label>
                          <Input
                            id="bankName"
                            value={profile.bankName}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                bankName: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2 w-full">
                          <Label htmlFor="bankNumber">Số tài khoản</Label>
                          <Input
                            id="bankNumber"
                            value={profile.bankNumber}
                            type="text"
                            className="w-full"
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                bankNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <Button className="mt-4 bg-blue-400 text-white">
                      Cập nhật thông tin
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thay đổi mật khẩu</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">
                          Mật khẩu hiện tại
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={password.current}
                          onChange={(e) =>
                            setPassword({
                              ...password,
                              current: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">Mật khẩu mới</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={password.new}
                          onChange={(e) =>
                            setPassword({ ...password, new: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">
                          Xác nhận mật khẩu
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={password.confirm}
                          onChange={(e) =>
                            setPassword({
                              ...password,
                              confirm: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <Button className="mt-4 bg-blue-400 text-white">
                      Cập nhật mật khẩu
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
