"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

export default function ProfilePage() {
  const { user } = useAuth();
  console.log(user);
  const [profile, setProfile] = useState<UserType>(user as UserType);

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update logic here
    console.log("Profile updated:", profile);
    // In a real app, you would send this data to your backend
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password change logic here
    if (password.new !== password.confirm) {
      alert("New passwords don't match!");
      return;
    }
    console.log("Password changed");
    setPassword({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="space-y-6 ">
      <div className="flex flex-col gap-6 md:flex-row">
        <Card className="w-full md:w-1/3">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Avatar className="size-2/3">
              <AvatarImage src={user?.img || ""} />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-bold uppercase mt-5">
                {profile.name}
              </h3>
              <p className="text-base text-muted-foreground">
                {profile.role === "ROLE_ADMIN"
                  ? "Quản trị viên"
                  : profile.role === "ROLE_EMPLOYEE"
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

                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
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
                        <Label htmlFor="bio">Ngay sinh</Label>
                        <Input
                          id="bio"
                          value={profile.dob}
                          onChange={(e) =>
                            setProfile({ ...profile, dob: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <Button className="mt-4 bg-blue-400 text-white">
                      Cap nhat mat khau
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thay doi mat khau</CardTitle>
                  <CardDescription>
                    Hay cap nhat mat khau cua ban de bao mat tai khoan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">
                          Mat khau hien tai
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
                        <Label htmlFor="new-password">Mat khau moi</Label>
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
                          Xac nhan mat khau moi
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
                      Cap nhat mat khau
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
