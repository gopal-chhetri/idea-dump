import { Module } from '@nestjs/common';
import { CvProfileService } from './cv-profile.service';
import { CvProfileController } from './cv-profile.controller';

@Module({
  controllers: [CvProfileController],
  providers: [CvProfileService],
  exports: [CvProfileService],
})
export class CvProfileModule {}
