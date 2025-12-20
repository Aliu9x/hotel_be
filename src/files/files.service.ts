import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelImage } from 'src/hotels/entities/hotel-image.entity';
import { RoomTypeImage } from 'src/room-types/entities/room-type-image.entity';
import { CommitUploadDto, FolderType } from './dto/create-file.dto';
import {
  detectMimeFromPath,
  extFromMime,
  isAllowedMime,
} from './util/mime.util';

type FinalFileInfo = {
  finalFileName: string;
  finalRelativePath: string;
  originalName?: string;
};

const HOTEL_SLIDER_MAX = 20;
const ROOM_TYPE_SLIDER_MAX = 10;

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

  // Thư mục đích phẳng: hotel / roomType / avatar
  private buildTargetDir(input: CommitUploadDto): string {
    const base = path.join(this.getRootPath(), 'public', 'images');
    switch (input.folderType) {
      case FolderType.AVATAR:
        return path.join(base, 'avatar');
      case FolderType.HOTEL_THUMBNAIL:
      case FolderType.HOTEL_SLIDER:
        return path.join(base, 'hotel');
      case FolderType.ROOM_TYPE_THUMBNAIL:
      case FolderType.ROOM_TYPE_SLIDER:
        return path.join(base, 'roomType');
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

  private storedToName(stored: string | null | undefined): string | null {
    if (!stored) return null;
    return path.basename(stored);
  }

  // Ràng buộc số lượng file trong request
  private validateRequestCount(input: CommitUploadDto) {
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

  // Kiểm MIME + phần mở rộng cho các file thật sự được di chuyển (có trong tmp)
  private async validateAndMoveFromTmp(
    finalName: string,
    targetDir: string,
    tmpDir: string,
  ): Promise<FinalFileInfo> {
    const src = path.join(tmpDir, finalName);
    try {
      await fsp.access(src, fs.constants.F_OK);
    } catch {
      // Không có trong tmp: coi là file cũ giữ nguyên, không di chuyển; trả ra kết quả suy luận đường dẫn
      const finalAbs = path.join(targetDir, finalName);
      const rel = this.toRelativePublicPath(finalAbs);
      return {
        finalFileName: finalName,
        finalRelativePath: rel,
      };
    }

    const mime = await detectMimeFromPath(src);
    if (!isAllowedMime(mime)) {
      await fsp.unlink(src).catch(() => {});
      throw new BadRequestException(
        `File MIME not allowed: ${mime ?? 'unknown'}`,
      );
    }

    const extExpected = extFromMime(mime!);
    const extActual = path.extname(finalName).slice(1).toLowerCase();
    if (extExpected && extActual && extExpected !== extActual) {
      await fsp.unlink(src).catch(() => {});
      throw new BadRequestException(
        `File extension mismatch: expected .${extExpected} but got .${extActual}`,
      );
    }

    const finalAbs = path.join(targetDir, finalName);
    try {
      await fsp.rename(src, finalAbs);
    } catch (e: any) {
      if (e?.code === 'EXDEV') {
        await fsp.copyFile(src, finalAbs);
        await fsp.unlink(src).catch(() => {});
      } else {
        throw new InternalServerErrorException(
          `Failed to move file ${finalName}`,
        );
      }
    }

    const rel = this.toRelativePublicPath(finalAbs);
    return {
      finalFileName: finalName,
      finalRelativePath: rel,
    };
  }

  async commitAndApplyUploads(
    input: CommitUploadDto,
    user: { id?: string | number; hotel_id?: string | number },
  ): Promise<FinalFileInfo[]> {
    if (!input.files?.length) {
      throw new BadRequestException('No files to commit');
    }

    this.validateRequestCount(input);

    if (
      (input.folderType === FolderType.HOTEL_THUMBNAIL ||
        input.folderType === FolderType.HOTEL_SLIDER) &&
      !user.hotel_id
    ) {
      throw new BadRequestException('hotelId is required');
    }
    if (
      (input.folderType === FolderType.ROOM_TYPE_THUMBNAIL ||
        input.folderType === FolderType.ROOM_TYPE_SLIDER) &&
      !input.roomTypeId
    ) {
      throw new BadRequestException('roomTypeId is required');
    }

    const targetDir = this.buildTargetDir(input);
    this.ensureDir(targetDir);
    const tmpDir = this.getTmpDir();
    this.ensureDir(tmpDir);

    // desiredNames là tập cuối cùng mong muốn (FE gửi cả tên cũ và mới)
    const desiredNames = input.files.map((f) => f.tmpFileName);

    // Giới hạn số lượng theo TỔNG đang lưu (tập cuối cùng)
    if (input.folderType === FolderType.HOTEL_SLIDER) {
      if (desiredNames.length > HOTEL_SLIDER_MAX) {
        throw new BadRequestException(
          `Hotel slider exceeds maximum of ${HOTEL_SLIDER_MAX} images. Desired: ${desiredNames.length}.`,
        );
      }
    }
    if (input.folderType === FolderType.ROOM_TYPE_SLIDER) {
      if (desiredNames.length > ROOM_TYPE_SLIDER_MAX) {
        throw new BadRequestException(
          `RoomType slider exceeds maximum of ${ROOM_TYPE_SLIDER_MAX} images. Desired: ${desiredNames.length}.`,
        );
      }
    }

    const results: FinalFileInfo[] = [];

    // Di chuyển những file có trong tmp, giữ nguyên những file cũ (không có trong tmp)
    for (const f of input.files) {
      const info = await this.validateAndMoveFromTmp(
        f.tmpFileName,
        targetDir,
        tmpDir,
      );
      results.push({
        ...info,
        originalName: f.originalName,
      });
    }

    const unlinkIfExists = async (absPath: string | null | undefined) => {
      if (!absPath) return;
      try {
        await fsp.unlink(absPath);
      } catch {}
    };

    // Helper: đồng bộ DB và xóa file thừa trên disk cho slider
    const syncSlider = async (
      manager: any,
      existingRecords: { id: any; file_name: string }[],
      entityCtor: any,
      makeEntity: (name: string) => any,
      scopeFilter: Record<string, any>,
    ) => {
      const existingNames = existingRecords
        .map((r) => this.storedToName(r.file_name))
        .filter(Boolean) as string[];

      const toDelete = existingNames.filter((n) => !desiredNames.includes(n));
      const toInsert = desiredNames.filter((n) => !existingNames.includes(n));

      // Xóa file thừa trên disk + xóa record
      if (toDelete.length) {
        for (const name of toDelete) {
          await unlinkIfExists(path.join(targetDir, name));
        }
        await manager
          .createQueryBuilder()
          .delete()
          .from(entityCtor)
          .where('file_name IN (:...names)')
          .andWhere(scopeFilter)
          .setParameters({ names: toDelete, ...scopeFilter })
          .execute();
      }

      // Thêm các record còn thiếu
      if (toInsert.length) {
        const entities = toInsert.map(makeEntity);
        if (entities.length) {
          await manager.save(entityCtor, entities);
        }
      }
    };

    // Áp dụng DB theo loại
    switch (input.folderType) {
      case FolderType.HOTEL_THUMBNAIL: {
        const hotelId = String(user.hotel_id);
        const file = this.pickSingle(results, 'HOTEL_THUMBNAIL');
        const newName = file.finalFileName;

        await this.dataSource.transaction(async (manager) => {
          const existingCover = await manager.findOne(HotelImage, {
            where: { hotel_id: hotelId, is_cover: true },
          });

          const existingName = this.storedToName(existingCover?.file_name);
          if (existingName && existingName !== newName) {
            // Xóa cover cũ khỏi disk và DB
            await unlinkIfExists(path.join(targetDir, existingName));
            await manager.delete(HotelImage, { id: (existingCover as any).id });
          }

          // Nếu trùng tên cover hiện tại thì thôi; nếu không thì tạo mới cover
          if (!existingName || existingName !== newName) {
            const entity = manager.create(HotelImage, {
              hotel_id: hotelId,
              file_name: newName,
              is_cover: true,
            });
            await manager.save(HotelImage, entity);
          }
        });
        break;
      }

      case FolderType.ROOM_TYPE_THUMBNAIL: {
        const roomTypeId = String(input.roomTypeId);
        const file = this.pickSingle(results, 'ROOM_TYPE_THUMBNAIL');
        const newName = file.finalFileName;

        await this.dataSource.transaction(async (manager) => {
          const existingCover = await manager.findOne(RoomTypeImage, {
            where: { room_type_id: roomTypeId, is_cover: true },
          });

          const existingName = this.storedToName(existingCover?.file_name);
          if (existingName && existingName !== newName) {
            await unlinkIfExists(path.join(targetDir, existingName));
            await manager.delete(RoomTypeImage, {
              id: (existingCover as any).id,
            });
          }

          if (!existingName || existingName !== newName) {
            const entity = manager.create(RoomTypeImage, {
              hotel_id: String(user.hotel_id),
              room_type_id: roomTypeId,
              file_name: newName,
              is_cover: true,
            });
            await manager.save(RoomTypeImage, entity);
          }
        });
        break;
      }

      case FolderType.HOTEL_SLIDER: {
        const hotelId = String(user.hotel_id);

        await this.dataSource.transaction(async (manager) => {
          const existing = await manager.find(HotelImage, {
            where: { hotel_id: hotelId, is_cover: false },
          });
          await syncSlider(
            manager,
            existing,
            HotelImage,
            (name) =>
              this.hotelImageRepo.create({
                hotel_id: hotelId,
                file_name: name,
                is_cover: false,
              }),
            { hotel_id: hotelId, is_cover: false },
          );
        });
        break;
      }

      case FolderType.ROOM_TYPE_SLIDER: {
        const roomTypeId = String(input.roomTypeId);

        await this.dataSource.transaction(async (manager) => {
          const existing = await manager.find(RoomTypeImage, {
            where: { room_type_id: roomTypeId, is_cover: false },
          });

          await syncSlider(
            manager,
            existing,
            RoomTypeImage,
            (name) =>
              this.roomTypeImageRepo.create({
                hotel_id: String(user.hotel_id),
                room_type_id: roomTypeId,
                file_name: name,
                is_cover: false,
              }),
            { room_type_id: roomTypeId, is_cover: false },
          );
        });
        break;
      }

      case FolderType.AVATAR:
      default:
        // Avatar: chỉ di chuyển file, không thao tác DB
        break;
    }

    return results;
  }
}
