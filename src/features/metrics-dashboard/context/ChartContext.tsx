import type { ResponseModel } from "@variamosple/variamos-components";
import {
  createContext,
  type FC,
  useCallback,
  useContext,
  useState,
} from "react";
import { useToast } from "@/shared/context/ToastContext";
import { queryMetric } from "../api/MetricsRepository";
import type { Metric } from "../domain/Entity/Metric";
import { MetricsFilter } from "../domain/Entity/MetricsFilter";

export interface ChartDateFormProperties {
  fromDate: string;
  toDate: string;
}

export interface ChartDateFilterFormProperties {
  onFilterSubmit: (data: ChartDateFormProperties) => void;
}

interface IChartContext {
  metric: Metric;
  chartFilter: ChartDateFormProperties;
  isLoading: boolean;
  filterChartData: (
    chartFilter: ChartDateFormProperties,
  ) => Promise<ResponseModel<Metric>>;
}

const ChartContext = createContext<IChartContext | undefined>(undefined);

interface ChartContextProviderProps {
  metric: Metric;
  children: React.ReactNode;
}

export const ChartContextProvider: FC<ChartContextProviderProps> = ({
  metric,
  children,
}) => {
  const { pushToast } = useToast();
  const [currentMetric, setCurrentMetric] = useState(metric);
  const [isLoading, setIsLoading] = useState(false);
  const [chartFilter, setChartFilter] = useState<ChartDateFormProperties>({
    fromDate: "",
    toDate: "",
  });

  const filterChartData = useCallback(
    (chartFilter: ChartDateFormProperties): Promise<ResponseModel<Metric>> => {
      setIsLoading(true);
      setChartFilter(chartFilter);

      return queryMetric(
        new MetricsFilter(metric.id, chartFilter.fromDate, chartFilter.toDate),
      )
        .then((response) => {
          if (response.errorCode) {
            pushToast({
              title: "Error",
              message: response.message || "An error occurred",
              variant: "danger",
            });
          }

          if (response.data) {
            setCurrentMetric(response.data);
          }

          return response;
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [metric, pushToast],
  );

  return (
    <ChartContext.Provider
      value={{
        metric: currentMetric,
        chartFilter,
        filterChartData,
        isLoading,
      }}
    >
      {children}
    </ChartContext.Provider>
  );
};

export const useChartContext = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error(
      "useChartContext must be used within a ChartContextProvider",
    );
  }
  return context;
};

export const withChartContextWrapper = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  const WrappedComponent = (props: P & { metric: Metric }) => {
    const { metric, ...restProps } = props;
    return (
      <ChartContextProvider metric={metric}>
        <Component {...(restProps as unknown as P)} />
      </ChartContextProvider>
    );
  };
  return WrappedComponent;
};
