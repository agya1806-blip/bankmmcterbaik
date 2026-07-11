"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useProjectStore } from "@/engines/business/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, Trash2Icon, PlusIcon, ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { projects, tasks, isLoading, loadProjects, loadTasks, addTask, toggleTask, removeTask } = useProjectStore();

  const [taskTitle, setTaskTitle] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadProjects(activeWorkspace.id);
      loadTasks(params.id);
    }
  }, [activeWorkspace, loadProjects, loadTasks, params.id]);

  const project = useMemo(
    () => projects.find((p) => p.id === params.id),
    [projects, params.id]
  );

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const progress = useMemo(
    () => tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100),
    [completedCount, tasks.length]
  );

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">{t("projects.notFound")}</p>
        <Button variant="outline" onClick={() => router.push("/projects")}>{t("projects.back")}</Button>
      </div>
    );
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !project) return;
    await addTask({ projectId: project.id, title: taskTitle.trim() });
    setTaskTitle("");
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/projects")}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <Badge variant={statusVariant[project.status] || "outline"}>{t(`projects.${project.status}` as any)}</Badge>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{project.description || t("projects.noDescription")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("projects.startDate")}</p>
            <p className="text-sm">{new Date(project.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("projects.endDate")}</p>
            <p className="text-sm">{new Date(project.endDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("projects.duration")}</p>
            <p className="text-sm">
              {Math.max(1, Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)))} {t("projects.days")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("projects.tasks")}</h3>
          <span className="text-sm text-muted-foreground">{completedCount}/{tasks.length}</span>
        </div>

        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder={t("projects.addTaskPlaceholder")}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !taskTitle.trim()}>
            <PlusIcon className="size-4" /> {t("projects.addTask")}
          </Button>
        </form>

        {tasks.length === 0 && (
          <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6 text-center text-muted-foreground">{t("projects.noTasks")}</div>
        )}

        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} size="sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    task.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                  }`}
                >
                  {task.completed && <CheckIcon className="size-3" />}
                </button>
                <span className={`flex-1 text-sm ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                  {task.title}
                </span>
                <Button variant="ghost" size="icon-xs" onClick={() => removeTask(task.id)}>
                  <Trash2Icon className="size-3 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
