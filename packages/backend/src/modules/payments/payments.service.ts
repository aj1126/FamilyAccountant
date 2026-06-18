import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../../entities/payment.entity';
import { DebtEntity } from '../../entities/debt.entity';
import { CreatePaymentDto } from './dtos/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
    @InjectRepository(DebtEntity)
    private readonly debtRepo: Repository<DebtEntity>,
  ) {}

  async create(householdId: string, dto: CreatePaymentDto): Promise<PaymentEntity> {
    const debt = await this.debtRepo.findOneBy({ id: dto.debtId });
    if (!debt) {
      throw new NotFoundException('Debt not found');
    }
    if (debt.householdId !== householdId) {
      throw new ForbiddenException('Debt does not belong to your household');
    }
    if (debt.settled) {
      throw new ForbiddenException('Debt is already settled');
    }

    const existingPayments = await this.repo.findBy({ debtId: dto.debtId });
    const paidSum = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(debt.amount) - paidSum;

    if (dto.amount - remaining > 0.01) {
      throw new ForbiddenException('Payment amount exceeds the remaining unpaid debt balance');
    }

    const payment = this.repo.create({ ...dto, householdId });
    const saved = await this.repo.save(payment);

    if (remaining - dto.amount <= 0.01) {
      debt.settled = true;
      await this.debtRepo.save(debt);
    }

    return saved;
  }

  async findByDebt(debtId: string, householdId: string): Promise<PaymentEntity[]> {
    return this.repo.findBy({ debtId, householdId });
  }

  async findOne(id: string, householdId: string): Promise<PaymentEntity> {
    if (householdId == null) throw new ForbiddenException('Access denied');
    const payment = await this.repo.findOneBy({ id });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.householdId !== householdId) throw new ForbiddenException('Access denied');
    return payment;
  }
}
