import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ErrorInfo, type ReactNode, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Spinner } from "@/components/ui/spinner.tsx";
import { ErrorFallback } from "../error/error-fallback.tsx";

interface QueryBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: React.ComponentType<FallbackProps>;
  errorMessage?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export const QueryBoundary: React.FC<QueryBoundaryProps> = ({
  children,
  loadingFallback = <Spinner />,
  errorFallback,
  errorMessage,
  onError,
}) => {
  const ErrorComponent = errorFallback || ErrorFallback;

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          onError={onError}
          FallbackComponent={(props) => (
            <ErrorComponent {...props} customMessage={errorMessage} />
          )}
        >
          <Suspense fallback={loadingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
