import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentEntity } from '../../entities/payment.entity';
import { DebtEntity } from '../../entities/debt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity, DebtEntity])],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
