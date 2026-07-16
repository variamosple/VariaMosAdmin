export type SelectOptionProps<T> = {
  label: string;
  value: T;
};

export type SelectProps<T> = {
  options: SelectOptionProps<T>[];
  selected?: SelectOptionProps<T>;
  handleSelect: (option: SelectOptionProps<T>) => void;
  placeholder?: string;
  isFetchingOptions?: boolean;
  isSearchable?: boolean;
  searchInput?: string;
  lastOptionRef?: (node: Element | null) => void;
  setSearchInput?: (search: string) => void;
};
