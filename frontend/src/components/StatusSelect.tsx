"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Status, statusLabels, statusOrder } from "@/lib/types";

interface StatusSelectProps {
  value: Status;
  onChange: (status: Status) => void;
  disabled?: boolean;
  className?: string;
}

export function StatusSelect({ value, onChange, disabled, className }: StatusSelectProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as Status)}
      disabled={disabled}
    >
      <SelectTrigger className={className} aria-label="Status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOrder.map((s) => (
          <SelectItem key={s} value={String(s)}>
            {statusLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
