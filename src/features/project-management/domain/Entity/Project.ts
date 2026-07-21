export interface Project {
  id?: number;
  name?: string;
  description?: string;
  author?: string;
  source?: string;
  date?: Date;
  template?: boolean;
  project?: ProjectProject;
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
