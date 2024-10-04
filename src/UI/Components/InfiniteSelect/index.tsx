import { useState } from "react";
import { Spinner } from "react-bootstrap";

import useListenOutsideClicks from "@/UI/Hooks/useListenOutsideClicks";
import { SelectOptionProps, SelectProps } from "./index.types";

export const InfiniteSelect = <ValueType,>({
  options,
  isFetchingOptions,
  lastOptionRef,
  isSearchable,
  searchInput,
  selected = { label: "", value: "" as any },
  placeholder = "Select",
  handleSelect,
  setSearchInput,
}: SelectProps<ValueType>) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropDown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const { elementRef } = useListenOutsideClicks(closeDropdown);

  const renderNoOptions = () => {
    if (isFetchingOptions) return <Spinner />;

    return (
      <div className="relative cursor-default select-none py-2 pl-3 pr-9">
        <span className="font-normal block truncate text-sm text-text-tertiary">
          No options available
        </span>
      </div>
    );
  };

  const renderOptions = (options: SelectOptionProps<ValueType>[]) => {
    return options?.length > 0
      ? options?.map((option, index) => {
          return (
            <button
              type="button"
              key={String(option.value) + String(index)}
              className="dropdown-item relative cursor-default select-none p-1 rounded-0 btn btn-light"
              onClick={() => {
                handleSelect(option);
                closeDropdown();
              }}
              ref={options?.length - 1 === index ? lastOptionRef : null}
            >
              <span title={option.label} className="truncate d-block w-100">
                {option.label}
              </span>
            </button>
          );
        })
      : renderNoOptions();
  };

  return (
    <div className="position-relative grow mb-3">
      <button onClick={toggleDropDown} className="text-start form-select">
        {isSearchable ? (
          <input
            type="text"
            className="block w-100 border-0"
            onChange={(ev) => {
              setSearchInput?.(ev.target.value);
            }}
            style={{ outline: "none" }}
            placeholder={placeholder}
            value={searchInput}
            title={selected?.label}
          />
        ) : (
          <>{selected?.label || placeholder}</>
        )}
      </button>

      {isDropdownOpen && (
        <div
          className="dropdown-menu w-100 overflow-auto d-flex flex-column p-1"
          style={{ maxHeight: "200px" }}
          ref={elementRef}
        >
          {renderOptions(options)}

          {isFetchingOptions && options?.length > 0 && <Spinner />}
        </div>
      )}
    </div>
  );
};
