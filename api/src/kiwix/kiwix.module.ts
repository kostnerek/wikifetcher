import { Module } from '@nestjs/common';
import { KiwixService } from './kiwix.service';

@Module({
  providers: [KiwixService],
  exports: [KiwixService],
})
export class KiwixModule {}
