import { themeConfig } from "@/config";

const pad = (n: number) => String(n).padStart(2, "0");

export function shortDate(date: Date): string {
  return `${pad(date.getMonth() + 1)}${themeConfig.date.separator}${pad(date.getDate())}`;
}

export function fullDate(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join(themeConfig.date.separator);
}
