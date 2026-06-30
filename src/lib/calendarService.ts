export interface BusySlot {
  start: string; // "HH:MM" format, e.g. "11:00"
  end: string;   // "HH:MM" format, e.g. "12:00"
  title: string;
  durationMinutes: number;
}

export interface FreeSlot {
  start: string; // "HH:MM" format, e.g. "09:00"
  end: string;   // "HH:MM" format, e.g. "11:00"
  durationMinutes: number;
  partiallyFree?: boolean;
}

export async function fetchCalendarEvents(accessToken: string) {
  const timeMin = new Date();
  timeMin.setHours(0, 0, 0, 0); // start of today (midnight)

  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + 3); // end of today + 2 days (72 hours)

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin.toISOString()
  )}&timeMax=${encodeURIComponent(
    timeMax.toISOString()
  )}&singleEvents=true&orderBy=startTime&maxResults=20`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google Calendar API failed with status ${response.status}`);
  }

  const data = await response.json();
  const rawEvents = data.items || [];

  // Extract from each event: start.dateTime, end.dateTime, summary
  return rawEvents.map((item: any) => {
    const startIso = item.start?.dateTime || item.start?.date;
    const endIso = item.end?.dateTime || item.end?.date;
    return {
      start: startIso,
      end: endIso,
      summary: item.summary || "Busy Slot",
    };
  });
}

/**
 * Calculates busy slots and free slots for TODAY between 8:00 AM (08:00) and 8:00 PM (20:00).
 */
export function calculateTodaySlots(events: { start: string; end: string; summary: string }[]) {
  const busySlots: BusySlot[] = [];
  const freeSlots: FreeSlot[] = [];

  // Define active range today: 8 AM to 8 PM
  const today = new Date();
  const rangeStart = new Date(today);
  rangeStart.setHours(8, 0, 0, 0);
  const rangeEnd = new Date(today);
  rangeEnd.setHours(20, 0, 0, 0);

  // Convert raw events to Date objects and filter to those overlapping today's 8am-8pm window
  const activeEvents = events
    .map((e) => {
      const startD = new Date(e.start);
      const endD = new Date(e.end);
      return { startD, endD, title: e.summary };
    })
    .filter((e) => {
      // Must not be NaN and must overlap with [8 AM, 8 PM]
      if (isNaN(e.startD.getTime()) || isNaN(e.endD.getTime())) return false;
      return e.startD < rangeEnd && e.endD > rangeStart;
    })
    .sort((a, b) => a.startD.getTime() - b.startD.getTime());

  // Format Helper: HH:MM from Date
  const formatHHMM = (d: Date): string => {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 1. Calculate Busy Slots
  activeEvents.forEach((ev) => {
    // Clamp to range boundaries
    const actualStart = ev.startD < rangeStart ? rangeStart : ev.startD;
    const actualEnd = ev.endD > rangeEnd ? rangeEnd : ev.endD;

    const diffMs = actualEnd.getTime() - actualStart.getTime();
    const durationMinutes = Math.round(diffMs / 60000);

    if (durationMinutes > 0) {
      busySlots.push({
        start: formatHHMM(actualStart),
        end: formatHHMM(actualEnd),
        title: ev.title,
        durationMinutes,
      });
    }
  });

  // Merge overlapping busy slots for computing free slots
  const mergedBusyIntervals: { start: Date; end: Date }[] = [];
  activeEvents.forEach((ev) => {
    const actualStart = ev.startD < rangeStart ? rangeStart : ev.startD;
    const actualEnd = ev.endD > rangeEnd ? rangeEnd : ev.endD;

    if (actualStart >= actualEnd) return;

    if (mergedBusyIntervals.length === 0) {
      mergedBusyIntervals.push({ start: actualStart, end: actualEnd });
    } else {
      const last = mergedBusyIntervals[mergedBusyIntervals.length - 1];
      if (actualStart <= last.end) {
        if (actualEnd > last.end) {
          last.end = actualEnd;
        }
      } else {
        mergedBusyIntervals.push({ start: actualStart, end: actualEnd });
      }
    }
  });

  // 2. Calculate Free Slots (gaps between busy intervals)
  let pointer = new Date(rangeStart);

  mergedBusyIntervals.forEach((busy) => {
    if (busy.start > pointer) {
      const gapMs = busy.start.getTime() - pointer.getTime();
      const gapMin = Math.round(gapMs / 60000);
      if (gapMin >= 30) {
        freeSlots.push({
          start: formatHHMM(pointer),
          end: formatHHMM(busy.start),
          durationMinutes: gapMin,
        });
      }
    }
    if (busy.end > pointer) {
      pointer = busy.end;
    }
  });

  if (pointer < rangeEnd) {
    const gapMs = rangeEnd.getTime() - pointer.getTime();
    const gapMin = Math.round(gapMs / 60000);
    if (gapMin >= 30) {
      freeSlots.push({
        start: formatHHMM(pointer),
        end: formatHHMM(rangeEnd),
        durationMinutes: gapMin,
      });
    }
  }

  return { busySlots, freeSlots };
}

/**
 * Creates a Calendar event (focus block)
 */
export async function createFocusBlockEvent(
  accessToken: string,
  taskName: string,
  startTimeIso: string,
  endTimeIso: string,
  description: string
) {
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  const body = {
    summary: taskName ? `[ResQ] Focus: ${taskName}` : `[ResQ] Focus Block`,
    start: { dateTime: startTimeIso },
    end: { dateTime: endTimeIso },
    description: description,
    colorId: "11", // Red color in Google Calendar
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 5 }],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errMsg = `Status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error && errJson.error.message) {
        errMsg = errJson.error.message;
      } else {
        errMsg = JSON.stringify(errJson);
      }
    } catch (_) {
      if (response.statusText) {
        errMsg = response.statusText;
      }
    }
    throw new Error(`Google Calendar API error: ${errMsg}`);
  }

  return await response.json();
}
