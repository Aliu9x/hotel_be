import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
export enum FolderType {
  AVATAR = 'AVATAR',

  HOTEL_THUMBNAIL = 'HOTEL_THUMBNAIL',
  HOTEL_SLIDER = 'HOTEL_SLIDER',

  ROOM_TYPE_THUMBNAIL = 'ROOM_TYPE_THUMBNAIL',
  ROOM_TYPE_SLIDER = 'ROOM_TYPE_SLIDER',
}

export class CommitFileDto {
  @IsString()
  @IsNotEmpty()
  tmpFileName!: string;

  @IsOptional()
  @IsString()
  originalName?: string;
}

export class CommitUploadDto {
  @IsEnum(FolderType)
  folderType!: FolderType;


  @IsOptional()
  @IsString()
  roomTypeId?: string;


  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitFileDto)
  files!: CommitFileDto[];
}

