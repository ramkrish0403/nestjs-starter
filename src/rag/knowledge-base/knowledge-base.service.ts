import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBase } from './entities/knowledge-base.entity';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly knowledgeBaseRepository: Repository<KnowledgeBase>,
  ) {}

  async create(createDto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    const existing = await this.knowledgeBaseRepository.findOne({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Knowledge base with name "${createDto.name}" already exists`,
      );
    }

    const knowledgeBase = this.knowledgeBaseRepository.create(createDto);
    return this.knowledgeBaseRepository.save(knowledgeBase);
  }

  async findAll(): Promise<KnowledgeBase[]> {
    return this.knowledgeBaseRepository.find({
      relations: ['documents'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<KnowledgeBase> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id },
      relations: ['documents'],
    });

    if (!knowledgeBase) {
      throw new NotFoundException(`Knowledge base with ID "${id}" not found`);
    }

    return knowledgeBase;
  }

  async update(
    id: string,
    updateDto: UpdateKnowledgeBaseDto,
  ): Promise<KnowledgeBase> {
    const knowledgeBase = await this.findOne(id);

    if (updateDto.name && updateDto.name !== knowledgeBase.name) {
      const existing = await this.knowledgeBaseRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Knowledge base with name "${updateDto.name}" already exists`,
        );
      }
    }

    Object.assign(knowledgeBase, updateDto);
    return this.knowledgeBaseRepository.save(knowledgeBase);
  }

  async remove(id: string): Promise<void> {
    const knowledgeBase = await this.findOne(id);
    await this.knowledgeBaseRepository.remove(knowledgeBase);
  }
}
