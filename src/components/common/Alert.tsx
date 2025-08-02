import { useEffect } from "react";

interface AlertProps {
  show: boolean;
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

export default function Alert({
  show,
  type,
  message,
  onDismiss,
  autoHideDuration = 5000,
}: AlertProps) {
  useEffect(() => {
    if (show && autoHideDuration && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [show, autoHideDuration, onDismiss]);

  if (!show) return null;

  return (
    <div
      className={`rounded-md p-4 ${
        type === "success" ? "bg-green-500" : "bg-red-50 border border-red-200"
      }`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {type === "success" ? (
            <svg
              className="h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p
            className={`text-sm font-medium ${
              type === "success" ? "text-white" : "text-red-800"
            }`}
          >
            {message}
          </p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === "success"
                    ? "text-white hover:bg-green-600 focus:ring-offset-green-500 focus:ring-white"
                    : "text-red-500 hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600"
                }`}
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}