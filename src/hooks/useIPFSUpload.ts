import { useState, useCallback } from 'react';
import { uploadFiles, uploadMetadata } from '@/utils/ipfs';

type UploadStep = 'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';

type UploadProgress = {
  step: UploadStep;
  progress: number;
  currentFile?: string;
  totalFiles: number;
  uploadedFiles: number;
  error?: string;
  cid?: string;
};

export function useIPFSUpload() {
  const [progress, setProgress] = useState<UploadProgress>({
    step: 'idle',
    progress: 0,
    totalFiles: 0,
    uploadedFiles: 0,
  });

  const updateProgress = useCallback((updates: Partial<UploadProgress>) => {
    setProgress(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const uploadToIPFS = useCallback(async (files: File[]) => {
    try {
      // Reset progress
      updateProgress({
        step: 'preparing',
        progress: 0,
        totalFiles: files.length,
        uploadedFiles: 0,
        error: undefined,
        cid: undefined,
      });

      // Simulate preparation step
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start uploading
      updateProgress({ step: 'uploading', progress: 10 });
      
      // Track progress for each file
      const uploadedHashes: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        updateProgress({
          currentFile: file.name,
          progress: 10 + (i / files.length) * 80,
          uploadedFiles: i,
        });

        try {
          const hashes = await uploadFiles([file]);
          if (hashes.length > 0) {
            uploadedHashes.push(hashes[0]);
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Final processing
      updateProgress({
        step: 'processing',
        progress: 95,
        uploadedFiles: files.length,
      });

      // Get the root CID (in a real implementation, you might want to create a directory structure)
      const rootCid = uploadedHashes[0]?.split('/').pop() || '';
      
      updateProgress({
        step: 'completed',
        progress: 100,
        cid: rootCid,
      });

      return uploadedHashes;
    } catch (error) {
      console.error('Upload failed:', error);
      updateProgress({
        step: 'error',
        error: error instanceof Error ? error.message : 'Failed to upload files',
        progress: 0,
      });
      throw error;
    }
  }, [updateProgress]);

  const uploadJSONToIPFS = useCallback(async (metadata: Record<string, any>) => {
    try {
      updateProgress({
        step: 'uploading',
        progress: 0,
        currentFile: 'metadata.json',
      });

      const cid = await uploadMetadata(metadata);
      
      updateProgress({
        step: 'completed',
        progress: 100,
        cid: cid.split('/').pop(),
      });

      return cid;
    } catch (error) {
      console.error('Metadata upload failed:', error);
      updateProgress({
        step: 'error',
        error: error instanceof Error ? error.message : 'Failed to upload metadata',
        progress: 0,
      });
      throw error;
    }
  }, [updateProgress]);

  const reset = useCallback(() => {
    setProgress({
      step: 'idle',
      progress: 0,
      totalFiles: 0,
      uploadedFiles: 0,
      error: undefined,
      cid: undefined,
      currentFile: undefined,
    });
  }, []);

  return {
    uploadToIPFS,
    uploadJSONToIPFS,
    progress,
    reset,
    isUploading: progress.step !== 'idle' && progress.step !== 'completed' && progress.step !== 'error',
    isComplete: progress.step === 'completed',
    isError: progress.step === 'error',
  };
}
