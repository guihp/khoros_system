"use client";

/**
 * Alias estável para o editor de páginas (outro slice).
 * Preferir `AdminGate` em código novo do hub artigos/categorias/mídia.
 */
export { AdminGate as AdminGuard, useAdminToken } from "@/components/admin/AdminGate";
