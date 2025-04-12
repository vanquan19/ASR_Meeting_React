import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCalendar } from "../services/calendar";
import { MeetingType } from "../interface/meeting";

interface DayMeetings {
  [day: string]: MeetingType[];
}

interface WeekMeetings {
  [week: string]: DayMeetings;
}

interface CalendarData {
  meetingsByWeek: WeekMeetings;
}

export default function Calendar() {
  const [data, setData] = useState<CalendarData>();
  const [currentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    const getData = async () => {
      const response = await getCalendar(currentMonth + 1, currentYear);
      setData(response);
    };
    getData();
  }, [currentMonth, currentYear]);

  // Days of the week in the order they appear in the data
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Get the weeks from the data
  const weeks = Object.keys(data?.meetingsByWeek || {});

  // Format month and year for display
  const monthYearDisplay = new Date(
    currentYear,
    currentMonth
  ).toLocaleDateString("vn-US", {
    month: "long",
    year: "numeric",
  });

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Check if a day is today
  const isToday = (weekIndex: number, dayIndex: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthYear =
      today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    // Calculate the day number for this cell
    const dayNumber = getDayNumber(weekIndex, dayIndex);

    // Check if this cell represents today's date
    return dayNumber === currentDay && currentMonthYear;
  };

  // Get the day number for display (simplified approach)
  const getDayNumber = (weekIndex: number, dayIndex: number) => {
    // This is a simplified approach - in a real app, you'd calculate the actual date
    // based on the current month, year, and the week/day position
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Adjust for Monday as first day of week (0 = Monday, 6 = Sunday)
    let firstDayOffset = firstDayOfMonth.getDay() - 1;
    if (firstDayOffset < 0) firstDayOffset = 6; // Sunday becomes 6

    // Calculate the day number
    const dayNumber = weekIndex * 7 + dayIndex + 1 - firstDayOffset;

    // Check if the day is within the current month
    if (
      dayNumber < 1 ||
      dayNumber > new Date(currentYear, currentMonth + 1, 0).getDate()
    ) {
      return null; // Day is not in the current month
    }

    return dayNumber;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="overflow-hidden">
        {/* Calendar Header */}
        <div className=" p-4 flex items-center justify-between border-b">
          <h1 className="text-xl font-semibold text-gray-800 first-letter:uppercase">
            {monthYearDisplay}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Hôm nay
            </button>
            <div className="flex">
              <button
                onClick={goToPreviousMonth}
                className="p-1 rounded-l-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1 rounded-r-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white p-4">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center py-2 text-sm font-medium text-gray-500"
              >
                {(() => {
                  switch (day) {
                    case "Monday":
                      return "Thứ 2";
                    case "Tuesday":
                      return "Thứ 3";
                    case "Wednesday":
                      return "Thứ 4";
                    case "Thursday":
                      return "Thứ 5";
                    case "Friday":
                      return "Thứ 6";
                    case "Saturday":
                      return "Thứ 7";
                    case "Sunday":
                      return "Chủ nhật";
                    default:
                      return day;
                  }
                })()}
              </div>
            ))}
          </div>

          {/* Calendar Weeks and Days */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={week} className="grid grid-cols-7 gap-1">
                {daysOfWeek.map((day, dayIndex) => {
                  const meetings = data?.meetingsByWeek[week][day];
                  const dayNumber = getDayNumber(weekIndex, dayIndex);
                  const isCurrentDay = isToday(weekIndex, dayIndex);

                  return (
                    <div
                      key={`${week}-${day}`}
                      className={`
                        h-28 p-2 border border-gray-100 relative
                        ${dayNumber ? "bg-white" : "bg-gray-50"}
                        ${isCurrentDay ? "bg-blue-50" : ""}
                      `}
                    >
                      {dayNumber && (
                        <>
                          <div
                            className={`
                              absolute top-1 left-1 w-6 h-6 flex items-center justify-center text-sm
                              ${
                                isCurrentDay
                                  ? "bg-blue-500 text-white rounded-full"
                                  : "text-gray-700"
                              }
                            `}
                          >
                            {dayNumber}
                          </div>

                          {/* Meetings for this day */}
                          <div className="mt-6 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)]">
                            {meetings?.map((meeting, index) => (
                              <div
                                key={index}
                                className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                              >
                                {meeting.name || "Untitled Meeting"}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
