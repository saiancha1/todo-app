"use client";

import { format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  /** Current value as a UTC ISO string (…Z), or null. */
  value: string | null;
  onChange: (iso: string | null) => void;
}

/**
 * Calendar + time picker. Works in local time and emits a UTC ISO string, so the
 * stored due date is timezone-correct.
 */
export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const current = value ? new Date(value) : undefined;
  const time = current ? format(current, "HH:mm") : "09:00";

  function commit(day: Date | undefined, hhmm: string) {
    if (!day) {
      onChange(null);
      return;
    }
    const [h, m] = hhmm.split(":").map(Number);
    const local = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h || 0, m || 0);
    onChange(local.toISOString());
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Trigger and clear are siblings — never nest interactive elements. */}
      <div className="relative inline-flex">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label="Due date"
            className={cn(
              "w-[220px] justify-start font-normal",
              current && "pr-9",
              !current && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {current ? format(current, "PP, p") : "No due date"}
          </Button>
        </PopoverTrigger>
        {current && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear due date"
            onClick={() => commit(undefined, time)}
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          >
            <XIcon className="size-3.5" />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={current} onSelect={(day) => commit(day, time)} autoFocus />
        <div className="border-t p-3">
          <label className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <Input
              type="time"
              value={time}
              onChange={(e) => commit(current ?? new Date(), e.target.value)}
              className="w-32"
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}
