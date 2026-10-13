"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function CompleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (!confirm("Лоиҳаро анҷомёфта қайд мекунед?")) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/complete`, {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const d = await res.json();
      alert(d.error || "Хатогӣ");
    }
  }

  return (
    <button onClick={complete} disabled={loading} className="btn-primary">
      <CheckCircle2 className="h-4 w-4" />
      Лоиҳаро анҷом додан
    </button>
  );
}
