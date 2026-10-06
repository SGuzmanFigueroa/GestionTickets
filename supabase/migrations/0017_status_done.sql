-- Nuevo estado "Hecho" para el tablero: el responsable terminó y QA debe revisar.
-- Flujo: Por hacer (open/reopened) → En progreso → Hecho → En revisión → Certificado (resolved).
-- Va solo en su propia migración porque un valor nuevo de enum no se puede usar
-- en la misma transacción en que se crea.
alter type ticket_status add value if not exists 'done' after 'in_progress';
