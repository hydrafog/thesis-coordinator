import React from "react";

export interface DateChipProps extends React.TimeHTMLAttributes<HTMLTimeElement> {
  date: string | Date;
}

export function DateChip({ date, className = "", ...props }: DateChipProps) {
  const d = typeof date === "string" ? new Date(date) : date;
  const isoDay = typeof date === "string" ? date : d.toISOString().slice(0, 10);

  const dayNumber = isNaN(d.getTime())
    ? "--"
    : d.getDate().toString().padStart(2, "0");
  const monthShort = isNaN(d.getTime())
    ? "---"
    : d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  return (
    <time
      className={`date-chip ${className}`.trim()}
      dateTime={isoDay}
      {...props}
    >
      <span className="date-chip__day num">{dayNumber}</span>
      <span className="date-chip__month">{monthShort}</span>
    </time>
  );
}
