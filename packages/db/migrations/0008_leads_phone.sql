-- Telefone celular BR na captura de leads (DDD + 9 + 8 dígitos, só números).

alter table leads
  add column phone text check (phone is null or phone ~ '^\d{2}9\d{8}$');
