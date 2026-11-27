import React from "react";

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  unit?: string;
  meter?: React.ReactNode;
}

export function Metric({
  label,
  value,
  unit,
  meter,
  className = "",
  ...props
}: MetricProps) {
  return (
    <div className={`metric ${className}`.trim()} {...props}>
      <span className="metric__label">{label}</span>
      <span className="metric__figure">
        <span className="metric__value">{value}</span>
        {unit && <span className="metric__unit">{unit}</span>}
      </span>
      {meter}
    </div>
  );
}
