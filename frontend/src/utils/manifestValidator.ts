import type { BaselineManifest, ManifestFileEntry } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  manifest?: BaselineManifest;
  warnings?: string[];
}

const SHA256_REGEX = /^[a-fA-F0-9]{64}$/;

export const validateManifestJson = (rawContent: string): ValidationResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    return {
      isValid: false,
      error: `Invalid JSON syntax: ${(err as Error).message}`,
    };
  }

  return validateManifestObject(parsed);
};

export const validateManifestObject = (data: unknown): ValidationResult => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      error: 'Manifest root must be a JSON object',
    };
  }

  const obj = data as Record<string, unknown>;

  // Check manifestVersion
  if (typeof obj.manifestVersion !== 'number') {
    return {
      isValid: false,
      error: "Missing or invalid 'manifestVersion' (must be a number, e.g. 1)",
    };
  }
  if (obj.manifestVersion !== 1) {
    return {
      isValid: false,
      error: `Unsupported manifestVersion: ${obj.manifestVersion}. Supported version is 1.`,
    };
  }

  // Check algorithm
  if (typeof obj.algorithm !== 'string') {
    return {
      isValid: false,
      error: "Missing 'algorithm' property",
    };
  }
  const algo = obj.algorithm.trim().toUpperCase();
  if (algo !== 'SHA-256' && algo !== 'SHA256') {
    return {
      isValid: false,
      error: `Unsupported algorithm: '${obj.algorithm}'. Only 'SHA-256' is supported.`,
    };
  }

  // Check createdAt
  if (!obj.createdAt || typeof obj.createdAt !== 'string') {
    return {
      isValid: false,
      error: "Missing or invalid 'createdAt' timestamp",
    };
  }

  // Check files array
  if (!Array.isArray(obj.files)) {
    return {
      isValid: false,
      error: "Manifest 'files' property must be an array of file entries",
    };
  }

  if (obj.files.length === 0) {
    return {
      isValid: false,
      error: "Manifest 'files' array is empty. At least one file entry is required.",
    };
  }

  // Validate each file entry
  const pathSet = new Set<string>();
  const validatedFiles: ManifestFileEntry[] = [];

  for (let i = 0; i < obj.files.length; i++) {
    const item = obj.files[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return {
        isValid: false,
        error: `File entry at index ${i} is not a valid object`,
      };
    }

    const fileEntry = item as Record<string, unknown>;
    const pathProp = fileEntry.path ?? fileEntry.filename;

    if (typeof pathProp !== 'string' || !pathProp.trim()) {
      return {
        isValid: false,
        error: `File entry #${i + 1} is missing a valid 'path' or 'filename' string`,
      };
    }

    const cleanPath = pathProp.trim();

    // Check for duplicate paths
    const normalizedKey = cleanPath.toLowerCase();
    if (pathSet.has(normalizedKey)) {
      return {
        isValid: false,
        error: `Duplicate path detected in manifest: '${cleanPath}' at index ${i + 1}`,
      };
    }
    pathSet.add(normalizedKey);

    // Validate size
    if (typeof fileEntry.size !== 'number' || isNaN(fileEntry.size) || fileEntry.size < 0) {
      return {
        isValid: false,
        error: `File entry '${cleanPath}' has an invalid size (${fileEntry.size}). Must be a non-negative number.`,
      };
    }

    // Validate sha256 hash
    const hashProp = fileEntry.sha256 ?? fileEntry.hash;
    if (typeof hashProp !== 'string' || !SHA256_REGEX.test(hashProp.trim())) {
      return {
        isValid: false,
        error: `File entry '${cleanPath}' has an invalid SHA-256 hash. Must be a 64-character hexadecimal string.`,
      };
    }

    validatedFiles.push({
      path: cleanPath,
      size: fileEntry.size,
      sha256: (hashProp as string).trim().toLowerCase(),
    });
  }

  const manifest: BaselineManifest = {
    manifestVersion: 1,
    algorithm: 'SHA-256',
    createdAt: obj.createdAt as string,
    files: validatedFiles,
    description: typeof obj.description === 'string' ? obj.description : undefined,
  };

  return {
    isValid: true,
    manifest,
  };
};
