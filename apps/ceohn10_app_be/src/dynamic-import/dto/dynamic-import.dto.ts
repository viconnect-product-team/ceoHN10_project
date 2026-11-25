export type SupportedEntityType =
  | 'member'
  | 'event_registration'
  | 'class'
  | 'teacher'
  | 'finance';

export type DynamicFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'switch'
  | 'select'
  | 'multi_select'
  | 'email'
  | 'phone'
  | 'url';

export type DuplicatePolicy = 'skip' | 'update' | 'create_new';

export interface FieldMappingItem {
  sourceColumn: string;
  targetFieldKey: string;
  targetFieldLabel: string;
  targetFieldType: DynamicFieldType;
  isCustomField: boolean;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  options?: string[];
  defaultValue?: any;
  transformation?: 'trim' | 'lowercase' | 'uppercase' | 'date_dmy' | 'currency_vnd' | 'none';
}

export class ParseFileDto {
  fileName!: string;
  fileType!: 'excel' | 'csv' | 'word' | 'pdf' | 'text';
  fileBase64?: string;
  rawText?: string;
  sheetName?: string;
  entityType?: SupportedEntityType;
  tables?: Array<{
    sheetName?: string;
    headers: string[];
    rows: Record<string, any>[];
    totalRows: number;
  }>;
}

export class ValidateImportDto {
  entityType!: SupportedEntityType;
  mappings!: FieldMappingItem[];
  rows!: Record<string, any>[];
  duplicatePolicy!: DuplicatePolicy;
  eventId?: string; // khi entityType = 'event_registration'
}

export class ExecuteImportDto {
  entityType!: SupportedEntityType;
  fileName!: string;
  fileType!: string;
  fileSize?: number;
  mappings!: FieldMappingItem[];
  rows!: Record<string, any>[];
  duplicatePolicy!: DuplicatePolicy;
  eventId?: string;
  templateName?: string;
  saveAsTemplate?: boolean;
  importedBy?: string;
}

export class SaveImportTemplateDto {
  templateName!: string;
  entityType!: SupportedEntityType;
  fileSignature?: string;
  mappings!: FieldMappingItem[];
  duplicatePolicy?: DuplicatePolicy;
  transformationRules?: Record<string, any>;
  createdBy?: string;
}
