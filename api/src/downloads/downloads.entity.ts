import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Language } from '../languages/languages.entity';

export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('downloads')
export class Download {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Language, (language) => language.downloads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @Column({ name: 'language_id' })
  languageId: number;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ type: 'text', default: DownloadStatus.PENDING })
  status: DownloadStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
