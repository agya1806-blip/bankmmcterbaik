"use client";

import { create } from "zustand";
import {
  createProject as createProjectDb,
  updateProject as updateProjectDb,
  deleteProject as deleteProjectDb,
  getProjectsByWorkspace,
  createProjectTask as createTaskDb,
  updateProjectTask as updateTaskDb,
  deleteProjectTask as deleteTaskDb,
  getTasksByProject,
  createCalendarEvent as createEventDb,
  getCalendarEventsByWorkspace,
  deleteCalendarEvent as deleteEventDb,
  type Project,
  type ProjectTask,
  type CalendarEvent,
} from "@/lib/db";

export interface ProjectState {
  projects: Project[];
  tasks: ProjectTask[];
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;

  loadProjects: (workspaceId: string) => Promise<void>;
  loadTasks: (projectId: string) => Promise<void>;
  loadEvents: (workspaceId: string) => Promise<void>;
  addProject: (data: {
    workspaceId: string;
    name: string;
    description: string;
    status: Project["status"];
    startDate: string;
    endDate: string;
  }) => Promise<void>;
  editProject: (
    id: string,
    data: Partial<Pick<Project, "name" | "description" | "status" | "startDate" | "endDate">>
  ) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  addTask: (data: { projectId: string; title: string }) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addEvent: (data: {
    workspaceId: string;
    title: string;
    description: string;
    date: string;
    time: string;
    remind: boolean;
  }) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  tasks: [],
  events: [],
  isLoading: false,
  error: null,

  loadProjects: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await getProjectsByWorkspace(workspaceId);
      set({ projects, isLoading: false });
    } catch {
      set({ error: "Failed to load projects", isLoading: false });
    }
  },

  loadTasks: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await getTasksByProject(projectId);
      set({ tasks, isLoading: false });
    } catch {
      set({ error: "Failed to load tasks", isLoading: false });
    }
  },

  loadEvents: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const events = await getCalendarEventsByWorkspace(workspaceId);
      set({ events, isLoading: false });
    } catch {
      set({ error: "Failed to load events", isLoading: false });
    }
  },

  addProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const project: Project = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
      };
      await createProjectDb(project);
      const state = get();
      set({ projects: [...state.projects, project], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add project",
        isLoading: false,
      });
    }
  },

  editProject: async (id, data) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.projects.find((p) => p.id === id);
      if (!existing) throw new Error("Project not found");
      const updated: Project = { ...existing, ...data };
      await updateProjectDb(updated);
      set({ projects: state.projects.map((p) => (p.id === id ? updated : p)) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update project",
      });
    }
  },

  removeProject: async (id) => {
    set({ error: null });
    try {
      await deleteProjectDb(id);
      const state = get();
      set({ projects: state.projects.filter((p) => p.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete project",
      });
    }
  },

  addTask: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const task: ProjectTask = {
        id: crypto.randomUUID(),
        ...data,
        completed: false,
        createdAt: Date.now(),
      };
      await createTaskDb(task);
      const state = get();
      set({ tasks: [...state.tasks, task], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add task",
        isLoading: false,
      });
    }
  },

  toggleTask: async (id) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.tasks.find((t) => t.id === id);
      if (!existing) throw new Error("Task not found");
      const updated: ProjectTask = { ...existing, completed: !existing.completed };
      await updateTaskDb(updated);
      set({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to toggle task",
      });
    }
  },

  removeTask: async (id) => {
    set({ error: null });
    try {
      await deleteTaskDb(id);
      const state = get();
      set({ tasks: state.tasks.filter((t) => t.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete task",
      });
    }
  },

  addEvent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
      };
      await createEventDb(event);
      const state = get();
      set({ events: [...state.events, event], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add event",
        isLoading: false,
      });
    }
  },

  removeEvent: async (id) => {
    set({ error: null });
    try {
      await deleteEventDb(id);
      const state = get();
      set({ events: state.events.filter((e) => e.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete event",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
