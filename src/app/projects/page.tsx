"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useProjectStore } from "@/engines/business/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, FolderKanban } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { projects, isLoading, error, loadProjects, addProject, clearError } = useProjectStore();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadProjects(activeWorkspace.id);
  }, [activeWorkspace, loadProjects]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setName(""); setDescription(""); setStartDate(""); setEndDate("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await addProject({
        workspaceId: activeWorkspace.id, name, description,
        status: "active", startDate, endDate,
      });
    } finally {
      setAddOpen(false);
      resetForm();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("projects.title")}</h1>
          <p className="text-muted-foreground">{projects.length} {t("projects.title").toLowerCase()}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><PlusIcon className="size-4" /> {t("projects.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("projects.add")}</DialogTitle>
              <DialogDescription>Create a new project</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("projects.name")}</label>
                  <Input value={name} onChange={(e) => { setName(e.target.value); if (error) clearError(); }} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("projects.description")}</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("projects.startDate")}</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("projects.endDate")}</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? t("projects.adding") : t("projects.add")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 && !isLoading && (
        <div className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-8 text-center text-muted-foreground">
          {t("projects.empty")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-5 cursor-pointer hover:bg-card transition-colors"
            onClick={() => router.push(`/projects/${p.id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <FolderKanban className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{p.description || t("projects.noDescription")}</p>
                </div>
              </div>
              <Badge variant={statusVariant[p.status] || "outline"} className="shrink-0">{t(`projects.${p.status}` as any)}</Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
