export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0 || isNaN(bytes)) return 'N/A';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (isoString?: string): string => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const truncateHash = (hash?: string, lead = 10, trail = 8): string => {
  if (!hash) return '—';
  if (hash.length <= lead + trail + 3) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-trail)}`;
};
