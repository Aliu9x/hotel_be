import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { join } from 'path';
import {
  CommitUploadDto,
  DeleteTempOneDto,
  FolderType,
  SaveChangesDto,
} from './dto/create-file.dto';
import {
  detectMimeFromPath,
  extFromMime,
  isAllowedMime,
  isSubPath,
} from './util/mime.util';

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
  private getRootPath = () => process.cwd();

  private ensureExists(targetDirectory: string) {
    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }
  }
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
  private buildTargetDir(input: CommitUploadDto): string {
    const base = path.join(this.getRootPath(), 'public', 'images');
    switch (input.folderType) {
      case FolderType.AVATAR: {
        if (!input.userId) {
          throw new BadRequestException('userId is required for AVATAR');
        }
        return path.join(base, 'users', input.userId);
      }
      case FolderType.HOTEL_THUMBNAIL:
      case FolderType.HOTEL_SLIDER: {
        if (!input.hotelId) {
          throw new BadRequestException('hotelId is required for hotel images');
        }
        const usage =
          input.folderType === FolderType.HOTEL_THUMBNAIL
            ? 'thumbnail'
            : 'slider';
        return path.join(base, 'hotel', input.hotelId, usage);
      }
      case FolderType.ROOM_TYPE_THUMBNAIL:
      case FolderType.ROOM_TYPE_SLIDER: {
        if (!input.roomTypeId) {
          throw new BadRequestException(
            'roomTypeId is required for roomType images',
          );
        }
        const usage =
          input.folderType === FolderType.ROOM_TYPE_THUMBNAIL
            ? 'thumbnail'
            : 'slider';
        return path.join(base, 'hotel', input.hotelId, 'roomType', input.roomTypeId, usage);
      }

      default:
        throw new BadRequestException('Unsupported folderType');
    }
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

  async commitUploads(input: CommitUploadDto): Promise<FinalFileInfo[]> {
    if (!input.files?.length) {
      throw new BadRequestException('No files to commit');
    }

    this.validateBusinessRules(input);

    const targetDir = this.buildTargetDir(input);
    this.ensureDir(targetDir);

    const tmpDir = this.getTmpDir();
    console.log(tmpDir);
    this.ensureDir(tmpDir);

    const results: FinalFileInfo[] = [];

    // Xử lý tuần tự (an toàn). Nếu muốn nhanh hơn có thể Promise.all nhưng cần cẩn thận rename.
    for (const f of input.files) {
      const src = path.join(tmpDir, f.tmpFileName);

      try {
        await fsp.access(src, fs.constants.F_OK);
      } catch {
        throw new BadRequestException(`Temp file not found: ${f.tmpFileName}`);
      }

      // 2. MIME validation
      const mime = await detectMimeFromPath(src);
      if (!isAllowedMime(mime)) {
        await fsp.unlink(src).catch(() => {});
        throw new BadRequestException(
          `File MIME not allowed: ${mime ?? 'unknown'}`,
        );
      }

      // 3. Kiểm tra extension khớp MIME
      const extExpected = extFromMime(mime!);
      const extActual = path.extname(f.tmpFileName).slice(1).toLowerCase();
      if (extExpected && extActual && extExpected !== extActual) {
        await fsp.unlink(src).catch(() => {});
        throw new BadRequestException(
          `File extension mismatch: expected .${extExpected} but got .${extActual}`,
        );
      }

      const finalName = f.tmpFileName; // Giữ nguyên ULID
      const finalAbs = path.join(targetDir, finalName);

      // 4. Di chuyển
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

    // TODO: Lưu DB (ghi vào bảng HotelImage / RoomTypeImage) – tuỳ thiết kế
    return results;
  }
  // NEW: XÓA 1 FILE TẠM duy nhất khi xóa ở phần xem trước trong tạo mới
  async deleteTempOne(input: DeleteTempOneDto) {
    const name = input.tmpFileName?.trim();
    if (!name) throw new BadRequestException('tmpFileName is required');
    if (name.includes('/') || name.includes('\\')) {
      throw new BadRequestException(
        'tmpFileName must not contain path separators',
      );
    }

    const publicRoot = join(this.getRootPath(), 'public');
    const tmpDir = join(publicRoot, 'images', 'tmp');
    this.ensureExists(tmpDir);

    const abs = join(tmpDir, name);
    // Không throw nếu không tồn tại, chỉ trả trạng thái
    const existed = await fsp
      .unlink(abs)
      .then(() => true)
      .catch((e: any) =>
        e?.code === 'ENOENT'
          ? false
          : (() => {
              throw e;
            })(),
      );

    return {
      tmpFileName: name,
      deleted: existed,
      tmpRelativePath: `/images/tmp/${name}`,
    };
  }
  // SAVE CHANGES trong màn update (commit ảnh mới + xóa ảnh đã commit bị đánh dấu)
  async saveChanges(input: SaveChangesDto) {
    // 1) Commit các file mới (đang ở tmp)
    const addResults = input.add?.length
      ? await this.commitUploads({
          folderType: input.folderType,
          hotelId: input.hotelId,
          roomCategoryId: input.roomCategoryId,
          userId: input.userId,
          files: input.add.map((a) => ({
            tmpFileName: a.tmpFileName,
            originalName: a.originalName,
          })),
        } as CommitUploadDto)
      : [];

    // 2) Xóa các file đã commit bị chủ KS đánh dấu xóa (chỉ xóa trong thư mục chính, không đụng tmp)
    const targetDir = await this.buildTargetDir({
      folderType: input.folderType,
      hotelId: input.hotelId,
      roomCategoryId: input.roomCategoryId,
      userId: input.userId,
      files: [],
    } as CommitUploadDto);
    this.ensureExists(targetDir);

    const removed: { fileName: string; removed: boolean }[] = [];
    for (const name of input.remove || []) {
      if (typeof name !== 'string' || !name.trim()) continue;
      if (name.includes('/') || name.includes('\\')) {
        // Bỏ qua tên xấu để an toàn
        removed.push({ fileName: name, removed: false });
        continue;
      }
      const abs = join(targetDir, name);

      // Quan trọng: đảm bảo file nằm TRONG đúng targetDir (scope khách sạn / loại phòng hiện tại)
      if (!isSubPath(targetDir, abs)) {
        removed.push({ fileName: name, removed: false });
        continue;
      }

      const ok = await fsp
        .unlink(abs)
        .then(() => true)
        .catch((e: any) =>
          e?.code === 'ENOENT'
            ? false
            : (() => {
                throw e;
              })(),
        );
      removed.push({ fileName: name, removed: ok });
    }

    // TODO: Cập nhật DB: insert cho addResults, delete cho remove (theo fileName/relativePath)
    return {
      added: addResults,
      removed,
    };
  }
}
