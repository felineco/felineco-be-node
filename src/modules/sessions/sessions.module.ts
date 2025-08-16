// src/modules/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionTemplatesController } from './controllers/session-templates.controller';
import {
  SessionTemplate,
  SessionTemplateSchema,
} from './schemas/session-template.schema';
import { SessionsService } from './services/sessions.service';

const SessionTemplateMongooseModule = MongooseModule.forFeature([
  { name: SessionTemplate.name, schema: SessionTemplateSchema },
]);

@Module({
  imports: [SessionTemplateMongooseModule],
  controllers: [SessionTemplatesController],
  providers: [SessionsService],
  exports: [SessionsService, SessionTemplateMongooseModule],
})
export class SessionsModule {}
