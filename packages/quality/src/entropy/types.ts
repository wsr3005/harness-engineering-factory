export interface Deviation {
  principle: string;
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  description: string;
  suggestedFix: string;
}

export interface ScanResult {
  timestamp: string;
  deviations: Deviation[];
  summary: {
    total: number;
    byPrinciple: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

export interface StaleDoc {
  file: string;
  brokenLinks: Array<{ linkText: string; targetPath: string; lineNumber: number }>;
  lastModified: string;
}

export interface DocGardenResult {
  timestamp: string;
  staleDocuments: StaleDoc[];
  totalBrokenLinks: number;
  totalFilesChecked: number;
}

export interface CleanupPR {
  title: string;
  body: string;
  branch: string;
  files: string[];
  deviations: Deviation[];
}
