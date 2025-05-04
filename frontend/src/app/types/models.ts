export interface WordPair { old: string; new: string; }

export interface ProcessConfig {
  source: string;
  destination: string;
  create_subfolder: boolean;
  folder_name?: string;
  use_timestamp: boolean;
  variants: boolean;
  rename: boolean;
  pairs: WordPair[];
}

// Nouveau pour diagnostic :
export interface MatchInfo {
  term: string;
  count?: number;
}

export interface DiagnosticEntry {
  path: string;
  is_dir: boolean;
  matches: MatchInfo[];
}
