import { queryMetric } from "@/DataProviders/MetricsRepository";
import { ResponseModel } from "@/Domain/Core/Entity/ResponseModel";
import { Metric } from "@/Domain/Metric/Metric";
import { MetricsFilter } from "@/Domain/Metric/MetricsFilter";
import { ChartDateFormProperties } from "@/UI/Components/Chart/ChartDateFilterForm";
import { createContext, FC, useCallback, useContext, useState } from "react";
import { useToast } from "./ToastContext";

interface IChartContext {
  metric: Metric;
  chartFilter: ChartDateFormProperties;
  isLoading: boolean;
  filterChartData: (
    chartFilter: ChartDateFormProperties
  ) => Promise<ResponseModel<Metric>>;
}

const ChartContext = createContext<IChartContext | undefined>(undefined);

export interface ChartContextProviderProps {
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
        new MetricsFilter(metric.id, chartFilter.fromDate, chartFilter.toDate)
      )
        .then((response) => {
          if (response.errorCode) {
            pushToast({
              title: "Error",
              message: response.message!,
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
    [metric, pushToast]
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
      "useChartContext must be used within a ChartContextProvider"
    );
  }
  return context;
};
export const withChartContextWrapper = (Component: FC<any>) => {
  return ({ metric, ...props }: { metric: Metric }) => (
    <ChartContextProvider metric={metric}>
      <Component {...props} />
    </ChartContextProvider>
  );
};
