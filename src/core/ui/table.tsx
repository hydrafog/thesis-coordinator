import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapClassName?: string;
}

export function Table({
  className = "",
  wrapClassName = "",
  children,
  ...props
}: TableProps) {
  return (
    <div className={`table-wrap ${wrapClassName}`.trim()}>
      <table className={`table ${className}`.trim()} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function TableHead({
  className = "",
  numeric = false,
  children,
  ...props
}: TableHeadProps) {
  const classes = [numeric ? "num" : "", className].filter(Boolean).join(" ");
  return (
    <th className={classes || undefined} {...props}>
      {children}
    </th>
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function TableCell({
  className = "",
  numeric = false,
  children,
  ...props
}: TableCellProps) {
  const classes = [numeric ? "num" : "", className].filter(Boolean).join(" ");
  return (
    <td className={classes || undefined} {...props}>
      {children}
    </td>
  );
}
