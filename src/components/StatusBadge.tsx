import { CheckCircle2, CircleDot, Loader } from "lucide-react";
import { statusLabel } from "@/lib/utils";

export default function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "OPEN"
      ? "badge-open"
      : status === "IN_PROGRESS"
        ? "badge-progress"
        : "badge-done";
  const Icon =
    status === "OPEN"
      ? CircleDot
      : status === "IN_PROGRESS"
        ? Loader
        : CheckCircle2;
  return (
    <span className={cls}>
      <Icon className="h-3 w-3" />
      {statusLabel(status)}
    </span>
  );
}
