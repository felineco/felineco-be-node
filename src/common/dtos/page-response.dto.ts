// src/common/dtos/page.dto.ts
export class PagingResponseMeta {
  readonly page: number;
  readonly limit: number;
  readonly itemCount: number;
  readonly pageCount: number;

  constructor({
    page,
    limit,
    itemCount,
  }: {
    page: number;
    limit: number;
    itemCount: number;
  }) {
    this.page = page;
    this.limit = limit;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.limit);
  }
}

export class PagingResponse<T> {
  readonly data: T[];
  readonly meta: PagingResponseMeta;

  constructor(data: T[], meta: PagingResponseMeta) {
    this.data = data;
    this.meta = meta;
  }
}
