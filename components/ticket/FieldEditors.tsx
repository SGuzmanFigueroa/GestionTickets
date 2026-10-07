"use client";

import { useRef, useState, useTransition } from "react";
import Avatar from "@/components/ui/Avatar";
import AlertDialog from "@/components/ui/AlertDialog";
import { STATUS_STYLES } from "@/components/Badge";
import { POPOVER_OPTION, POPOVER_PANEL, useListboxKeys, usePopover } from "@/components/ui/Popover";
import { toast } from "@/lib/toast";
import { ROLE_LABELS, STATUS_LABELS, type TicketStatus, type UserRole } from "@/lib/types";

// Editores inline del detalle del ticket. Todos son optimistas: muestran el
// valor nuevo al instante y, si el servidor lo rechaza, vuelven al anterior y
// avisan con un toast. Para que tomen el valor nuevo del servidor tras un
// refresco, quien los usa les pone key={valorDelServidor}.

type Save<T> = (value: T) => Promise<{ error: string | null }>;

function useOptimisticField<T>(initial: T, save: Save<T>, successMessage: string) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function commit(next: T) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const { error } = await save(next);
      if (error) {
        setValue(previous);
        toast(error, "error");
      } else {
        toast(successMessage);
      }
    });
  }

  return { value, commit, pending };
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 opacity-60">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none" aria-label="Guardando">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Estado: botón tipo "lozenge" con las transiciones permitidas.

export function StatusPicker({
  status,
  nextStatuses,
  save,
}: {
  status: TicketStatus;
  nextStatuses: TicketStatus[];
  save: Save<TicketStatus>;
}) {
  const { value, commit, pending } = useOptimisticField(status, save, "Estado actualizado");
  const { open, setOpen, ref } = usePopover();
  const { listRef, onKeyDown } = useListboxKeys(open);
  const editable = nextStatuses.length > 0;

  const lozenge = `inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[value]}`;

  if (!editable) {
    return <span className={lozenge}>{STATUS_LABELS[value]}</span>;
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Estado: ${STATUS_LABELS[value]}. Cambiar estado`}
        className={`${lozenge} transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/50 focus-visible:ring-offset-1`}
      >
        {STATUS_LABELS[value]}
        {pending ? <Spinner /> : <Chevron />}
      </button>
      {open && (
        <ul ref={listRef} role="listbox" aria-label="Mover a" onKeyDown={onKeyDown} className={`${POPOVER_PANEL} left-0 w-56`}>
          <li className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mover a</li>
          {nextStatuses.map((s) => (
            <li key={s}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  setOpen(false);
                  commit(s);
                }}
                className={POPOVER_OPTION}
              >
                <span className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[s]}`}>
                  {STATUS_LABELS[s]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selector genérico (prioridad, severidad, equipo, proyecto).

export interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export function OptionPicker<T extends string>({
  label,
  value: initial,
  options,
  editable,
  save,
  successMessage,
  confirmMessage,
  renderValue,
}: {
  /** Nombre del campo (para lectores de pantalla). */
  label: string;
  value: T;
  options: Option<T>[];
  editable: boolean;
  save: Save<T>;
  successMessage: string;
  /** Si se pasa, pide confirmación antes de guardar (ej. mover de proyecto). */
  confirmMessage?: (next: Option<T>) => string;
  renderValue?: (option: Option<T> | undefined) => React.ReactNode;
}) {
  const { value, commit, pending } = useOptimisticField(initial, save, successMessage);
  const { open, setOpen, ref } = usePopover();
  const { listRef, onKeyDown } = useListboxKeys(open);
  const [confirming, setConfirming] = useState<Option<T> | null>(null);
  const current = options.find((o) => o.value === value);
  const display = renderValue ? (
    renderValue(current)
  ) : (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {current?.icon}
      <span className="truncate">{current?.label ?? "—"}</span>
    </span>
  );

  if (!editable) {
    return <div className="flex min-h-8 items-center px-2 text-sm text-slate-800 dark:text-slate-100">{display}</div>;
  }

  function choose(option: Option<T>) {
    setOpen(false);
    if (option.value === value) return;
    if (confirmMessage) setConfirming(option);
    else commit(option.value);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label ?? "sin valor"}. Cambiar`}
        className="flex min-h-8 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-sm text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:text-slate-100 dark:hover:bg-slate-700/60"
      >
        {display}
        {pending ? <Spinner /> : <span className="text-slate-400"><Chevron /></span>}
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={`${POPOVER_PANEL} left-0 right-0 max-h-72 min-w-48 overflow-y-auto`}
        >
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" role="option" aria-selected={o.value === value} onClick={() => choose(o)} className={POPOVER_OPTION}>
                {o.icon}
                <span className="truncate">{o.label}</span>
                {o.value === value && <span className="ml-auto text-nexa-blue" aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {confirmMessage && (
        <AlertDialog
          open={confirming !== null}
          title="¿Confirmar cambio?"
          description={confirming ? confirmMessage(confirming) : ""}
          confirmLabel="Cambiar"
          danger={false}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            if (confirming) commit(confirming.value);
            setConfirming(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asignado: buscador de personas con avatar y rol.

export interface PersonOption {
  id: string;
  name: string;
  role: UserRole;
}

export function UserPicker({
  assigneeId,
  people,
  editable,
  save,
}: {
  assigneeId: string | null;
  people: PersonOption[];
  editable: boolean;
  save: Save<string | null>;
}) {
  const { value, commit, pending } = useOptimisticField(assigneeId, save, "Asignación actualizada");
  const { open, setOpen, ref } = usePopover();
  const { listRef, onKeyDown } = useListboxKeys(open);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const current = people.find((p) => p.id === value);

  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const filtered = words.length
    ? people.filter((p) => words.every((w) => normalize(`${p.name} ${ROLE_LABELS[p.role]}`).includes(w)))
    : people;

  const display = current ? (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={current.name} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm text-slate-800 dark:text-slate-100">{current.name}</span>
        <span className="block text-[11px] leading-tight text-slate-400">{ROLE_LABELS[current.role]}</span>
      </span>
    </span>
  ) : (
    <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 text-[11px] dark:border-slate-600" aria-hidden="true">
        ?
      </span>
      Sin asignar
    </span>
  );

  if (!editable) return <div className="flex min-h-9 items-center px-2">{display}</div>;

  function choose(id: string | null) {
    setOpen(false);
    setQuery("");
    commit(id);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Asignado a: ${current?.name ?? "nadie"}. Cambiar`}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:hover:bg-slate-700/60"
      >
        {display}
        {pending ? <Spinner /> : <span className="text-slate-400"><Chevron /></span>}
      </button>
      {open && (
        <div data-has-search className={`${POPOVER_PANEL} left-0 right-0 min-w-64 py-0`}>
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <input
              ref={searchRef}
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  listRef.current?.querySelector<HTMLElement>('[role="option"]')?.focus();
                }
              }}
              placeholder="Buscar persona…"
              aria-label="Buscar persona"
              className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <ul ref={listRef} role="listbox" aria-label="Personas" onKeyDown={onKeyDown} className="max-h-72 overflow-y-auto py-1">
            {!query && (
              <li>
                <button type="button" role="option" aria-selected={value === null} onClick={() => choose(null)} className={POPOVER_OPTION}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 text-[11px] dark:border-slate-600" aria-hidden="true">
                    ?
                  </span>
                  Sin asignar
                </button>
              </li>
            )}
            {filtered.map((p) => (
              <li key={p.id}>
                <button type="button" role="option" aria-selected={p.id === value} onClick={() => choose(p.id)} className={POPOVER_OPTION}>
                  <Avatar name={p.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="block text-[11px] leading-tight text-slate-400">{ROLE_LABELS[p.role]}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-3 text-center text-xs text-slate-400">Nadie coincide con “{query}”.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Texto editable: se ve como contenido normal; clic o lápiz para editar.

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function InlineText({
  value: initial,
  editable,
  save,
  label,
  multiline = false,
  required = false,
  placeholder,
  successMessage,
  variant = "body",
}: {
  value: string;
  editable: boolean;
  save: Save<string>;
  /** Nombre del campo (aria-label y botón de editar). */
  label: string;
  multiline?: boolean;
  required?: boolean;
  placeholder: string;
  successMessage: string;
  variant?: "title" | "body";
}) {
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const textClass =
    variant === "title"
      ? "text-xl font-semibold leading-snug text-nexa-navy dark:text-white sm:text-2xl"
      : "whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300";

  function start() {
    if (!editable) return;
    setDraft(value);
    setEditing(true);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function submit() {
    const next = draft.trim();
    if (required && !next) {
      toast(`${label} no puede quedar vacío.`, "error");
      return;
    }
    if (next === value.trim()) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const { error } = await save(next);
      if (error) {
        toast(error, "error");
      } else {
        setValue(next);
        setEditing(false);
        toast(successMessage);
      }
    });
  }

  if (editing) {
    const fieldClass =
      "w-full rounded-md border border-nexa-blue bg-white px-2.5 py-1.5 outline-none ring-2 ring-nexa-blue/20 dark:bg-slate-900 " +
      (variant === "title" ? "text-xl font-semibold text-nexa-navy dark:text-white" : "text-sm text-slate-800 dark:text-slate-100");
    return (
      <div className="space-y-2">
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
            }}
            rows={Math.min(14, Math.max(4, draft.split("\n").length + 1))}
            aria-label={label}
            className={`${fieldClass} resize-y`}
          />
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") submit();
            }}
            aria-label={label}
            className={fieldClass}
          />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-nexa-blue px-3 text-xs font-semibold text-white hover:bg-nexa-navy disabled:opacity-60"
          >
            {pending && <Spinner />} Guardar
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="h-7 rounded-md px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          {multiline && <span className="text-[11px] text-slate-400">Ctrl + Enter para guardar · Esc para cancelar</span>}
        </div>
      </div>
    );
  }

  const empty = !value.trim();
  if (!editable) {
    return empty ? null : <div className={textClass}>{value}</div>;
  }

  return (
    <div className="group relative -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-700/40">
      <div
        role="button"
        tabIndex={0}
        onClick={start}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            start();
          }
        }}
        aria-label={`Editar ${label.toLowerCase()}`}
        className={`cursor-text pr-7 outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 ${textClass} ${empty ? "italic text-slate-400 dark:text-slate-500" : ""}`}
      >
        {empty ? placeholder : value}
      </div>
      <span className="pointer-events-none absolute right-2 top-1.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
        <PencilIcon />
      </span>
    </div>
  );
}
