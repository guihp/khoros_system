#!/usr/bin/env bash
# Gera um certificado HTTPS local (mkcert) válido para localhost + IP da rede
# local, usado por `pnpm dev:https` (web e api) para testar câmera/microfone
# no celular. navigator.mediaDevices só existe em contexto seguro (HTTPS ou
# localhost) — testar pelo IP da LAN em HTTP nunca vai funcionar no celular.
#
# Uso: ./scripts/gen-certs.sh
# Requer: mkcert (brew install mkcert). Rode "mkcert -install" uma vez (pede
# senha de admin) para o certificado ser confiável sem aviso no navegador do
# computador; no celular, seria necessário instalar a CA manualmente — mais
# simples é só aceitar o aviso de "site não confiável" uma vez.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert não encontrado. Instale com: brew install mkcert" >&2
  exit 1
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"

mkdir -p certificates
cd certificates

NAMES=(localhost 127.0.0.1 ::1)
if [ -n "$LAN_IP" ]; then
  NAMES+=("$LAN_IP")
  echo "Gerando certificado para localhost + IP da rede local: $LAN_IP"
else
  echo "Não foi possível detectar o IP da rede local automaticamente; gerando só para localhost."
  echo "Rode de novo passando o IP manualmente, ex.: mkcert -key-file khoros-key.pem -cert-file khoros-cert.pem localhost 127.0.0.1 ::1 192.168.x.x"
fi

mkcert -key-file khoros-key.pem -cert-file khoros-cert.pem "${NAMES[@]}"

echo ""
echo "Certificado gerado em certificates/khoros-cert.pem (+ khoros-key.pem)."
echo "Rode 'pnpm dev:https' e acesse:"
echo "  Computador: https://localhost:3000"
if [ -n "$LAN_IP" ]; then
  echo "  Celular (mesma Wi-Fi): https://$LAN_IP:3000"
fi
