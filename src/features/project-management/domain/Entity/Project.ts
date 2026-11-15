export interface Project {
  id?: string;
  name?: string;
  description?: string;
  author?: string;
  source?: string;
  // ISO text as the server sends it, or a Date
  date?: string | Date;
  template?: boolean;
  project?: ProjectProject;
  owners?: { id?: string; name?: string; email: string }[];
  isDeleted?: boolean;
}

interface ProjectProject {
  id: string;
  name: string;
  enable: boolean;
  productLines?: ProductLine[];
}

interface ProductLine {
  id: string;
  name: string;
  type: string;
  domain: string;
  domainEngineering?: DomainEngineering;
  applicationEngineering?: ApplicationEngineering;
}

interface DomainEngineering {
  models?: Model[];
}

interface ApplicationEngineering {
  models?: Model[];
}

interface Model {
  id: string;
  name: string;
  type: string;
}
