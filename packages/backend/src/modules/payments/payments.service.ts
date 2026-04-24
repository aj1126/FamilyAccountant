import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../../entities/payment.entity';
import { CreatePaymentDto } from './dtos/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
  ) {}

  async create(householdId: string, dto: CreatePaymentDto): Promise<PaymentEntity> {
    const payment = this.repo.create({ ...dto, householdId });
    return this.repo.save(payment);
  }

  async findByDebt(debtId: string): Promise<PaymentEntity[]> {
    return this.repo.findBy({ debtId });
  }

  async findOne(id: string): Promise<PaymentEntity> {
    const payment = await this.repo.findOneBy({ id });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
