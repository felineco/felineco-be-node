// src/common/dtos/mongo-id-path-param.dto.ts

import { IsMongoId } from 'class-validator';

export class MongoIdPathParamDto {
  @IsMongoId()
  id: string;
}
