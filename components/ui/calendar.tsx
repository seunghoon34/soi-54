"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      showOutsideDays
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      styles={{
        months: { display: "flex", gap: "1rem" },
        month_caption: { display: "flex", justifyContent: "center", alignItems: "center", height: "2rem" },
        nav: { display: "flex", gap: "0.25rem" },
        day: { width: "2.25rem", height: "2.25rem" },
      }}
      modifiersStyles={{
        selected: {
          backgroundColor: "#2563eb",
          color: "white",
          fontWeight: 500,
        },
        range_start: {
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "9999px 0 0 9999px",
        },
        range_end: {
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "0 9999px 9999px 0",
        },
        range_middle: {
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          borderRadius: 0,
        },
        today: {
          backgroundColor: "#f3f4f6",
          fontWeight: 600,
        },
        disabled: {
          color: "#d1d5db",
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
