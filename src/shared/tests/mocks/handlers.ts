import { http, HttpResponse } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const languagesApiTarget = (path: string) => {
  const base = AppConfig.LANGUAGES_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const projectsApiTarget = (path: string) => {
  const base = AppConfig.PROJECTS_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

export const handlers = [
  http.get(apiTarget("/v1/metrics"), () => {
    return HttpResponse.json({
      data: [
        { title: "Metric One", type: "line" },
        { title: "Metric Two", type: "geo" },
      ],
    });
  }),

  // Bug Tracker Handlers
  http.get(apiTarget("/bugs"), () => {
    return HttpResponse.json({
      data: [
        {
          id: "1",
          title: "Bug One",
          description: "First bug description",
          priority: "high",
          category: "frontend",
          status: "open",
        },
        {
          id: "2",
          title: "Bug Two",
          description: "Second bug description",
          priority: "low",
          category: "backend",
          status: "open",
        },
      ],
    });
  }),

  http.post(apiTarget("/bugs"), () => {
    return HttpResponse.json({
      data: {
        id: "new-bug",
        title: "New Bug",
        description: "New bug description",
        priority: "high",
        category: "frontend",
        status: "open",
      },
    });
  }),

  http.get(apiTarget("/bugs/repos"), () => {
    return HttpResponse.json({
      data: ["repo-a", "repo-b"],
    });
  }),

  http.get(apiTarget("/bugs/categories"), () => {
    return HttpResponse.json({
      data: ["cat-1", "cat-2"],
    });
  }),

  http.get(apiTarget("/bugs/local"), () => {
    return HttpResponse.json({
      data: [
        {
          id: "local-1",
          title: "Local Bug",
          description: "Desc",
          priority: "medium",
          category: "frontend",
          status: "pending",
        },
      ],
    });
  }),

  http.post(apiTarget("/bugs/:bugId/status"), () => {
    return HttpResponse.json({
      data: { id: "1" },
    });
  }),

  http.post(apiTarget("/bugs/:bugId/notes"), () => {
    return HttpResponse.json({
      data: true,
    });
  }),

  http.get(apiTarget("/bugs/:bugId/notes"), () => {
    return HttpResponse.json({
      data: [],
    });
  }),

  http.post(apiTarget("/bugs/:id/reject"), () => {
    return HttpResponse.json({
      data: { id: "1" },
    });
  }),

  http.post(apiTarget("/bugs/:id/restore"), () => {
    return HttpResponse.json({
      data: { id: "1" },
    });
  }),

  http.post(apiTarget("/bugs/sync"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  http.post(apiTarget("/bugs/:bugId/attachments"), () => {
    return HttpResponse.json({
      data: { id: "2", filePath: "/path/to/att2.png", fileType: "image/png", bugId: "123" },
    });
  }),

  http.delete(apiTarget("/bugs/attachments/:attachmentId"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  // User Management Handlers
  http.get(apiTarget("/v1/users"), () => {
    return HttpResponse.json({
      data: [
        {
          id: "123",
          user: "john_doe",
          name: "John Doe",
          email: "john@example.com",
          isEnabled: true,
          isDeleted: false,
          createdAt: new Date("2026-07-20T22:00:00.000Z"),
        },
      ],
    });
  }),

  http.get(apiTarget("/v1/users/:userId"), ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.userId,
        user: "john_doe",
        name: "John Doe",
        email: "john@example.com",
        isEnabled: true,
        isDeleted: false,
        createdAt: new Date("2026-07-20T22:00:00.000Z"),
      },
    });
  }),

  http.put(apiTarget("/v1/users/:userId/disable"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  http.put(apiTarget("/v1/users/:userId/enable"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  http.delete(apiTarget("/v1/users/:userId"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  http.post(apiTarget("/v1/users/:userId/recovery-link"), () => {
    return HttpResponse.json({
      data: { recoveryUrl: "http://example.com/recovery" },
    });
  }),

  http.get(apiTarget("/v1/users/:userId/roles"), () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "Admin" },
        { id: 2, name: "User" },
      ],
    });
  }),

  http.get(apiTarget("/v1/users/:userId/roles/details"), () => {
    return HttpResponse.json({
      data: [{ id: 1, name: "Admin" }],
    });
  }),

  http.post(apiTarget("/v1/users/:userId/roles"), () => {
    return HttpResponse.json({
      data: { userId: "123", roleId: 1 },
    });
  }),

  http.delete(apiTarget("/v1/users/:userId/roles/:roleId"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  // Role Management Handlers
  http.get(apiTarget("/v1/roles"), () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "Admin" },
        { id: 2, name: "User" },
      ],
    });
  }),

  http.post(apiTarget("/v1/roles"), () => {
    return HttpResponse.json({
      data: { id: 3, name: "NewRole" },
    });
  }),

  http.get(apiTarget("/v1/roles/:roleId"), ({ params }) => {
    return HttpResponse.json({
      data: { id: Number(params.roleId) || 1, name: "Admin" },
    });
  }),

  http.put(apiTarget("/v1/roles/:roleId"), ({ params }) => {
    return HttpResponse.json({
      data: { id: Number(params.roleId) || 1, name: "Admin" },
    });
  }),

  http.delete(apiTarget("/v1/roles/:roleId"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  // Role Permission Handlers
  http.get(apiTarget("/v1/roles/:roleId/permissions"), () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "READ_PRIVILEGES" },
        { id: 2, name: "WRITE_PRIVILEGES" },
      ],
    });
  }),

  http.post(apiTarget("/v1/roles/:roleId/permissions"), () => {
    return HttpResponse.json({
      data: { roleId: 123, permissionId: 42 },
    });
  }),

  http.delete(apiTarget("/v1/roles/:roleId/permissions/:permissionId"), () => {
    return HttpResponse.json({
      data: null,
    });
  }),

  // Metrics (Visits)
  http.post(apiTarget("/v1/visits"), () => {
    return HttpResponse.json({ data: null });
  }),

  // Languages Management
  http.get(languagesApiTarget("/v1/admin/languages"), () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "English", code: "en", isEnabled: true, isDefault: true },
        { id: 2, name: "Spanish", code: "es", isEnabled: false, isDefault: false },
      ],
    });
  }),

  http.delete(languagesApiTarget("/v1/admin/languages/:languageId"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.put(languagesApiTarget("/v1/admin/languages/:languageId"), async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      data: {
        id: body.id || 1,
        name: body.name || "English",
        code: body.code || "en",
        isEnabled: body.isEnabled !== false,
        isDefault: !!body.isDefault,
      },
    });
  }),

  // Permission Management
  http.get(apiTarget("/v1/permissions"), () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "READ_PRIVILEGES", label: "Read" },
        { id: 2, name: "WRITE_PRIVILEGES", label: "Write" },
      ],
    });
  }),

  // Microservices Management
  http.get(apiTarget("/v1/micro-services"), () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "Service A", status: "running", url: "http://service-a" },
        { id: "2", name: "Service B", status: "stopped", url: "http://service-b" },
      ],
    });
  }),

  http.get(apiTarget("/v1/microservices"), () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "Service A", status: "running", url: "http://service-a" },
        { id: "2", name: "Service B", status: "stopped", url: "http://service-b" },
      ],
    });
  }),

  http.put(apiTarget("/v1/micro-services/:microserviceId/start"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.post(apiTarget("/v1/microservices/:microserviceId/start"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.put(apiTarget("/v1/micro-services/:microserviceId/restart"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.post(apiTarget("/v1/microservices/:microserviceId/restart"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.put(apiTarget("/v1/micro-services/:microserviceId/stop"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.post(apiTarget("/v1/microservices/:microserviceId/stop"), () => {
    return HttpResponse.json({ data: null });
  }),

  // Projects Management
  http.get(projectsApiTarget("/v1/admin/projects"), () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "Project One", description: "First project" },
        { id: 2, name: "Project Two", description: "Second project" },
      ],
    });
  }),

  http.get(projectsApiTarget("/v1/projects"), () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "Project One", description: "First project" },
        { id: 2, name: "Project Two", description: "Second project" },
      ],
    });
  }),

  http.put(projectsApiTarget("/v1/admin/projects/:projectId"), async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ data: body });
  }),

  http.put(projectsApiTarget("/v1/projects/:projectId"), async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ data: body });
  }),

  http.delete(projectsApiTarget("/v1/admin/projects/:projectId"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.delete(projectsApiTarget("/v1/projects/:projectId"), () => {
    return HttpResponse.json({ data: null });
  }),

  // Models Management
  http.get(projectsApiTarget("/v1/admin/models"), () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "Model One", description: "First model" },
        { id: "2", name: "Model Two", description: "Second model" },
      ],
    });
  }),

  http.get(projectsApiTarget("/v1/models"), () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "Model One", description: "First model" },
        { id: "2", name: "Model Two", description: "Second model" },
      ],
    });
  }),

  http.put(projectsApiTarget("/v1/admin/models/:modelId"), async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ data: body });
  }),

  http.put(projectsApiTarget("/v1/models/:modelId"), async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ data: body });
  }),

  http.delete(projectsApiTarget("/v1/admin/models/:modelId"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.delete(projectsApiTarget("/v1/models/:modelId"), () => {
    return HttpResponse.json({ data: null });
  }),

  // Auth & Countries Handlers
  http.get(apiTarget("/auth/session-info"), () => {
    return HttpResponse.json({
      data: {
        user: {
          id: "1",
          user: "johndoe",
          name: "John Doe",
          email: "john@example.com",
          roles: ["Admin"],
          permissions: ["READ_PRIVILEGES"],
        },
        authToken: "fake-token",
      },
    });
  }),

  http.post(apiTarget("/auth/forgot-password"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.get(apiTarget("/auth/verify-token"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.post(apiTarget("/auth/reset-password"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.get(apiTarget("/auth/my-account"), () => {
    return HttpResponse.json({
      data: {
        id: "1",
        user: "johndoe",
        name: "John Doe",
        email: "john@example.com",
        countryCode: "US",
        countryName: "United States",
      },
    });
  }),

  http.put(apiTarget("/auth/my-account/information"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.put(apiTarget("/auth/password-update"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.post(apiTarget("/auth/redirects"), () => {
    return HttpResponse.json({ data: null });
  }),

  http.get(apiTarget("/v1/countries"), () => {
    return HttpResponse.json({
      data: [
        { code: "US", name: "United States", latitude: 37.0902, longitude: -95.7129 },
        { code: "FR", name: "France", latitude: 46.2276, longitude: 2.2137 },
      ],
    });
  }),
];
