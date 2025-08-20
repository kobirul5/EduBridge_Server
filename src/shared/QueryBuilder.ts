import { excludeField } from "./constants";
import { PrismaClient, Prisma } from "@prisma/client";

export class QueryBuilder<M> {
  private readonly model: any; // prisma.user / prisma.post / prisma.order etc.
  private readonly query: Record<string, string>;
  private prismaOptions: any = {};

  constructor(model: any, query: Record<string, string>) {
    this.model = model;
    this.query = query;
    this.prismaOptions = {};
  }

  filter(): this {
    const filter: Record<string, any> = { ...this.query };

    for (const field of excludeField) {
      delete filter[field];
    }

    if (Object.keys(filter).length > 0) {
      this.prismaOptions.where = { ...filter };
    }

    return this;
  }

  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm || "";
    if (searchTerm) {
      this.prismaOptions.where = {
        ...this.prismaOptions.where,
        OR: searchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: "insensitive" },
        })),
      };
    }
    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";

    let orderBy: Record<string, "asc" | "desc"> = {};
    if (sort.startsWith("-")) {
      orderBy[sort.substring(1)] = "desc";
    } else {
      orderBy[sort] = "asc";
    }

    this.prismaOptions.orderBy = orderBy;
    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",") || [];

    if (fields.length > 0) {
      this.prismaOptions.select = fields.reduce(
        (acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        },
        {}
      );
    }

    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaOptions.skip = skip;
    this.prismaOptions.take = limit;

    return this;
  }

  build() {
    return this.prismaOptions;
  }

  async exec() {
    return this.model.findMany(this.prismaOptions);
  }

  async getMeta() {
    const totalDocuments = await this.model.count({
      where: this.prismaOptions.where,
    });

    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDocuments / limit);

    return { page, limit, total: totalDocuments, totalPage };
  }
}
