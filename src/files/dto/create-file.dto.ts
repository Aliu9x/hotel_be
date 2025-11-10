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
  hotelId?: string;

  @IsOptional()
  @IsString()
  roomTypeId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitFileDto)
  files!: CommitFileDto[];
}


export class SaveChangesDto {
  @IsEnum(FolderType)
  folderType!: FolderType;

  // HOTEL_MAIN, ROOM_TYPE_MAIN cần hotelId
  @IsOptional()
  @IsString()
  hotelId?: string;

  // ROOM_TYPE_MAIN: id của RoomCategoryEntity (đã chốt)
  @IsOptional()
  @IsString()
  roomCategoryId?: string;

  // AVATAR
  @IsOptional()
  @IsString()
  userId?: string;

  // Các file mới (đang ở tmp) cần commit khi Lưu
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitFileDto)
  add: CommitFileDto[] = [];

  // Các file đã commit bị chủ KS “xóa trong preview” (chỉ tên file)
  @IsArray()
  @IsString({ each: true })
  remove: string[] = [];
}

export class DeleteTempOneDto {
  @IsString()
  @IsNotEmpty()
  tmpFileName!: string;
}