import { X, Check, Loader2, UploadCloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UploadStep = 'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';

interface UploadProgressProps {
  step: UploadStep;
  progress: number;
  currentFile?: string;
  totalFiles: number;
  uploadedFiles: number;
  error?: string;
  cid?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

const stepLabels: Record<UploadStep, string> = {
  idle: 'Ready to upload',
  preparing: 'Preparing files...',
  uploading: 'Uploading to IPFS...',
  processing: 'Processing...',
  completed: 'Upload complete!',
  error: 'Upload failed',
};

export function UploadProgress({
  step,
  progress,
  currentFile,
  totalFiles,
  uploadedFiles,
  error,
  cid,
  onRetry,
  onClose,
}: UploadProgressProps) {
  const isComplete = step === 'completed';
  const isError = step === 'error';
  const isUploading = step === 'uploading' || step === 'preparing' || step === 'processing';

  const getStepIcon = () => {
    if (isError) return <X className="h-5 w-5 text-destructive" />;
    if (isComplete) return <Check className="h-5 w-5 text-green-500" />;
    if (isUploading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    return <UploadCloud className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="w-full space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStepIcon()}
          <h3 className="font-medium">
            {isError ? 'Upload Failed' : stepLabels[step]}
          </h3>
        </div>
        {!isUploading && onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {currentFile || 'Processing...'}
            </span>
            <span className="font-medium">
              {uploadedFiles} of {totalFiles} files
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-right text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {isComplete && cid && (
        <div className="space-y-2">
          <div className="rounded-md bg-green-50 p-3 text-sm">
            <p className="font-medium text-green-800">Upload successful!</p>
            <p className="mt-1 truncate text-green-700">
              IPFS CID: <span className="font-mono">{cid}</span>
            </p>
            <a
              href={`https://ipfs.io/ipfs/${cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center text-sm text-green-600 hover:underline"
            >
              View on IPFS ↗
            </a>
          </div>
        </div>
      )}

      {isError && (
        <div className="space-y-3">
          <div className="rounded-md bg-red-50 p-3 text-sm">
            <p className="font-medium text-red-800">Something went wrong</p>
            <p className="mt-1 text-red-700">{error || 'Failed to upload files'}</p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
