"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

export default function AcceptProposalButton({
  projectId,
  proposalId,
}: {
  projectId: string;
  proposalId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    if (!confirm("Ин пешниҳодро қабул мекунед?")) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const d = await res.json();
      alert(d.error || "Хатогӣ");
    }
  }

  return (
    <button onClick={accept} disabled={loading} className="btn-primary !px-3 !py-1.5 !text-xs">
      <Check className="h-3.5 w-3.5" />
      Қабул кардан
    </button>
  );
}
