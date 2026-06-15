/**
 * Safely reads a File object as an ArrayBuffer, with a retry mechanism for mobile browsers
 * where the file content resolver might have temporary access latency or locking.
 * 
 * @param file The File object to read.
 * @param retries Number of times to retry reading before failing.
 * @param delayMs Delay in milliseconds between retry attempts.
 */
export const readFileAsArrayBufferWithRetry = (
  file: File,
  retries = 3,
  delayMs = 300
): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryRead = () => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result as ArrayBuffer;
        if (result) {
          resolve(result);
        } else {
          handleFailure(new Error('Empty ArrayBuffer returned from device.'));
        }
      };

      reader.onerror = () => {
        handleFailure(reader.error || new Error('Unknown FileReader error.'));
      };

      const handleFailure = (error: any) => {
        attempt++;
        console.warn(`FileReader (ArrayBuffer) attempt ${attempt} failed for file "${file.name}":`, error);
        if (attempt < retries) {
          setTimeout(tryRead, delayMs);
        } else {
          reject(new Error(error.message || 'Failed to read file from your device.'));
        }
      };

      reader.readAsArrayBuffer(file);
    };

    tryRead();
  });
};

/**
 * Safely reads a File object as a Data URL, with a retry mechanism for mobile browsers
 * where the file content resolver might have temporary access latency or locking.
 * 
 * @param file The File object to read.
 * @param retries Number of times to retry reading before failing.
 * @param delayMs Delay in milliseconds between retry attempts.
 */
export const readFileAsDataURLWithRetry = (
  file: File,
  retries = 3,
  delayMs = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryRead = () => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          resolve(result);
        } else {
          handleFailure(new Error('Empty Data URL returned from device.'));
        }
      };

      reader.onerror = () => {
        handleFailure(reader.error || new Error('Unknown FileReader error.'));
      };

      const handleFailure = (error: any) => {
        attempt++;
        console.warn(`FileReader (DataURL) attempt ${attempt} failed for file "${file.name}":`, error);
        if (attempt < retries) {
          setTimeout(tryRead, delayMs);
        } else {
          reject(new Error(error.message || 'Failed to read file from your device.'));
        }
      };

      reader.readAsDataURL(file);
    };

    tryRead();
  });
};
