export interface Labels {
  [label: string]: string;
}

export interface MicroService {
  id: string;
  names: string[];
  created: Date;
  labels: Labels;
  state: string;
  status: string;
}
