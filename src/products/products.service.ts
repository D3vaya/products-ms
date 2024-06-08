import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dtos/pagintation.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('database connected');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({ data: createProductDto });
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;

    const totalPage = await this.product.count();
    const lastPage = Math.ceil(totalPage / limit);
    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      meta: {
        page,
        lastPage,
        total: totalPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({ where: { id } });

    if (!product) {
      throw new RpcException('Product not found');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: _, ...data } = updateProductDto;
    await this.findOne(id);
    return this.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.product.delete({ where: { id } });
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Some products where not found',
      });
    }

    return products;
  }
}
