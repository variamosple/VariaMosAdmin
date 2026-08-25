export interface Model {
  id?: string;
  projectId: string;
  projectName?: string;
  engineeringType?: string;
  name: string;
  type?: string;
  description?: string;
  author?: string;
  source?: string;
  owners?: ModelOwner[];
  isDeleted?: boolean;
  modelLevel?: string;
  isPublic?: boolean;
  languageId?: number;
}

interface ModelOwner {
  id: string;
  name: string;
  email: string;
}
