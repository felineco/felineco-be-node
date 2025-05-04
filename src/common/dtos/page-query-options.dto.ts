// src/common/dtos/page-options.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PagingQueryOptions {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly limit: number = 10;

  @IsString()
  @IsOptional()
  readonly sort: string = 'createdAt:desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get sortParams(): [string, SortOrder] {
    if (!this.sort) return ['createdAt', SortOrder.DESC];

    const [field, order] = this.sort.split(':');
    return [
      field || 'createdAt',
      order?.toLowerCase() === 'asc' ? SortOrder.ASC : SortOrder.DESC,
    ];
  }
}

export function toTypeOrmSortOrder(order: SortOrder): 'ASC' | 'DESC' {
  switch (order) {
    case SortOrder.ASC:
      return 'ASC';
    case SortOrder.DESC:
      return 'DESC';
    default:
      throw new Error(`Invalid sort order`);
  }
}
