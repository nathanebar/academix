// Pure helpers of DayCalendar (split out of DayCalendar.tsx, issue #102).
import dayjs from "dayjs";
import { FlatTask, GroupedTask, TeamMembers } from "../../../../types/types";
import { palette } from "../../../../theme/tokens";

export function is21to20NextDay(str: string) {
  // Parsing: "26_2026-05-10T21:00:00Z_2026-05-11T20:00:00Z"
  const parts = str.split("_");

  if (parts.length < 3) return false;

  const startDate = new Date(parts[1]);
  const endDate = new Date(parts[2]);

  const startHour = startDate.getUTCHours();
  const endHour = endDate.getUTCHours();

  return startHour === 21 && endHour === 18;
}

export const isAllDay = (start: string, end: string) => {
  const startHour = dayjs(start).hour();
  const endHour = dayjs(end).hour();

  return startHour === 0 && endHour === 21;
};

/** End date sent to the API when an event is moved or resized. */
export const calcEnd = (event: any) => {
  // אירוע all-day → מסתיים ב-21:00
  if (event.allDay) {
    return dayjs(event.start).add(21, "hour").toDate();
  }
  // אירוע "21 עד 20" (למחרת) → מסתיים ב-+1 שעה
  if (is21to20NextDay(event.id)) {
    return dayjs(event.start).add(1, "hour").toDate();
  }
  // הכלל החשוב חדש: end ריק (NULL) → ברירת מחדל של שעה
  if (!event.end) {
    return dayjs(event.start).add(1, "hour").toDate();
  }
  return event.end;
};

/** Day tasks from the API -> FullCalendar events (team view: grouped rows, member view: flat rows). */
export function toCalendarEvents(
  tasksData: any[],
  tasksByUser: Array<unknown> | undefined,
  activeHeaderType: string | null | undefined,
  student: TeamMembers | undefined
): any[] {
  const transformedEvents: any[] = tasksData.flatMap((task: any) => {
    if (
      tasksByUser &&
      (!tasksByUser?.find((taskByUser: any) => {
        return parseInt(taskByUser.Task.id) == parseInt(task.task_id);
      }) ||
        task.items?.find((item: any) => item.source !== "assignment"))
    ) {
      return;
    }
    if (activeHeaderType !== "teamMember") {
      const g = task.Task || (task as GroupedTask);
      const eventId = g.id;
      const startISO = dayjs(g.start).toISOString();
      const endISO = dayjs(g.end).toISOString();

      return {
        id: eventId,
        title: g.name,
        student_id: student?.id,
        start: startISO,
        end: endISO,
        allDay: isAllDay(startISO, endISO),
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: palette.black,
        extendedProps: {
          groupName: g.gn,
          taskColor: g.tcolor,
          axisColor: g.color,
          task_id: g.task_id,
          source: "mixed",
          items: g.items,
        },
      };
    }

    /* -------------------------------------------------
       2️⃣  אם זה תוצאה שטוחה (assignedUserDay) – כל שורה הופכת לאירוע
       ------------------------------------------------- */
    const f = task as FlatTask;

    const startISO = dayjs(f.most_frequent_assigned_at_start).toISOString();
    const endISO = dayjs(f.most_frequent_assigned_at_end).toISOString();

    return {
      id: f.id, // מזהה יחודי של assignment / occurrence
      title: f.name,
      start: startISO,
      end: endISO,
      student_id: student?.id,
      allDay: isAllDay(startISO, endISO),
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: palette.black,
      extendedProps: {
        groupName: f.gn,
        taskColor: f.tcolor,
        axisColor: f.color,
        source: f.source,
        task_assignment_id: f?.taskassignmentid,
        occurrence_id: f?.occurrence_id,
      },
    };
  });
  return transformedEvents.filter((event) => event);
}
