"use client";

import { useState } from "react";
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

// Mock data
const initialRooms = [
  {
    id: 1,
    name: "Conference Room A",
    capacity: 20,
    department: "Marketing",
    equipment: "Projector, Whiteboard",
  },
  {
    id: 2,
    name: "Meeting Room B",
    capacity: 10,
    department: "Engineering",
    equipment: "TV, Whiteboard",
  },
  {
    id: 3,
    name: "Board Room",
    capacity: 15,
    department: "Executive",
    equipment: "Video Conference, Whiteboard",
  },
];

const departments = ["Marketing", "Engineering", "Executive", "HR", "Finance"];

export default function RoomsPage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    capacity: "",
    department: "",
    equipment: "",
  });
  const [newDepartment, setNewDepartment] = useState("");
  const [availableDepartments, setAvailableDepartments] = useState(departments);

  const handleAddRoom = () => {
    const roomToAdd = {
      id: rooms.length + 1,
      name: newRoom.name,
      capacity: Number.parseInt(newRoom.capacity),
      department: newRoom.department,
      equipment: newRoom.equipment,
    };
    setRooms([...rooms, roomToAdd]);
    setNewRoom({ name: "", capacity: "", department: "", equipment: "" });
    setIsAddDialogOpen(false);
  };

  const handleAddDepartment = () => {
    if (newDepartment && !availableDepartments.includes(newDepartment)) {
      setAvailableDepartments([...availableDepartments, newDepartment]);
      setNewDepartment("");
      setIsDepartmentDialogOpen(false);
    }
  };

  const handleDeleteRoom = (id: number) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Rooms</h1>
          <p className="text-muted-foreground">
            Manage your organization's meeting rooms
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Meeting Room</DialogTitle>
              <DialogDescription>
                Enter the details for the new meeting room
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newRoom.capacity}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, capacity: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="department">Department</Label>
                  <Dialog
                    open={isDepartmentDialogOpen}
                    onOpenChange={setIsDepartmentDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-3 w-3" />
                        Add Department
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Department</DialogTitle>
                        <DialogDescription>
                          Enter the name of the new department
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="departmentName">
                            Department Name
                          </Label>
                          <Input
                            id="departmentName"
                            value={newDepartment}
                            onChange={(e) => setNewDepartment(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDepartmentDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddDepartment}>Add</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  onValueChange={(value) =>
                    setNewRoom({ ...newRoom, department: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="equipment">Equipment</Label>
                <Input
                  id="equipment"
                  value={newRoom.equipment}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, equipment: e.target.value })
                  }
                  placeholder="Projector, Whiteboard, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddRoom}>Add Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Meeting Rooms</CardTitle>
          <CardDescription>
            A list of all meeting rooms in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.department}</TableCell>
                  <TableCell>{room.equipment}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
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
    </div>
  );
}
