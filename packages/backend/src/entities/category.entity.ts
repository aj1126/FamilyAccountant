import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { HouseholdEntity } from './household.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  householdId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  color!: string | null;

  @Column({ type: 'varchar', nullable: true })
  icon!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => HouseholdEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'householdId' })
  household?: HouseholdEntity | null;

  @ManyToOne(() => CategoryEntity, (c) => c.children, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: CategoryEntity | null;

  @OneToMany(() => CategoryEntity, (c) => c.parent)
  children!: CategoryEntity[];
}
