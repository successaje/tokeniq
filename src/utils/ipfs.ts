// Pinata IPFS API configuration
const PINATA_API_URL = 'https://api.pinata.cloud';

// Get Pinata API credentials from environment variables
function getPinataConfig() {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
  
  if (!apiKey || !secretKey) {
    throw new Error('Pinata API credentials not found. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_API_KEY in your environment variables.');
  }
  
  return { apiKey, secretKey };
}

// Upload files to Pinata IPFS
async function uploadFiles(files: File[]): Promise<string[]> {
  const { apiKey, secretKey } = getPinataConfig();
  const formData = new FormData();
  
  // Add files to form data
  files.forEach((file, index) => {
    formData.append(`file${index}`, file);
  });
  
  // Add pinata metadata
  const pinataMetadata = JSON.stringify({
    name: 'Tokenized Assets',
  });
  formData.append('pinataMetadata', pinataMetadata);
  
  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.details || 'Failed to upload files to Pinata');
    }
    
    const result = await response.json();
    
    // Return an array of IPFS URLs for each file
    return result.IpfsHash ? [`ipfs://${result.IpfsHash}`] : [];
  } catch (error) {
    console.error('Error uploading files to Pinata IPFS:', error);
    throw new Error('Failed to upload files to IPFS');
  }
}

// Upload JSON metadata to Pinata IPFS
async function uploadMetadata(metadata: Record<string, any>): Promise<string> {
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
      const error = await response.json();
      throw new Error(error.error?.details || 'Failed to upload metadata to Pinata');
    }
    
    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to Pinata IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

export { uploadFiles, uploadMetadata };
