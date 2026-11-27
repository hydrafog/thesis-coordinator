import React from "react";

export interface CapacityBarProps extends React.HTMLAttributes<HTMLDivElement> {
  used: number;
  max: number;
}

export function CapacityBar({
  used,
  max,
  className = "",
  ...props
}: CapacityBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const label = `${used} of ${max} places filled`;

  return (
    <div
      className={`progress ${className}`.trim()}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={used}
      style={{ ["--progress" as string]: `${percent}%` }}
      {...props}
    >
      <span className="progress__fill" />
    </div>
  );
}

export interface PlacesMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  used: number;
  max: number;
}

export function PlacesMeter({
  used,
  max,
  className = "",
  ...props
}: PlacesMeterProps) {
  const label = `${used} of ${max} places filled`;
  const marks = Array.from({ length: max }, (_, index) => index < used);

  return (
    <div
      className={`places ${className}`.trim()}
      role="img"
      aria-label={label}
      {...props}
    >
      {marks.map((filled, idx) => (
        <span key={idx} className="places__mark" data-filled={filled} />
      ))}
    </div>
  );
}
