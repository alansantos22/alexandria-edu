import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class UpsertChunkDto {
  @IsInt()
  @Min(-128)
  @Max(127)
  chunkX: number;

  @IsInt()
  @Min(-128)
  @Max(127)
  chunkZ: number;

  /** Hex string: each char 0–F represents one cell in the 16×16 grid. */
  @IsString()
  @Matches(/^[0-9A-Fa-f]{0,512}$/, { message: 'dataHex must be a valid hex string (max 512 chars)' })
  dataHex: string;
}
