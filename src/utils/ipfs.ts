// Pinata IPFS API configuration
const PINATA_API_URL = 'https://api.pinata.cloud';

// Types
export interface IPFSError extends Error {
  code?: string;
  details?: any;
  status?: number;
}

// Get Pinata API credentials from environment variables
function getPinataConfig() {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
  
  if (!apiKey || !secretKey) {
    const error: IPFSError = new Error(
      'Pinata API credentials not found. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_API_KEY in your environment variables.'
    );
    error.code = 'MISSING_CREDENTIALS';
    throw error;
  }
  
  return { apiKey, secretKey };
}

// Helper function to handle API errors
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = 'Failed to upload to IPFS';
  let errorCode = 'UPLOAD_FAILED';
  let details: any = null;
  
  try {
    const errorData = await response.json();
    details = errorData;
    errorMessage = errorData.error?.message || errorData.error || JSON.stringify(errorData);
    errorCode = errorData.error?.code || errorCode;
  } catch (e) {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }
  
  const error: IPFSError = new Error(errorMessage);
  error.code = errorCode;
  error.details = details;
  error.status = response.status;
  
  console.error('IPFS API Error:', {
    status: response.status,
    statusText: response.statusText,
    code: errorCode,
    details,
  });
  
  throw error;
}

// Upload files to Pinata IPFS
export async function uploadFiles(files: File[]): Promise<string[]> {
  const { apiKey, secretKey } = getPinataConfig();
  const results: string[] = [];
  
  // Upload each file individually to get individual CIDs
  for (const file of files) {
    const formData = new FormData();
    
    // Add file with the field name 'file' as required by Pinata
    formData.append('file', file);
    
    // Add pinata metadata with the original filename
    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        originalName: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size.toString(),
      },
    });
    formData.append('pinataMetadata', pinataMetadata);
    
    // Add pinata options
    const pinataOptions = JSON.stringify({
      cidVersion: 0, // Use CIDv0 for better compatibility
      wrapWithDirectory: false,
    });
    formData.append('pinataOptions', pinataOptions);
    
    try {
      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type header - let the browser set it with the correct boundary
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey,
        },
        body: formData,
      });
      
      if (!response.ok) {
        await handleApiError(response);
        continue;
      }
      
      const result = await response.json();
      
      if (!result.IpfsHash) {
        console.warn('No IPFS hash returned for file:', file.name);
        continue;
      }
      
      results.push(`ipfs://${result.IpfsHash}`);
      
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      // Continue with next file even if one fails
      continue;
    }
  }
  
  if (results.length === 0) {
    throw new Error('Failed to upload any files to IPFS');
  }
  
  return results;
}

// Upload JSON metadata to Pinata IPFS
export async function uploadMetadata(metadata: Record<string, any>): Promise<string> {
  const { apiKey, secretKey } = getPinataConfig();
  
  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: 'metadata.json',
        },
      }),
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    const result = await response.json();
    
    if (!result.IpfsHash) {
      const error: IPFSError = new Error('No IPFS hash returned from Pinata');
      error.code = 'NO_IPFS_HASH';
      throw error;
    }
    
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to Pinata IPFS:', error);
    
    const ipfsError: IPFSError = error instanceof Error 
      ? error as IPFSError 
      : new Error('Failed to upload metadata to IPFS');
      
    if (!ipfsError.code) {
      ipfsError.code = 'METADATA_UPLOAD_FAILED';
    }
    
    throw ipfsError;
  }
}

// Helper to extract CID from IPFS URL
export function extractCID(ipfsUrl: string): string | null {
  if (!ipfsUrl) return null;
  
  // Handle ipfs:// and ipfs/ipfs/ formats
  const match = ipfsUrl.match(/ipfs:?\/\/([^/]+)/) || 
                ipfsUrl.match(/ipfs\/([^/]+)/);
                
  return match ? match[1] : null;
}

// Helper to format IPFS gateway URL
export function getIPFSGatewayUrl(ipfsUrl: string, gateway = 'https://ipfs.io/ipfs/'): string {
  const cid = extractCID(ipfsUrl);
  return cid ? `${gateway}${cid}` : '';
}
