"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  createCalendarEvent,
  getCalendarEventsByWorkspace,
  deleteCalendarEvent,
  type CalendarEvent,
} from "@/lib/db";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function CalendarPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { transactions, loadTransactions } = useFinancialStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [remind, setRemind] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      setEventsLoading(true);
      getCalendarEventsByWorkspace(activeWorkspace.id)
        .then(setEvents)
        .finally(() => setEventsLoading(false));
      loadTransactions(activeWorkspace.id);
    }
  }, [activeWorkspace, loadTransactions]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayEventsMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const existing = map.get(ev.date) || [];
      existing.push(ev);
      map.set(ev.date, existing);
    }
    return map;
  }, [events]);

  const selectedDayStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const dayTxs = selectedDayStr
    ? transactions.filter((tx) => tx.date === selectedDayStr)
    : [];
  const dayEvents = selectedDayStr ? dayEventsMap.get(selectedDayStr) || [] : [];
  const incomeTotal = dayTxs
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + tx.amount, 0);
  const expenseTotal = dayTxs
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);

  function prevMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  }

  function openAddDialog(day: Date) {
    setDate(format(day, "yyyy-MM-dd"));
    setTitle("");
    setDescription("");
    setTime("");
    setRemind(false);
    setError(null);
    setAddOpen(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    setSaving(true);
    setError(null);
    try {
      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        workspaceId: activeWorkspace.id,
        title,
        description,
        date,
        time,
        remind,
        createdAt: Date.now(),
      };
      await createCalendarEvent(event);
      setEvents((prev) => [...prev, event]);
      setAddOpen(false);
    } catch {
      setError(t("calendar.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silent
    }
  }

  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  if (authLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  if (!user || !activeWorkspace) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
        <Button onClick={() => openAddDialog(new Date())}>
          <Plus className="size-4" /> {t("calendar.add")}
        </Button>
      </div>

      <Card size="md" hover={false}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon-xs" onClick={prevMonth}>
              <ChevronLeft className="size-5" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </h2>
            <Button variant="ghost" size="icon-xs" onClick={nextMonth}>
              <ChevronRight className="size-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border/50 rounded-lg overflow-hidden">
            {dayLabels.map((d) => (
              <div
                key={d}
                className="bg-muted/30 px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvs = dayEventsMap.get(dateKey) || [];
              const dayTxCount = transactions.filter(
                (tx) => tx.date === dateKey
              ).length;
              const isCurrentMonth = isSameMonth(day, currentDate);
              const selected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`relative min-h-[80px] p-1.5 text-left transition-colors
                    ${isCurrentMonth ? "bg-card" : "bg-muted/20"}
                    ${selected ? "ring-2 ring-emerald-500 z-10" : ""}
                    ${today && !selected ? "ring-2 ring-emerald-300/60" : ""}
                    hover:bg-accent/50`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                    } ${today ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayEvs.length > 0 && (
                      <Badge variant="info" className="text-[10px] px-1 py-0 leading-none w-fit">
                        {dayEvs.length}
                      </Badge>
                    )}
                    {dayTxCount > 0 && (
                      <Badge variant="success" className="text-[10px] px-1 py-0 leading-none w-fit">
                        {dayTxCount}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <Card size="md" hover={false}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base">
                {format(selectedDay, "EEEE, d MMMM yyyy", { locale: localeId })}
              </h3>
              <Button size="sm" onClick={() => openAddDialog(selectedDay)}>
                <Plus className="size-3.5" /> {t("calendar.add")}
              </Button>
            </div>

            {(incomeTotal > 0 || expenseTotal > 0) && (
              <div className="flex gap-4 mb-3 text-sm">
                {incomeTotal > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t("dashboard.income")}: +{incomeTotal.toLocaleString()}
                  </span>
                )}
                {expenseTotal > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    {t("dashboard.expense")}: -{expenseTotal.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2">
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-muted/30 rounded-lg p-3 flex items-start gap-3"
                >
                  <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <CalendarIcon className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.time && <span>{ev.time}</span>}
                      {ev.description && (
                        <span>
                          {ev.time ? " \u00b7 " : ""}
                          {ev.description}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(ev.id)}
                    className="shrink-0 text-muted-foreground/50 hover:text-destructive"
                  >
                    <span className="text-sm">{"\u00d7"}</span>
                  </Button>
                </div>
              ))}
              {dayTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-muted/30 rounded-lg p-3 flex items-center gap-3"
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "income"
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        tx.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.type}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${
                      tx.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              {dayEvents.length === 0 && dayTxs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("calendar.empty")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("calendar.add")}</DialogTitle>
            <DialogDescription>{t("calendar.add")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("calendar.titleLabel")}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("calendar.description")}
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("calendar.date")}
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("calendar.time")}
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remind"
                  checked={remind}
                  onChange={(e) => setRemind(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <label htmlFor="remind" className="text-sm font-medium">
                  {t("calendar.remindMe")}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? t("calendar.adding") : t("calendar.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
