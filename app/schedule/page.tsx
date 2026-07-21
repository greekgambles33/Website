import type { Metadata } from "next";
import { ScheduleSection } from "@/components/home/ScheduleSection";

export const metadata: Metadata = {
  title: "Schedule | GreekGodBerry",
  description: "The full weekly stream schedule for GreekGodBerry — every session, every night.",
};

export default function SchedulePage() {
  return <ScheduleSection />;
}
