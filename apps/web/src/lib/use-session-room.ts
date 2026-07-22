"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type LocalVideoTrack, type RemoteTrack } from "livekit-client";
import {
  HEARTBEAT_INTERVAL_MS,
  PENDING_STATUS_POLL_MS,
  type EndReason,
  type SessionServerEvent,
} from "@khoros/shared";
import { useAuth } from "@/lib/auth-context";
import { apiWsUrl, fetchApi, ApiError } from "@/lib/api";
import { hmacSha256Hex } from "@/lib/hmac";
import type { SessionDetail } from "@/lib/api-types";
import { clearSessionCredentials, readSessionCredentials } from "@/lib/session-storage";

/** Backoff do WS de heartbeat após queda inesperada — nunca deixa o relógio do servidor "sumir" do cliente por muito tempo. */
const WS_RECONNECT_BASE_MS = 1_000;
const WS_RECONNECT_MAX_MS = 8_000;

/**
 * Next.js reporta `unhandledrejection` cujo `reason` é um `Event` puro (não um
 * `Error`) tipicamente quando um WebSocket subjacente (o nosso ou o do
 * LiveKit) falha internamente e alguma Promise rejeita com o próprio evento
 * DOM em vez de um erro serializável. Isso não é um bug "real" do app, mas
 * quebra o overlay de erro do Next em dev e polui o console — convertemos
 * para um erro legível e evitamos que suba como crash.
 */
function coerceRejectionReason(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  if (typeof Event !== "undefined" && reason instanceof Event) {
    const target = reason.target;
    const label =
      target && "constructor" in Object(target) ? (target as { constructor: { name: string } }).constructor.name : "desconhecido";
    return new Error(`Evento DOM não tratado (${reason.type} em ${label}) — provavelmente uma conexão (WS/mídia) instável.`);
  }
  return new Error(typeof reason === "string" ? reason : "Erro desconhecido.");
}

export interface SessionEndedInfo {
  reason: string;
  totalCents: number;
}

/** Sessão terminada ainda em PENDING (recusa, timeout de aceite, cancelamento) — nunca chegou a cobrar. */
export interface SessionCancelledInfo {
  reason: EndReason | string;
}

/**
 * `navigator.mediaDevices` só existe em contexto seguro (HTTPS ou
 * localhost/127.0.0.1). Abrir o app pelo IP da rede local em HTTP (comum ao
 * testar no celular) deixa `navigator.mediaDevices` `undefined` — chamar
 * `getUserMedia` nesse caso lançaria um TypeError e quebraria a sala.
 */
function hasMediaDevicesSupport(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/** Tipo do problema de mídia local — determina copy e ação de retry na UI. */
export type MediaErrorType = "insecure-context" | "permission-denied";

export interface MediaErrorInfo {
  type: MediaErrorType;
  message: string;
}

const INSECURE_CONTEXT_MESSAGE =
  "Câmera e microfone só funcionam em conexão segura. No computador, acesse por http://localhost:3000. " +
  "No celular, é preciso abrir o endereço seguro (https://) — peça o link atualizado ou veja as instruções de acesso.";

const PERMISSION_DENIED_MESSAGE =
  "Não foi possível acessar sua câmera ou microfone. Verifique as permissões do navegador para este site e tente novamente.";

const PERMISSION_DENIED_CONTINUES_MESSAGE = `${PERMISSION_DENIED_MESSAGE} A consulta continua — o outro lado ainda pode te ouvir se você liberar o acesso.`;

interface SessionCredentials {
  livekitUrl: string;
  livekitToken: string;
  hbSecret: string;
}

export interface UseSessionRoomOptions {
  /**
   * Paciente: não conecta LiveKit até `joinSession()` (lobby “Pronto para entrar?”).
   * Psicólogo: `false` — entra direto na sala após ACTIVE.
   */
  requirePreJoin?: boolean;
}

/**
 * Conecta a sala LiveKit da sessão, abre o canal de heartbeat (WS assinado por
 * HMAC) e escuta os eventos do motor de bilhetagem. Compartilhado pela sala do
 * paciente e do psicólogo — a única fonte de verdade do tempo é o servidor.
 */
export function useSessionRoom(sessionId: string, options: UseSessionRoomOptions = {}) {
  const { requirePreJoin = false } = options;
  const { session, user, me } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("PENDING");
  const [paidSeconds, setPaidSeconds] = useState(0);
  const [accruedCents, setAccruedCents] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [ended, setEnded] = useState<SessionEndedInfo | null>(null);
  const [cancelledInfo, setCancelledInfo] = useState<SessionCancelledInfo | null>(null);
  const cameraDefaultOn =
    me?.registered === true && me.role === "PATIENT" && me.profile && "camera_ligada_padrao" in me.profile
      ? (me.profile as { camera_ligada_padrao?: boolean }).camera_ligada_padrao !== false
      : true;
  const cameraDefaultOnRef = useRef(cameraDefaultOn);
  cameraDefaultOnRef.current = cameraDefaultOn;
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(cameraDefaultOn);
  /** Câmera/mic bloqueados (contexto inseguro ou permissão negada) — não é fatal: a sessão e a bilhetagem continuam. */
  const [mediaError, setMediaError] = useState<MediaErrorInfo | null>(null);
  /** Paciente só publica após o CTA do lobby; psicólogo já entra com true. */
  const [hasJoined, setHasJoined] = useState(!requirePreJoin);
  const [joining, setJoining] = useState(false);
  /** Há vídeo remoto inscrito (para tile Meet: local vira principal se false). */
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(0);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsReconnectAttemptRef = useRef(0);
  const [wsConnected, setWsConnected] = useState(true);
  const credentialsRef = useRef<SessionCredentials | null>(null);
  const livekitConnectingRef = useRef(false);
  const hasJoinedRef = useRef(hasJoined);
  hasJoinedRef.current = hasJoined;
  const micEnabledRef = useRef(micEnabled);
  micEnabledRef.current = micEnabled;
  const camEnabledRef = useRef(camEnabled);
  camEnabledRef.current = camEnabled;

  // Elementos <video> e tracks locais/remotas são guardados em refs (não em
  // state) porque anexar mídia é imperativo e não deve disparar re-render.
  // Isso também resolve o caso em que a track chega (TrackSubscribed) antes
  // do elemento existir no DOM (ex.: paciente ainda na sala de espera) ou
  // vice-versa — qualquer um dos dois lados "avisa" o outro via os callback
  // refs abaixo, então a track sempre acaba anexada assim que ambos existem.
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const remoteVideoTrackRef = useRef<RemoteTrack | null>(null);
  /** Preview getUserMedia do lobby (antes do LiveKit) — parado no join. */
  const lobbyStreamRef = useRef<MediaStream | null>(null);

  const attachLocalTrack = useCallback(() => {
    const track = localVideoTrackRef.current;
    const el = localVideoElRef.current;
    if (track && el) track.attach(el);
  }, []);

  const attachRemoteTrack = useCallback(() => {
    const track = remoteVideoTrackRef.current;
    const el = remoteVideoElRef.current;
    if (track && el) track.attach(el);
  }, []);

  /** Callback ref (não `RefObject`): dispara o attach no exato momento em que o <video> entra no DOM. */
  const localVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      localVideoElRef.current = el;
      if (el) attachLocalTrack();
    },
    [attachLocalTrack],
  );

  const remoteVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      remoteVideoElRef.current = el;
      if (el) attachRemoteTrack();
    },
    [attachRemoteTrack],
  );

  const stopLobbyPreview = useCallback(() => {
    lobbyStreamRef.current?.getTracks().forEach((t) => t.stop());
    lobbyStreamRef.current = null;
    const el = localVideoElRef.current;
    if (el && !localVideoTrackRef.current) {
      el.srcObject = null;
    }
  }, []);

  /**
   * Desliga tudo que ainda estiver vivo (heartbeat, WS, sala LiveKit) — chamado
   * sempre que a sessão termina, para nunca deixar câmera/mic ou bilhetagem
   * "fantasma" conectados depois de um encerramento/cancelamento/recusa.
   */
  const teardown = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }
    wsRef.current = null;
    stopLobbyPreview();
    localVideoTrackRef.current?.detach();
    localVideoTrackRef.current = null;
    remoteVideoTrackRef.current?.detach();
    remoteVideoTrackRef.current = null;
    void roomRef.current?.disconnect();
    roomRef.current = null;
    livekitConnectingRef.current = false;
    setConnected(false);
    setRemoteVideoActive(false);
    setWsConnected(true);
  }, [stopLobbyPreview]);

  /**
   * Aplica um status terminal vindo do GET /sessions/:id (usado no fallback de
   * polling e na checagem inicial) — mesmo efeito que receber o evento WS
   * correspondente, para o caso do push ter se perdido (WS ainda não aberto
   * quando a recusa aconteceu, socket caiu, etc.).
   */
  const applyTerminalStatus = useCallback(
    (detail: Pick<SessionDetail, "status" | "motivo_encerramento" | "valor_total_centavos">): boolean => {
      if (detail.status === "CANCELLED") {
        teardown();
        clearSessionCredentials(sessionId);
        setCancelledInfo({ reason: detail.motivo_encerramento ?? "ERROR" });
        setStatus("CANCELLED");
        return true;
      }
      if (detail.status === "ENDED") {
        teardown();
        clearSessionCredentials(sessionId);
        setEnded({ reason: detail.motivo_encerramento ?? "ERROR", totalCents: detail.valor_total_centavos ?? 0 });
        setStatus("ENDED");
        return true;
      }
      return false;
    },
    [sessionId, teardown],
  );

  /** Sync de ACTIVE/SUSPENDED a partir do GET (poll) — cobre perda do push WS. */
  const applyActiveStatus = useCallback(
    (detail: Pick<SessionDetail, "status" | "segundos_cobrados" | "valor_total_centavos">) => {
      if (detail.status !== "ACTIVE" && detail.status !== "SUSPENDED") return false;
      setStatus(detail.status);
      if (detail.segundos_cobrados != null) setPaidSeconds(detail.segundos_cobrados);
      if (detail.valor_total_centavos != null) setAccruedCents(detail.valor_total_centavos);
      return true;
    },
    [],
  );

  const handleServerEvent = useCallback(
    (msg: SessionServerEvent) => {
      switch (msg.type) {
        case "session_state":
          setStatus(msg.status);
          setPaidSeconds(msg.paidSeconds);
          setAccruedCents(msg.accruedCents);
          if (msg.status === "ACTIVE" || msg.status === "SUSPENDED") {
            // Stage pode ter acabado de montar após PENDING — força re-attach.
            queueMicrotask(() => {
              attachLocalTrack();
              attachRemoteTrack();
            });
          }
          break;
        case "low_balance":
          setWarning(`Saldo baixo: restam cerca de ${msg.remainingMinutes} min.`);
          break;
        case "critical_balance":
          setWarning(`Saldo quase no fim: restam cerca de ${msg.remainingMinutes} min.`);
          break;
        case "ending_soon":
          setWarning("Sua consulta será encerrada em breve por falta de saldo.");
          break;
        case "session_ended":
          teardown();
          clearSessionCredentials(sessionId);
          setEnded({ reason: msg.reason, totalCents: msg.totalCents });
          setStatus("ENDED");
          break;
        case "session_cancelled":
          teardown();
          clearSessionCredentials(sessionId);
          setCancelledInfo({ reason: msg.reason });
          setStatus("CANCELLED");
          break;
        case "incoming_call":
          break;
      }
    },
    [sessionId, teardown, attachLocalTrack, attachRemoteTrack],
  );

  /** Bootstrap: GET + WS. LiveKit só depois de `hasJoined` (ver efeito separado). */
  useEffect(() => {
    const token = session?.access_token;
    const userId = user?.id;
    if (!token || !userId) return;
    let unmounted = false;

    (async () => {
      try {
        const stored = readSessionCredentials(sessionId);
        const detail = await fetchApi<SessionDetail>(`/sessions/${sessionId}`, { token });
        if (unmounted) return;
        setStatus(detail.status);
        if (detail.segundos_cobrados != null) setPaidSeconds(detail.segundos_cobrados);

        if (applyTerminalStatus(detail)) {
          setLoading(false);
          return;
        }

        const livekitUrl = stored?.livekitUrl ?? detail.livekitUrl;
        const hbSecret = stored?.hbSecret ?? detail.hbSecret;
        const livekitToken =
          stored?.patientToken ??
          stored?.psychologistToken ??
          detail.patientToken ??
          detail.psychologistToken ??
          detail.livekitToken;

        if (!livekitToken || !livekitUrl || !hbSecret) {
          throw new Error("Sessão sem credenciais de vídeo. Tente novamente em alguns segundos.");
        }

        credentialsRef.current = { livekitUrl, livekitToken, hbSecret };

        const connectWs = () => {
          if (unmounted) return;
          const ws = new WebSocket(`${apiWsUrl("/ws")}?token=${encodeURIComponent(token)}`);
          wsRef.current = ws;

          ws.onmessage = (evt) => {
            try {
              const msg = JSON.parse(evt.data) as SessionServerEvent;
              handleServerEvent(msg);
            } catch {
              // Ignora frames que não sejam JSON de evento de sessão.
            }
          };

          ws.onopen = () => {
            wsReconnectAttemptRef.current = 0;
            setWsConnected(true);
            if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = setInterval(async () => {
              const creds = credentialsRef.current;
              if (!creds) return;
              const seq = seqRef.current++;
              try {
                const hmac = await hmacSha256Hex(creds.hbSecret, `${sessionId}:${userId}:${seq}`);
                ws.send(JSON.stringify({ type: "heartbeat", sessionId, seq, hmac }));
              } catch {
                // Falha ao assinar não deve travar o loop; próximo tick tenta de novo.
              }
            }, HEARTBEAT_INTERVAL_MS);
          };

          ws.onerror = () => {
            setWsConnected(false);
          };

          ws.onclose = (evt) => {
            if (wsRef.current === ws) wsRef.current = null;
            if (heartbeatTimerRef.current) {
              clearInterval(heartbeatTimerRef.current);
              heartbeatTimerRef.current = null;
            }
            if (unmounted) return;
            if (evt.code === 4401) {
              setError("Sua sessão expirou. Recarregue a página para continuar.");
              return;
            }
            setWsConnected(false);
            wsReconnectAttemptRef.current += 1;
            const delay = Math.min(
              WS_RECONNECT_BASE_MS * 2 ** (wsReconnectAttemptRef.current - 1),
              WS_RECONNECT_MAX_MS,
            );
            wsReconnectTimerRef.current = setTimeout(connectWs, delay);
          };
        };

        connectWs();
        setLoading(false);
      } catch (err) {
        if (!unmounted) {
          setError(
            err instanceof ApiError || err instanceof Error
              ? err.message
              : "Não foi possível conectar à sessão.",
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      unmounted = true;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (wsReconnectTimerRef.current) clearTimeout(wsReconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
      stopLobbyPreview();
      localVideoTrackRef.current?.detach();
      remoteVideoTrackRef.current?.detach();
      void roomRef.current?.disconnect();
      roomRef.current = null;
    };
    // Dependemos do TOKEN/ID (primitivos), não dos objetos `session`/`user`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, user?.id, sessionId, handleServerEvent, applyTerminalStatus]);

  /**
   * Conecta LiveKit quando o participante já “entrou” (psicólogo direto, ou
   * paciente após CTA do lobby). Não reconecta se a sala já existe.
   */
  useEffect(() => {
    if (!hasJoined || loading || error || ended || cancelledInfo) return;
    if (status === "CANCELLED" || status === "ENDED") return;
    if (roomRef.current || livekitConnectingRef.current) return;

    const creds = credentialsRef.current;
    if (!creds) return;

    let unmounted = false;
    livekitConnectingRef.current = true;

    (async () => {
      try {
        stopLobbyPreview();

        const room = new Room();
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video) {
            remoteVideoTrackRef.current = track;
            setRemoteVideoActive(true);
            attachRemoteTrack();
          } else if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
        });
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video && remoteVideoTrackRef.current === track) {
            track.detach();
            remoteVideoTrackRef.current = null;
            setRemoteVideoActive(false);
          }
        });
        room.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (publication.track?.kind === Track.Kind.Video) {
            localVideoTrackRef.current = publication.track as LocalVideoTrack;
            attachLocalTrack();
          }
        });
        room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
          if (publication.track && localVideoTrackRef.current === publication.track) {
            localVideoTrackRef.current = null;
          }
        });
        room.on(RoomEvent.MediaDevicesError, () => {
          setMediaError({ type: "permission-denied", message: PERMISSION_DENIED_CONTINUES_MESSAGE });
        });
        room.on(RoomEvent.Reconnecting, () => setConnected(false));
        room.on(RoomEvent.Reconnected, () => {
          setConnected(true);
          attachLocalTrack();
          attachRemoteTrack();
        });
        room.on(RoomEvent.Disconnected, () => setConnected(false));

        await room.connect(creds.livekitUrl, creds.livekitToken);
        if (unmounted) {
          await room.disconnect();
          return;
        }
        setConnected(true);

        if (!hasMediaDevicesSupport()) {
          setMediaError({ type: "insecure-context", message: INSECURE_CONTEXT_MESSAGE });
          setMicEnabled(false);
          setCamEnabled(false);
        } else {
          try {
            const enableMic = micEnabledRef.current;
            const enableCam = camEnabledRef.current;
            await room.localParticipant.setMicrophoneEnabled(enableMic);
            await room.localParticipant.setCameraEnabled(enableCam);
            setMicEnabled(enableMic);
            setCamEnabled(enableCam);
            const camPub = Array.from(room.localParticipant.videoTrackPublications.values())[0];
            if (camPub?.videoTrack) {
              localVideoTrackRef.current = camPub.videoTrack as LocalVideoTrack;
              attachLocalTrack();
            }
          } catch {
            setMediaError({ type: "permission-denied", message: PERMISSION_DENIED_CONTINUES_MESSAGE });
            setMicEnabled(false);
            setCamEnabled(false);
          }
        }
      } catch (err) {
        if (!unmounted) {
          setError(
            err instanceof Error ? err.message : "Não foi possível conectar ao vídeo da consulta.",
          );
        }
        roomRef.current = null;
      } finally {
        livekitConnectingRef.current = false;
        if (!unmounted) setJoining(false);
      }
    })();

    return () => {
      unmounted = true;
    };
  }, [
    hasJoined,
    loading,
    error,
    ended,
    cancelledInfo,
    status,
    attachLocalTrack,
    attachRemoteTrack,
    stopLobbyPreview,
  ]);

  /** Quando o stage monta após ACTIVE (saiu de PENDING), re-anexa tracks. */
  useEffect(() => {
    if (status !== "ACTIVE" && status !== "SUSPENDED") return;
    if (!hasJoined) return;
    attachLocalTrack();
    attachRemoteTrack();
  }, [status, hasJoined, attachLocalTrack, attachRemoteTrack]);

  /**
   * Rede de segurança para o `unhandledrejection` característico de um
   * WebSocket (nosso ou interno do LiveKit) que rejeita com o `Event` DOM
   * puro em vez de um `Error`.
   */
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const { reason } = event;
      if (reason instanceof Error) return;
      if (typeof Event !== "undefined" && reason instanceof Event) {
        event.preventDefault();
        // eslint-disable-next-line no-console
        console.warn("[session] rejeição não tratada com Event bruto:", coerceRejectionReason(reason));
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  /**
   * Backup do evento WS: enquanto PENDING, consulta o status. Também atualiza
   * ACTIVE/SUSPENDED (não só cancel/end) — cobre push perdido antes do WS abrir.
   */
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    if (status !== "PENDING" || ended || cancelledInfo) return;

    const timer = setInterval(() => {
      fetchApi<SessionDetail>(`/sessions/${sessionId}`, { token })
        .then((detail) => {
          if (applyTerminalStatus(detail)) return;
          applyActiveStatus(detail);
        })
        .catch(() => {
          // Rede instável: o WS continua sendo o caminho principal.
        });
    }, PENDING_STATUS_POLL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, sessionId, status, ended, cancelledInfo, applyTerminalStatus, applyActiveStatus]);

  /**
   * Preview leve de câmera no lobby (antes do LiveKit). Só enquanto
   * requirePreJoin && !hasJoined && ACTIVE.
   */
  useEffect(() => {
    if (!requirePreJoin || hasJoined) {
      stopLobbyPreview();
      return;
    }
    if (status !== "ACTIVE" && status !== "SUSPENDED") return;
    if (!camEnabled) {
      stopLobbyPreview();
      return;
    }
    if (!hasMediaDevicesSupport()) {
      setMediaError({ type: "insecure-context", message: INSECURE_CONTEXT_MESSAGE });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stopLobbyPreview();
        lobbyStreamRef.current = stream;
        const el = localVideoElRef.current;
        if (el) {
          el.srcObject = stream;
          void el.play().catch(() => undefined);
        }
        setMediaError(null);
      } catch {
        setMediaError({ type: "permission-denied", message: PERMISSION_DENIED_MESSAGE });
        setCamEnabled(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requirePreJoin, hasJoined, status, camEnabled, stopLobbyPreview]);

  /** Lobby: anexa preview quando o <video> local monta. */
  const lobbyLocalVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      localVideoElRef.current = el;
      if (el && lobbyStreamRef.current) {
        el.srcObject = lobbyStreamRef.current;
        void el.play().catch(() => undefined);
      } else if (el) {
        attachLocalTrack();
      }
    },
    [attachLocalTrack],
  );

  const joinSession = useCallback(() => {
    if (hasJoinedRef.current) return;
    setJoining(true);
    setHasJoined(true);
  }, []);

  const endSession = useCallback(async () => {
    if (session?.access_token) {
      try {
        await fetchApi(`/sessions/${sessionId}/end`, { method: "POST", token: session.access_token });
      } catch {
        // O servidor pode já ter encerrado a sessão; seguimos com o encerramento local.
      }
    }
    setTimeout(() => {
      if (!roomRef.current && !wsRef.current) return;
      teardown();
      clearSessionCredentials(sessionId);
      if (status === "ACTIVE" || status === "SUSPENDED") {
        setEnded((prev) => prev ?? { reason: "PATIENT_ENDED", totalCents: accruedCents });
      } else {
        setCancelledInfo((prev) => prev ?? { reason: "PATIENT_ENDED" });
      }
    }, 1500);
  }, [session, sessionId, teardown, status, accruedCents]);

  const toggleMic = useCallback(() => {
    if (!hasMediaDevicesSupport()) {
      setMediaError({ type: "insecure-context", message: INSECURE_CONTEXT_MESSAGE });
      return;
    }
    setMicEnabled((prev) => {
      const next = !prev;
      if (roomRef.current) {
        void roomRef.current.localParticipant.setMicrophoneEnabled(next).catch(() => {
          setMediaError({ type: "permission-denied", message: PERMISSION_DENIED_MESSAGE });
        });
      }
      return next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    if (!hasMediaDevicesSupport()) {
      setMediaError({ type: "insecure-context", message: INSECURE_CONTEXT_MESSAGE });
      return;
    }
    setCamEnabled((prev) => {
      const next = !prev;
      if (roomRef.current) {
        void roomRef.current.localParticipant.setCameraEnabled(next).catch(() => {
          setMediaError({ type: "permission-denied", message: PERMISSION_DENIED_MESSAGE });
        });
      }
      return next;
    });
  }, []);

  /**
   * Repete a captura de câmera/mic após o usuário liberar permissão (ou trocar
   * para um contexto seguro) — chamada pelo CTA "Tentar novamente" do banner
   * de mídia. Nunca reconecta a sala LiveKit em si: só a captura local.
   */
  const retryMedia = useCallback(async () => {
    if (!hasMediaDevicesSupport()) {
      setMediaError({ type: "insecure-context", message: INSECURE_CONTEXT_MESSAGE });
      return;
    }
    const room = roomRef.current;
    if (!room) return;
    try {
      const enableMic = micEnabledRef.current;
      const enableCam = camEnabledRef.current || cameraDefaultOnRef.current;
      await room.localParticipant.setMicrophoneEnabled(enableMic || true);
      await room.localParticipant.setCameraEnabled(enableCam);
      const camPub = Array.from(room.localParticipant.videoTrackPublications.values())[0];
      if (camPub?.videoTrack) {
        localVideoTrackRef.current = camPub.videoTrack as LocalVideoTrack;
        attachLocalTrack();
      }
      setMicEnabled(true);
      setCamEnabled(enableCam);
      setMediaError(null);
    } catch {
      setMediaError({ type: "permission-denied", message: PERMISSION_DENIED_CONTINUES_MESSAGE });
      setMicEnabled(false);
      setCamEnabled(false);
    }
  }, [attachLocalTrack]);

  return {
    loading,
    error,
    connected,
    /** false enquanto o canal de heartbeat (WS) está caído/reconectando — cronômetro deixa de avançar até voltar. */
    wsConnected,
    status,
    paidSeconds,
    accruedCents,
    warning,
    ended,
    cancelled: cancelledInfo,
    micEnabled,
    camEnabled,
    mediaError,
    hasJoined,
    joining,
    remoteVideoActive,
    localVideoRef: hasJoined ? localVideoRef : lobbyLocalVideoRef,
    remoteVideoRef,
    toggleMic,
    toggleCam,
    retryMedia,
    joinSession,
    endSession,
  };
}
