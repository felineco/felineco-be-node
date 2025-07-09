// src/common/dtos/page-options.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum MongoSortOrder {
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

  get mongoSortParams(): [string, MongoSortOrder] {
    if (!this.sort) return ['createdAt', MongoSortOrder.DESC];

    const [field, order] = this.sort.split(':');
    return [
      field || 'createdAt',
      order?.toLowerCase() === 'asc' ? MongoSortOrder.ASC : MongoSortOrder.DESC,
    ];
  }
}
