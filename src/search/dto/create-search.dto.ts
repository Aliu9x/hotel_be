import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SuggestQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;

  @IsOptional()
  @IsString()
  types?: string;
}

export type SuggestType = 'hotel' | 'province' | 'district' | 'ward';

export interface SuggestHighlightPart {
  text: string;
  matched: boolean;
}

export interface SuggestItem {
  type: SuggestType;
  category: string;           
  id: number | string;
  label: string;
  label_parts: SuggestHighlightPart[];
  subtitle?: string;
  badge: string;              
  badge_color: string;       
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  hotel_id?: string | number;
}

export interface LocationNode {
  id: number | string;
  name: string;
  code?: string;
}

export interface SuggestHierarchy {
  province?: LocationNode;
  district?: LocationNode;
  ward?: LocationNode;
  hotel?: LocationNode;
}

export interface SuggestItem {
  type: SuggestType;
  category: string;
  id: number | string;
  label: string;
  label_parts: SuggestHighlightPart[];
  subtitle?: string;
  badge: string;
  badge_color: string;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  hotel_id?: string | number;
  hierarchy: SuggestHierarchy;
  full_path: string[];
  path_string: string;
}