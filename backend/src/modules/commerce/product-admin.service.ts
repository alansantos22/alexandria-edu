import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductCourse } from './entities/product-course.entity';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 150) || `product-${Date.now()}`;
}

@Injectable()
export class ProductAdminService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(ProductCourse) private readonly pcRepo: Repository<ProductCourse>,
  ) {}

  listAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Product>): Promise<Product> {
    if (!data.name) throw new BadRequestException('name obrigatório');
    if (!data.slug) data.slug = slugify(data.name);

    const exists = await this.repo.findOne({ where: { slug: data.slug } });
    if (exists) data.slug = `${data.slug}-${Date.now()}`;

    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: string, patch: Partial<Product>): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    Object.assign(product, patch);
    return this.repo.save(product);
  }

  async delete(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }

  async attachCourse(productId: string, courseId: string) {
    const existing = await this.pcRepo.findOne({ where: { productId, courseId } });
    if (existing) return existing;
    return this.pcRepo.save(this.pcRepo.create({ productId, courseId }));
  }

  async detachCourse(productId: string, courseId: string) {
    await this.pcRepo.delete({ productId, courseId });
    return { ok: true };
  }
}
