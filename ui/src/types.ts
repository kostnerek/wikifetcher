export interface Settings {
  id: number;
  cronExpression: string;
  maxVersionsToKeep: number;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
  withImages: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Download {
  id: number;
  languageId: number;
  language?: Language;
  fileName: string;
  fileSize: number;
  filePath: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  isActive: boolean;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface KiwixStatus {
  running: boolean;
  state: string;
  activeFiles: {
    language: string;
    languageCode: string;
    fileName: string;
    fileSize: number;
  }[];
}

export interface ZimEntry {
  fileName: string;
  url: string;
  hasImages: boolean;
  lang: string;
}

export interface PaginatedDownloads {
  data: Download[];
  total: number;
}
