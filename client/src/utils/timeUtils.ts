export const getLocalOffsetMinutes = (): number => -new Date().getTimezoneOffset();

const normalizeTime = (timeValue: string): string => {
  const [hhRaw, mmRaw] = timeValue.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return timeValue;
  const safeHh = ((hh % 24) + 24) % 24;
  const safeMm = ((mm % 60) + 60) % 60;
  return `${String(safeHh).padStart(2, '0')}:${String(safeMm).padStart(2, '0')}`;
};

export const toUtcTime = (localTime: string, _dateInput?: string): string => normalizeTime(localTime);

export const toLocalTime = (utcTime: string, _dateInput?: string): string => {
  return normalizeTime(utcTime);
};
