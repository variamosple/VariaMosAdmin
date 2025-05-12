export interface Language {
  id?: number;
  name?: string;
  abstractSyntax?: JSON;
  concreteSyntax?: JSON;
  type?: string;
  stateAccept?: string;
  semantics?: JSON;
  createdAt?: Date;
  updatedAt?: Date;
  owners?: LanguageOwner[];
}

export interface LanguageOwner {
  id?: string;
  name?: string;
  email?: string;
  accessLevel?: string;
}
