"use client";

import { useParams } from "next/navigation";
import { SessionRoom } from "@/components/SessionRoom";

export default function PatientSessionPage() {
  const params = useParams<{ id: string }>();
  return <SessionRoom sessionId={params.id} backHref="/paciente" />;
}
