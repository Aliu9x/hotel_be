import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { join } from 'path';
import { CommitUploadDto, FolderType } from './dto/create-file.dto';
import {
  detectMimeFromPath,
  extFromMime,
  isAllowedMime,
  isSubPath,
} from './util/mime.util';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelImage } from 'src/hotels/entities/hotel-image.entity';
import { DataSource, Repository } from 'typeorm';
import { IUser } from 'src/interfaces/customize.interface';
import { RoomTypeImage } from 'src/room-types/entities/room-type-image.entity';

export interface FinalFileInfo {
  finalFileName: string;
  finalRelativePath: string;
  originalName?: string;
}
export interface ImageRepository {
  deleteByFileName?(fileName: string): Promise<number>;
  deleteByRelativePaths?(relativePaths: string[]): Promise<number>;
}
@Injectable()
export class FilesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HotelImage)
    private readonly hotelImageRepo: Repository<HotelImage>,
    @InjectRepository(RoomTypeImage)
    private readonly roomTypeImageRepo: Repository<RoomTypeImage>,
  ) {}
  private getRootPath = () => process.cwd();

  private getTmpDir() {
    return path.join(this.getRootPath(), 'public', 'images', 'tmp');
  }

  private ensureDir(p: string) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
  private toRelativePublicPath(absPath: string): string {
    const publicRoot = join(this.getRootPath(), 'public');
    const rel = path.relative(publicRoot, absPath);
    return `/${rel.replace(/\\/g, '/')}`;
  }
  private buildTargetDir(input: CommitUploadDto, user: IUser): string {
    const base = path.join(this.getRootPath(), 'public', 'images');
    switch (input.folderType) {
      case FolderType.AVATAR: {
        if (!user.id) {
          throw new BadRequestException('userId is required for AVATAR');
        }
        return path.join(base, 'users', user.id);
      }
      case FolderType.HOTEL_THUMBNAIL:
      case FolderType.HOTEL_SLIDER: {
        if (!user.hotel_id) {
          throw new BadRequestException('hotelId is required for hotel images');
        }
        return path.join(base, 'hotel', user.hotel_id);
      }
      case FolderType.ROOM_TYPE_THUMBNAIL:
      case FolderType.ROOM_TYPE_SLIDER: {
        if (!input.roomTypeId) {
          throw new BadRequestException(
            'roomTypeId is required for roomType images',
          );
        }
        return path.join(
          base,
          'hotel',
          user.hotel_id,
          'roomType',
          input.roomTypeId,
        );
      }

      default:
        throw new BadRequestException('Unsupported folderType');
    }
  }
  private pickSingle(results: FinalFileInfo[], ctx: string): FinalFileInfo {
    if (!results.length)
      throw new BadRequestException(`No file to save for ${ctx}`);
    if (results.length !== 1)
      throw new BadRequestException(`Exactly 1 file required for ${ctx}`);
    return results[0];
  }

  private validateBusinessRules(input: CommitUploadDto) {
    const isThumb =
      input.folderType === FolderType.HOTEL_THUMBNAIL ||
      input.folderType === FolderType.ROOM_TYPE_THUMBNAIL;

    if (isThumb && input.files.length !== 1) {
      throw new BadRequestException(
        'Exactly 1 file required for thumbnail commit',
      );
    }

    const isSlider =
      input.folderType === FolderType.HOTEL_SLIDER ||
      input.folderType === FolderType.ROOM_TYPE_SLIDER;

    if (isSlider && input.files.length < 1) {
      throw new BadRequestException(
        'At least 1 file required for slider commit',
      );
    }
  }

  private storedToName(stored: string | null | undefined): string | null {
    if (!stored) return null;
    return path.basename(stored);
  }

  async commitAndApplyUploads(
    input: CommitUploadDto,
    user: IUser,
  ): Promise<FinalFileInfo[]> {
    if (!input.files?.length) {
      throw new BadRequestException('No files to commit');
    }

    this.validateBusinessRules(input);

    const targetDir = this.buildTargetDir(input, user);
    this.ensureDir(targetDir);
    const tmpDir = this.getTmpDir();
    this.ensureDir(tmpDir);

    const results: FinalFileInfo[] = [];

    for (const f of input.files) {
      const src = path.join(tmpDir, f.tmpFileName);

      try {
        await fsp.access(src, fs.constants.F_OK);
      } catch {
        throw new BadRequestException(`Temp file not found: ${f.tmpFileName}`);
      }

      const mime = await detectMimeFromPath(src);
      if (!isAllowedMime(mime)) {
        await fsp.unlink(src).catch(() => {});
        throw new BadRequestException(
          `File MIME not allowed: ${mime ?? 'unknown'}`,
        );
      }

      const extExpected = extFromMime(mime!);
      const extActual = path.extname(f.tmpFileName).slice(1).toLowerCase();
      if (extExpected && extActual && extExpected !== extActual) {
        await fsp.unlink(src).catch(() => {});
        throw new BadRequestException(
          `File extension mismatch: expected .${extExpected} but got .${extActual}`,
        );
      }

      const finalName = f.tmpFileName;
      const finalAbs = path.join(targetDir, finalName);

      try {
        await fsp.rename(src, finalAbs);
      } catch (e: any) {
        if (e?.code === 'EXDEV') {
          await fsp.copyFile(src, finalAbs);
          await fsp.unlink(src).catch(() => {});
        } else {
          throw new InternalServerErrorException(
            `Failed to move file ${f.tmpFileName}`,
          );
        }
      }

      const rel = this.toRelativePublicPath(finalAbs);
      results.push({
        finalFileName: finalName,
        finalRelativePath: rel,
        originalName: f.originalName,
      });
    }

    const unlinkIfExists = async (absPath: string | null | undefined) => {
      if (!absPath) return;
      try {
        await fsp.unlink(absPath);
      } catch {}
    };

    switch (input.folderType) {
      case FolderType.HOTEL_THUMBNAIL: {
        if (!user.hotel_id)
          throw new BadRequestException('hotelId is required');
        const hotelId = String(user.hotel_id);
        const file = this.pickSingle(results, 'HOTEL_THUMBNAIL');
        const newName = file.finalFileName;

        await this.dataSource.transaction(async (manager) => {
          const existing = await manager.findOne(HotelImage, {
            where: { hotel_id: hotelId, is_cover: true },
          });

          const existingName = this.storedToName(existing?.file_name);

          if (existingName && existingName !== newName) {
            await unlinkIfExists(path.join(targetDir, existingName));
            await manager.delete(HotelImage, { id: (existing as any).id });
          }

          if (existingName && existingName === newName) return;

          const entity = manager.create(HotelImage, {
            hotel_id: hotelId,
            fileName: newName,
            is_cover: true,
          });
          await manager.save(HotelImage, entity);
        });
        break;
      }

      case FolderType.ROOM_TYPE_THUMBNAIL: {
        if (!input.roomTypeId)
          throw new BadRequestException('roomTypeId is required');
        const roomTypeId = String(input.roomTypeId);
        const file = this.pickSingle(results, 'ROOM_TYPE_THUMBNAIL');
        const newName = file.finalFileName;

        await this.dataSource.transaction(async (manager) => {
          const existing = await manager.findOne(RoomTypeImage, {
            where: { room_type_id: roomTypeId, is_cover: true },
          });

          const existingName = this.storedToName((existing as any)?.file_name);

          if (existingName && existingName !== newName) {
            await unlinkIfExists(path.join(targetDir, existingName));
            await manager.delete(RoomTypeImage, { id: (existing as any).id });
          }

          if (existingName && existingName === newName) return;

          const entity = manager.create(RoomTypeImage, {
            hotel_id: user.hotel_id,
            room_type_id: roomTypeId,
            file_name: newName,
            is_cover: true,
          });
          await manager.save(RoomTypeImage, entity);
        });
        break;
      }

      case FolderType.HOTEL_SLIDER: {
        if (!user.hotel_id)
          throw new BadRequestException('hotelId is required');
        const hotelId = String(user.hotel_id);
        const newNames = results.map((r) => r.finalFileName);

        await this.dataSource.transaction(async (manager) => {
          // Load toàn bộ slider cũ
          const existing = await manager.find(HotelImage, {
            where: { hotel_id: hotelId, is_cover: false },
          });

          // Xóa file cũ trên disk (dùng basename để tương thích dữ liệu cũ còn lưu path)
          for (const ex of existing) {
            const name = this.storedToName(ex.file_name);
            if (name) await unlinkIfExists(path.join(targetDir, name));
          }

          // Xóa record DB cũ
          await manager
            .createQueryBuilder()
            .delete()
            .from(HotelImage)
            .where('hotel_id = :hotelId AND is_cover = false', { hotelId })
            .execute();
          if (newNames.length) {
            const entities = newNames.map((name) =>
              this.hotelImageRepo.create({
                hotel_id: hotelId,
                file_name: name, 
                is_cover: false,
              }),
            );
            await manager.save(HotelImage, entities);
          }
        });
        break;
      }

      case FolderType.ROOM_TYPE_SLIDER: {
        if (!input.roomTypeId)
          throw new BadRequestException('roomTypeId is required');
        const roomTypeId = String(input.roomTypeId);
        const newNames = results.map((r) => r.finalFileName);

        await this.dataSource.transaction(async (manager) => {
          const existing = await manager.find(RoomTypeImage, {
            where: { room_type_id: roomTypeId, is_cover: false },
          });

          for (const ex of existing) {
            const name = this.storedToName((ex as any).file_name);
            if (name) await unlinkIfExists(path.join(targetDir, name));
          }

          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomTypeImage)
            .where('room_type_id = :roomTypeId AND is_cover = false', {
              roomTypeId,
            })
            .execute();

          if (newNames.length) {
            const entities = newNames.map((name) =>
              this.roomTypeImageRepo.create({
                hotel_id: user.hotel_id,
                room_type_id: roomTypeId,
                file_name: name,
                is_cover: false,
              }),
            );
            await manager.save(RoomTypeImage, entities);
          }
        });
        break;
      }

      case FolderType.AVATAR:
      default:
        break;
    }

    return results;
  }
}
