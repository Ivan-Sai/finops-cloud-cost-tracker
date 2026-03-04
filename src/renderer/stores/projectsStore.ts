import { create } from 'zustand'
import type { Project } from '../types/project'
import type { Service } from '../types/service'

interface ProjectsState {
  projects: Project[]
  services: Service[]
  loading: boolean
  fetchProjects: () => Promise<void>
  fetchServices: () => Promise<void>
  createService: (data: Partial<Service>) => Promise<void>
  updateService: (id: string, data: Partial<Service>) => Promise<void>
  deleteService: (id: string) => Promise<void>
  createProject: (data: Partial<Project>) => Promise<void>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  services: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true })
    const projects = (await window.api.invoke('projects:getAll')) as Project[]
    set({ projects, loading: false })
  },

  fetchServices: async () => {
    const services = (await window.api.invoke('services:getAll')) as Service[]
    set({ services })
  },

  createService: async (data) => {
    await window.api.invoke('services:create', data)
    const services = (await window.api.invoke('services:getAll')) as Service[]
    set({ services })
  },

  updateService: async (id, data) => {
    await window.api.invoke('services:update', id, data)
    const services = (await window.api.invoke('services:getAll')) as Service[]
    set({ services })
  },

  deleteService: async (id) => {
    await window.api.invoke('services:delete', id)
    const services = (await window.api.invoke('services:getAll')) as Service[]
    set({ services })
  },

  createProject: async (data) => {
    await window.api.invoke('projects:create', data)
    const projects = (await window.api.invoke('projects:getAll')) as Project[]
    set({ projects })
  },

  updateProject: async (id, data) => {
    await window.api.invoke('projects:update', id, data)
    const projects = (await window.api.invoke('projects:getAll')) as Project[]
    set({ projects })
  },

  deleteProject: async (id) => {
    await window.api.invoke('projects:delete', id)
    const projects = (await window.api.invoke('projects:getAll')) as Project[]
    set({ projects })
  }
}))
