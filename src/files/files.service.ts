import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import {
  HotelImage,
  ImageStatus,
} from 'src/hotels/entities/hotel-image.entity';
import { RoomTypeImage } from 'src/room-types/entities/room-type-image.entity';
import { CommitUploadDto, FolderType } from './dto/create-file.dto';
import {
  detectMimeFromPath,
  extFromMime,
  isAllowedMime,
} from './util/mime.util';
import { AiModerationService } from 'src/ai-moderation/ai-moderation.service';
import {
  FlaggedHotelImage,
  FlaggedImagesQueryDto,
  FlaggedRoomTypeImage,
} from './dto/flagged-images.dto';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';

type FinalFileInfo = {
  finalFileName: string;
  finalRelativePath: string;
  originalName?: string;
};

const HOTEL_SLIDER_MAX = 30;
const ROOM_TYPE_SLIDER_MAX = 20;

export class FilesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HotelImage)
    private readonly hotelImageRepo: Repository<HotelImage>,
    @InjectRepository(RoomTypeImage)
    private readonly roomTypeImageRepo: Repository<RoomTypeImage>,
    private readonly aiModerationService: AiModerationService,
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

  private async validateAndMoveFromTmp(
    finalName: string,
    targetDir: string,
    tmpDir: string,
  ): Promise<FinalFileInfo> {
    const src = path.join(tmpDir, finalName);
    try {
      await fsp.access(src, fs.constants.F_OK);
    } catch {
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

    const extExpected = extFromMime(mime!); // ví dụ: image/jpeg -> 'jpg'
    const extActual = path.extname(finalName).slice(1).toLowerCase();
    const baseName = path.basename(finalName, path.extname(finalName));
    const normalizedName =
      extExpected && extActual && extExpected !== extActual
        ? `${baseName}.${extExpected}`
        : finalName;

    const finalAbs = path.join(targetDir, normalizedName);

    try {
      await fsp.rename(src, finalAbs);
    } catch (e: any) {
      if (e?.code === 'EXDEV') {
        await fsp.copyFile(src, finalAbs);
        await fsp.unlink(src).catch(() => {});
      } else {
        throw new InternalServerErrorException(
          `Failed to move file ${normalizedName}`,
        );
      }
    }

    const rel = this.toRelativePublicPath(finalAbs);
    return {
      finalFileName: normalizedName,
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

    const requestedNames = input.files.map((f) => f.tmpFileName);

    if (
      input.folderType === FolderType.HOTEL_SLIDER &&
      requestedNames.length > HOTEL_SLIDER_MAX
    ) {
      throw new BadRequestException(
        `Hotel slider exceeds maximum of ${HOTEL_SLIDER_MAX} images. Desired: ${requestedNames.length}.`,
      );
    }
    if (
      input.folderType === FolderType.ROOM_TYPE_SLIDER &&
      requestedNames.length > ROOM_TYPE_SLIDER_MAX
    ) {
      throw new BadRequestException(
        `RoomType slider exceeds maximum of ${ROOM_TYPE_SLIDER_MAX} images. Desired: ${requestedNames.length}.`,
      );
    }

    const targetDir = this.buildTargetDir(input);
    this.ensureDir(targetDir);
    const tmpDir = this.getTmpDir();
    this.ensureDir(tmpDir);

    const results: FinalFileInfo[] = [];
    for (const f of input.files) {
      const info = await this.validateAndMoveFromTmp(
        f.tmpFileName,
        targetDir,
        tmpDir,
      );
      results.push({ ...info, originalName: f.originalName });
    }

    const desiredNames = results.map((r) => r.finalFileName);

    const unlinkIfExists = async (absPath: string | null | undefined) => {
      if (!absPath) return;
      try {
        await fsp.unlink(absPath);
      } catch {}
    };

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

      if (toInsert.length) {
        const entities = toInsert.map(makeEntity);
        if (entities.length) {
          await manager.save(entityCtor, entities);
        }
      }
    };

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
            await unlinkIfExists(path.join(targetDir, existingName));
            await manager.delete(HotelImage, { id: (existingCover as any).id });
          }

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
        break;
    }
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      const port = process.env.PORT;
      baseUrl = `http://localhost:${port}`;
    }
    if (
      input.folderType === FolderType.HOTEL_THUMBNAIL ||
      input.folderType === FolderType.HOTEL_SLIDER
    ) {
      const hotelId = String(user.hotel_id);

      const images = await this.hotelImageRepo.find({
        where: { hotel_id: hotelId, status: ImageStatus.PENDING_AI },
      });

      for (const img of images) {
        const url = `${baseUrl}/images/hotel/${img.file_name}`;
        this.aiModerationService.scanHotelImage(img, url);
      }
    }
    if (
      input.folderType === FolderType.ROOM_TYPE_THUMBNAIL ||
      input.folderType === FolderType.ROOM_TYPE_SLIDER
    ) {
      const roomTypeId = String(input.roomTypeId);

      const images = await this.roomTypeImageRepo.find({
        where: { room_type_id: roomTypeId, status: ImageStatus.PENDING_AI },
      });

      for (const img of images) {
        const url = `${baseUrl}/images/roomType/${img.file_name}`;
        this.aiModerationService.scanRoomTypeImage(img, url);
      }
    }
    return results;
  }

  private async listFlaggedHotelImages(): Promise<FlaggedHotelImage[]> {
    const qb: SelectQueryBuilder<HotelImage> = this.hotelImageRepo
      .createQueryBuilder('hi')
      .innerJoin(Hotel, 'h', 'h.id = hi.hotel_id')
      .where('hi.status = :status', { status: ImageStatus.AI_FLAGGED })
      .select([
        'hi.id AS image_id',
        'hi.file_name AS file_name',
        'hi.is_cover AS is_cover',
        'hi.status AS status',
        'hi.created_at AS created_at',
        'h.id AS h_id',
        'h.name AS h_name',
      ])
      .orderBy('hi.created_at', 'DESC');

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      type: 'HOTEL_IMAGE',
      image_id: String(r.image_id),
      file_name: r.file_name,
      is_cover: !!r.is_cover,
      status: r.status as ImageStatus,
      created_at: r.created_at,
      hotel: {
        id: String(r.h_id),
        name: r.h_name,
      },
    }));
  }
  private async listFlaggedRoomTypeImages(): Promise<FlaggedRoomTypeImage[]> {
    const qb: SelectQueryBuilder<RoomTypeImage> = this.roomTypeImageRepo
      .createQueryBuilder('rti')
      .innerJoin(RoomType, 'rt', 'rt.id = rti.room_type_id')
      .innerJoin(Hotel, 'h', 'h.id = rti.hotel_id')
      .where('rti.status = :status', { status: ImageStatus.AI_FLAGGED })
      .select([
        'rti.id AS image_id',
        'rti.file_name AS file_name',
        'rti.is_cover AS is_cover',
        'rti.status AS status',
        'rti.created_at AS created_at',
        'h.id AS h_id',
        'h.name AS h_name',
        'rt.id AS rt_id',
        'rt.name AS rt_name',
      ])
      .orderBy('rti.created_at', 'DESC');

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      type: 'ROOM_TYPE_IMAGE',
      image_id: String(r.image_id),
      file_name: r.file_name,
      is_cover: !!r.is_cover,
      status: r.status as ImageStatus,
      created_at: r.created_at,
      hotel: {
        id: String(r.h_id),
        name: r.h_name,
      },
      room_type: {
        id: String(r.rt_id),
        name: r.rt_name,
      },
    }));
  }

  async listFlagged(params: FlaggedImagesQueryDto): Promise<{
    result: Array<FlaggedHotelImage | FlaggedRoomTypeImage>;
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, type } = params;
    if (type === 'hotel') {
      const rows = await this.listFlaggedHotelImages();
      const total = rows.length;
      const start = (page - 1) * limit;
      const result = rows.slice(start, start + limit);
      return { result, total, page, limit };
    }

    if (type === 'roomType') {
      const rows = await this.listFlaggedRoomTypeImages();
      const total = rows.length;
      const start = (page - 1) * limit;
      const result = rows.slice(start, start + limit);
      return { result, total, page, limit };
    }

    const [hotelImgs, roomTypeImgs] = await Promise.all([
      this.listFlaggedHotelImages(),
      this.listFlaggedRoomTypeImages(),
    ]);
    const all = [...hotelImgs, ...roomTypeImgs].sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    );
    const total = all.length;
    const start = (page - 1) * limit;
    const result = all.slice(start, start + limit);
    return { result, total, page, limit };
  }
  async updateHotelImageStatus(
    imageId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<any> {
    const entity = await this.hotelImageRepo.findOne({
      where: { id: imageId },
    });
    if (!entity) return null;

    entity.status = status as ImageStatus;
    await this.hotelImageRepo.save(entity);

    return {
      id: entity.id,
      file_name: entity.file_name,
      status: entity.status,
      updatedAt: entity.updatedAt,
    };
  }

  async updateRoomTypeImageStatus(
    imageId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<any> {
    const entity = await this.roomTypeImageRepo.findOne({
      where: { id: imageId },
    });
    if (!entity) return null;

    entity.status = status as ImageStatus;
    await this.roomTypeImageRepo.save(entity);

    return {
      id: entity.id,
      file_name: entity.file_name,
      status: entity.status,
      updatedAt: entity.updatedAt,
    };
  }
}
