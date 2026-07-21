export interface Model {
  id: string;
  projectId: string;
  projectName?: string;
  engineeringType?: string;
  name: string;
  type?: string;
  description?: string;
  author?: string;
  source?: string;
  owners?: ModelOwner[];
}

interface ModelOwner {
  id: string;
  name: string;
  email: string;
}
