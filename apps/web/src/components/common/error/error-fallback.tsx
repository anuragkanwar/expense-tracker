import type { FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps extends FallbackProps {
  customMessage?: string;
  showRetry?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  customMessage,
  showRetry = true,
}) => {
  return (
    <div
      className="p-4 border border-red-300 bg-red-50 rounded-lg"
      role="alert"
    >
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        {customMessage || "Something went wrong"}
      </h2>

      <div className="text-red-700 mb-4">
        <p>{error.message}</p>
      </div>

      {showRetry && (
        <div className="flex gap-2">
          <Button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Reload page
          </Button>
        </div>
      )}
    </div>
  );
};
