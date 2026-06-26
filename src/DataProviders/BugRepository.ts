import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";

import { Bug, BugStatusLog } from "@/Domain/Bug/Bug";
import { BugFilter } from "@/Domain/Bug/BugFilter";
import { ADMIN_CLIENT } from "@/Infrastructure/AxiosConfig";

export const queryBugs = (filter: BugFilter): Promise<ResponseModel<Bug[]>> => {
  return ADMIN_CLIENT.get("/bugs", { params: filter })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to query bugs, please try again later.",
        );
      }
    });
};

export const createBug = (
  title: string,
  description: string,
  priority: "low" | "medium" | "high",
  category: string,
  githubRepo?: string,
  file?: File,
): Promise<ResponseModel<Bug>> => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("priority", priority);
  formData.append("category", category);
  if (githubRepo) {
    formData.append("githubRepo", githubRepo);
  }
  if (file) {
    formData.append("file", file);
  }

  return ADMIN_CLIENT.post("/bugs", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to create bug, please try again later.",
        );
      }
    });
};

export const queryBugHistory = (
  bugId: string,
): Promise<ResponseModel<BugStatusLog[]>> => {
  return ADMIN_CLIENT.get(`/bugs/${bugId}/history`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to query bug history, please try again later.",
        );
      }
    });
};

export const updateBugStatus = (
  bugId: string,
  status: string,
  comment?: string,
  title?: string,
  description?: string,
  priority?: string,
  category?: string,
  githubRepo?: string,
): Promise<ResponseModel<Bug>> => {
  return ADMIN_CLIENT.post(`/bugs/${bugId}/status`, {
    status,
    comment,
    title,
    description,
    priority,
    category,
    githubRepo,
  })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to update bug status, please try again later.",
        );
      }
    });
};

export const addBugNote = (
  bugId: string,
  body: string,
): Promise<ResponseModel<any>> => {
  return ADMIN_CLIENT.post(`/bugs/${bugId}/notes`, { body })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to add bug comment, please try again later.",
        );
      }
    });
};

export const queryBugRepos = (): Promise<ResponseModel<string[]>> => {
  return ADMIN_CLIENT.get("/bugs/repos")
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to query bug repositories, please try again later.",
        );
      }
    });
};

export const queryCategories = (): Promise<ResponseModel<string[]>> => {
  return ADMIN_CLIENT.get("/bugs/categories")
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to query bug categories, please try again later.",
        );
      }
    });
};

export const syncBugs = (): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/bugs/sync")
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to synchronize bugs, please try again later.",
        );
      }
    });
};

export const queryLocalBugs = (filter: BugFilter): Promise<ResponseModel<Bug[]>> => {
  return ADMIN_CLIENT.get("/bugs/local", { params: filter })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to query local bugs, please try again later.",
        );
      }
    });
};

export const rejectLocalBug = (id: string): Promise<ResponseModel<Bug>> => {
  return ADMIN_CLIENT.post(`/bugs/${id}/reject`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to reject local bug, please try again later.",
        );
      }
    });
};

export const restoreLocalBug = (id: string): Promise<ResponseModel<Bug>> => {
  return ADMIN_CLIENT.post(`/bugs/${id}/restore`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to restore local bug, please try again later.",
        );
      }
    });
};

export const uploadAttachment = (
  bugId: string,
  file: File,
): Promise<ResponseModel<any>> => {
  const formData = new FormData();
  formData.append("file", file);
  return ADMIN_CLIENT.post(`/bugs/${bugId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to upload attachment, please try again later.",
        );
      }
    });
};

export const deleteAttachment = (
  attachmentId: string,
): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.delete(`/bugs/attachments/${attachmentId}`)
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        const response = error.response?.data;
        if (!!response) return response;
        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Network/communication error.",
        );
      } else {
        console.error("Unexpected error:", error);
        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to delete attachment, please try again later.",
        );
      }
    });
};

