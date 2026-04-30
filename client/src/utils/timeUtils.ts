export const getLocalOffsetMinutes = (): number => -new Date().getTimezoneOffset();

const getOffsetMinutesForDate = (dateInput: string): number => {
  const date = new Date(`${dateInput}T00:00:00`);
  return -date.getTimezoneOffset();
};

export const toLocalTime = (utcTime: string, dateInput?: string): string => {
  if (!utcTime) return utcTime;
  const [hhRaw, mmRaw] = utcTime.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return utcTime;
  const offsetMinutes = dateInput ? getOffsetMinutesForDate(dateInput) : getLocalOffsetMinutes();
  const totalMinutes = (hh * 60 + mm) + offsetMinutes;
  const localHh = ((totalMinutes / 60 | 0) + 24) % 24;
  const localMm = ((totalMinutes % 60) + 60) % 60;
  return `${String(localHh).padStart(2, '0')}:${String(localMm).padStart(2, '0')}`;
};

export const toUtcTime = (localTime: string, dateInput?: string): string => {
  if (!localTime) return localTime;
  const [hhRaw, mmRaw] = localTime.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return localTime;
  const offsetMinutes = dateInput ? getOffsetMinutesForDate(dateInput) : getLocalOffsetMinutes();
  const totalMinutes = (hh * 60 + mm) - offsetMinutes;
  const utcHh = ((totalMinutes / 60 | 0) + 24) % 24;
  const utcMm = ((totalMinutes % 60) + 60) % 60;
  return `${String(utcHh).padStart(2, '0')}:${String(utcMm).padStart(2, '0')}`;
};

export const toUtcDateTime = (
  localTime: string,
  localDate: string,
): { date: string; time: string } => {
  const [hhRaw, mmRaw] = localTime.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return { date: localDate, time: localTime };

  const offsetMinutes = getOffsetMinutesForDate(localDate);
  const totalMinutes = (hh * 60 + mm) - offsetMinutes;

  // how many days did we shift?
  const dayShift = Math.floor(totalMinutes / (24 * 60));
  const utcHh = ((totalMinutes / 60 | 0) % 24 + 24) % 24;
  const utcMm = ((totalMinutes % 60) + 60) % 60;

  const utcTime = `${String(utcHh).padStart(2, '0')}:${String(utcMm).padStart(2, '0')}`;

  if (dayShift === 0) return { date: localDate, time: utcTime };

  // shift the date by however many days wrapped
  const d = new Date(`${localDate}T00:00:00`);
  d.setDate(d.getDate() + dayShift);
  const utcDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { date: utcDate, time: utcTime };
};

export const toLocalDateTime = (
  utcTime: string,
  utcDate: string,
): { date: string; time: string } => {
  const [hhRaw, mmRaw] = utcTime.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return { date: utcDate, time: utcTime };

  const offsetMinutes = getOffsetMinutesForDate(utcDate);
  const totalMinutes = (hh * 60 + mm) + offsetMinutes;

  const dayShift = Math.floor(totalMinutes / (24 * 60));
  const localHh = ((totalMinutes / 60 | 0) % 24 + 24) % 24;
  const localMm = ((totalMinutes % 60) + 60) % 60;
  const localTime = `${String(localHh).padStart(2, '0')}:${String(localMm).padStart(2, '0')}`;

  if (dayShift === 0) return { date: utcDate, time: localTime };

  const d = new Date(`${utcDate}T00:00:00`);
  d.setDate(d.getDate() + dayShift);
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { date: localDate, time: localTime };
};
