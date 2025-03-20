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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Badge } from "../../components/ui/badge";

// Mock data
const initialMeetings = [
  {
    id: 1,
    title: "Quarterly Review",
    room: "Conference Room A",
    date: "2023-06-15",
    startTime: "10:00",
    endTime: "11:30",
    department: "Marketing",
    organizer: "John Doe",
    status: "upcoming",
    participants: [
      { id: 1, name: "John Doe", role: "Organizer" },
      { id: 2, name: "Jane Smith", role: "Presenter" },
      { id: 3, name: "Robert Johnson", role: "Participant" },
    ],
  },
  {
    id: 2,
    title: "Project Kickoff",
    room: "Meeting Room B",
    date: "2023-06-16",
    startTime: "14:00",
    endTime: "15:00",
    department: "Engineering",
    organizer: "Jane Smith",
    status: "upcoming",
    participants: [
      { id: 2, name: "Jane Smith", role: "Organizer" },
      { id: 3, name: "Robert Johnson", role: "Participant" },
    ],
  },
  {
    id: 3,
    title: "Team Sync",
    room: "Board Room",
    date: "2023-06-10",
    startTime: "09:00",
    endTime: "10:00",
    department: "HR",
    organizer: "Robert Johnson",
    status: "completed",
    participants: [
      { id: 3, name: "Robert Johnson", role: "Organizer" },
      { id: 1, name: "John Doe", role: "Participant" },
      { id: 2, name: "Jane Smith", role: "Participant" },
    ],
  },
];

const rooms = [
  "Conference Room A",
  "Meeting Room B",
  "Board Room",
  "Training Room",
];

const users = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Robert Johnson" },
  { id: 4, name: "Emily Davis" },
  { id: 5, name: "Michael Wilson" },
];

const roles = [
  "Organizer",
  "Presenter",
  "Participant",
  "Observer",
  "Note Taker",
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isAddMeetingDialogOpen, setIsAddMeetingDialogOpen] = useState(false);
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] =
    useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    department: "",
    description: "",
    participants: [] as { id: number; name: string; role: string }[],
  });
  const [newParticipant, setNewParticipant] = useState({
    id: 0,
    name: "",
    role: "",
  });

  const handleAddMeeting = () => {
    const meetingToAdd = {
      id: meetings.length + 1,
      title: newMeeting.title,
      room: newMeeting.room,
      date: newMeeting.date,
      startTime: newMeeting.startTime,
      endTime: newMeeting.endTime,
      department: newMeeting.department,
      organizer: "John Doe", // Current user
      status: "upcoming",
      participants: [
        { id: 1, name: "John Doe", role: "Organizer" },
        ...newMeeting.participants,
      ],
    };
    setMeetings([...meetings, meetingToAdd]);
    setNewMeeting({
      title: "",
      room: "",
      date: "",
      startTime: "",
      endTime: "",
      department: "",
      description: "",
      participants: [],
    });
    setIsAddMeetingDialogOpen(false);
  };

  const handleAddParticipant = () => {
    if (newParticipant.id && newParticipant.role) {
      const selectedUser = users.find((u) => u.id === newParticipant.id);
      if (selectedUser) {
        const participantToAdd = {
          id: selectedUser.id,
          name: selectedUser.name,
          role: newParticipant.role,
        };
        setNewMeeting({
          ...newMeeting,
          participants: [...newMeeting.participants, participantToAdd],
        });
        setNewParticipant({ id: 0, name: "", role: "" });
      }
    }
  };

  const handleRemoveParticipant = (id: number) => {
    setNewMeeting({
      ...newMeeting,
      participants: newMeeting.participants.filter((p) => p.id !== id),
    });
  };

  const handleDeleteMeeting = (id: number) => {
    setMeetings(meetings.filter((meeting) => meeting.id !== id));
  };

  const openParticipantsDialog = (meetingId: number) => {
    setSelectedMeeting(meetingId);
    setIsParticipantsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Schedule and manage your meetings
          </p>
        </div>
        <Dialog
          open={isAddMeetingDialogOpen}
          onOpenChange={setIsAddMeetingDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Enter the details for the new meeting
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={newMeeting.title}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="room">Meeting Room</Label>
                  <Select
                    onValueChange={(value) =>
                      setNewMeeting({ ...newMeeting, room: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    onValueChange={(value) =>
                      setNewMeeting({ ...newMeeting, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, date: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newMeeting.startTime}
                    onChange={(e) =>
                      setNewMeeting({
                        ...newMeeting,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newMeeting.endTime}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMeeting.description}
                  onChange={(e) =>
                    setNewMeeting({
                      ...newMeeting,
                      description: e.target.value,
                    })
                  }
                  placeholder="Meeting agenda and details"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Participants</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) =>
                        setNewParticipant({
                          ...newParticipant,
                          id: Number.parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(
                            (user) =>
                              !newMeeting.participants.some(
                                (p) => p.id === user.id
                              ) && user.id !== 1 // Exclude current user
                          )
                          .map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id.toString()}
                            >
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(value) =>
                        setNewParticipant({
                          ...newParticipant,
                          role: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter((role) => role !== "Organizer") // Exclude organizer role
                          .map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddParticipant}
                      disabled={!newParticipant.id || !newParticipant.role}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className="mt-2 rounded-md border p-2">
                  <div className="mb-2 font-medium">Current Participants:</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md bg-muted p-2">
                      <div className="flex items-center gap-2">
                        <span>John Doe</span>
                        <Badge>Organizer</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        (You)
                      </span>
                    </div>
                    {newMeeting.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between rounded-md bg-muted p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{participant.name}</span>
                          <Badge>{participant.role}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveParticipant(participant.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddMeetingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddMeeting}>Schedule Meeting</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>
                Meetings scheduled for the future
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings
                    .filter((meeting) => meeting.status === "upcoming")
                    .map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium">
                          {meeting.title}
                        </TableCell>
                        <TableCell>{meeting.room}</TableCell>
                        <TableCell>{meeting.date}</TableCell>
                        <TableCell>
                          {meeting.startTime} - {meeting.endTime}
                        </TableCell>
                        <TableCell>{meeting.department}</TableCell>
                        <TableCell>{meeting.organizer}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openParticipantsDialog(meeting.id)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMeeting(meeting.id)}
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
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Meetings</CardTitle>
              <CardDescription>
                Meetings that have already taken place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings
                    .filter((meeting) => meeting.status === "completed")
                    .map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium">
                          {meeting.title}
                        </TableCell>
                        <TableCell>{meeting.room}</TableCell>
                        <TableCell>{meeting.date}</TableCell>
                        <TableCell>
                          {meeting.startTime} - {meeting.endTime}
                        </TableCell>
                        <TableCell>{meeting.department}</TableCell>
                        <TableCell>{meeting.organizer}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openParticipantsDialog(meeting.id)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMeeting(meeting.id)}
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
        </TabsContent>
      </Tabs>

      <Dialog
        open={isParticipantsDialogOpen}
        onOpenChange={setIsParticipantsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meeting Participants</DialogTitle>
            <DialogDescription>
              View and manage meeting participants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMeeting !== null && (
              <div className="space-y-2">
                {meetings
                  .find((m) => m.id === selectedMeeting)
                  ?.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between rounded-md bg-muted p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span>{participant.name}</span>
                        <Badge>{participant.role}</Badge>
                      </div>
                      {participant.role !== "Organizer" && (
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsParticipantsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
