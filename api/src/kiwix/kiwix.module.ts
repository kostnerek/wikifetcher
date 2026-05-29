import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KiwixService } from './kiwix.service';
import { KiwixController } from './kiwix.controller';
import { Download } from '../downloads/downloads.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Download])],
  controllers: [KiwixController],
  providers: [KiwixService],
  exports: [KiwixService],
})
export class KiwixModule {}
