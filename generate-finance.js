const fs = require('fs');
const path = require('path');

const models = [
  { name: 'Income', filePrefix: 'income', fields: [
    { name: 'accountId', type: 'string', isOptional: true },
    { name: 'source', type: 'string', isOptional: false },
    { name: 'category', type: 'IncomeCategory', isOptional: true },
    { name: 'amount', type: 'number', isOptional: false },
    { name: 'frequency', type: 'IncomeFrequency', isOptional: true },
    { name: 'startDate', type: 'Date', isOptional: true },
    { name: 'endDate', type: 'Date', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true }
  ]},
  { name: 'Expense', filePrefix: 'expense', fields: [
    { name: 'accountId', type: 'string', isOptional: true },
    { name: 'title', type: 'string', isOptional: false },
    { name: 'category', type: 'ExpenseCategory', isOptional: true },
    { name: 'amount', type: 'number', isOptional: false },
    { name: 'paymentMethod', type: 'PaymentMethod', isOptional: true },
    { name: 'expenseDate', type: 'Date', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true }
  ]},
  { name: 'Asset', filePrefix: 'asset', fields: [
    { name: 'name', type: 'string', isOptional: false },
    { name: 'assetType', type: 'AssetType', isOptional: true },
    { name: 'purchaseValue', type: 'number', isOptional: false },
    { name: 'currentValue', type: 'number', isOptional: false },
    { name: 'purchaseDate', type: 'Date', isOptional: true },
    { name: 'description', type: 'string', isOptional: true }
  ]},
  { name: 'Loan', filePrefix: 'loan', fields: [
    { name: 'loanType', type: 'LoanType', isOptional: true },
    { name: 'lenderName', type: 'string', isOptional: false },
    { name: 'principalAmount', type: 'number', isOptional: false },
    { name: 'interestRate', type: 'number', isOptional: false },
    { name: 'emiAmount', type: 'number', isOptional: false },
    { name: 'remainingBalance', type: 'number', isOptional: false },
    { name: 'startDate', type: 'Date', isOptional: false },
    { name: 'endDate', type: 'Date', isOptional: true },
    { name: 'nextEmiDate', type: 'Date', isOptional: true },
    { name: 'status', type: 'LoanStatus', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true }
  ]},
  { name: 'Investment', filePrefix: 'investment', fields: [
    { name: 'name', type: 'string', isOptional: false },
    { name: 'investmentType', type: 'InvestmentType', isOptional: true },
    { name: 'quantity', type: 'number', isOptional: true },
    { name: 'buyPrice', type: 'number', isOptional: false },
    { name: 'currentPrice', type: 'number', isOptional: false },
    { name: 'broker', type: 'string', isOptional: true },
    { name: 'purchaseDate', type: 'Date', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true }
  ]},
  { name: 'Insurance', filePrefix: 'insurance', fields: [
    { name: 'insuranceType', type: 'InsuranceType', isOptional: true },
    { name: 'provider', type: 'string', isOptional: false },
    { name: 'policyNumber', type: 'string', isOptional: true },
    { name: 'premiumAmount', type: 'number', isOptional: false },
    { name: 'coverageAmount', type: 'number', isOptional: false },
    { name: 'startDate', type: 'Date', isOptional: false },
    { name: 'expiryDate', type: 'Date', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true }
  ]},
  { name: 'Retirement', filePrefix: 'retirement', fields: [
    { name: 'targetRetirementAge', type: 'number', isOptional: true },
    { name: 'currentAge', type: 'number', isOptional: false },
    { name: 'currentSavings', type: 'number', isOptional: false },
    { name: 'targetCorpus', type: 'number', isOptional: false },
    { name: 'monthlyContribution', type: 'number', isOptional: false },
    { name: 'expectedReturnRate', type: 'number', isOptional: false },
    { name: 'notes', type: 'string', isOptional: true }
  ]},
  { name: 'FinancialGoal', filePrefix: 'financial-goal', fields: [
    { name: 'goalType', type: 'GoalType', isOptional: true },
    { name: 'title', type: 'string', isOptional: false },
    { name: 'targetAmount', type: 'number', isOptional: false },
    { name: 'currentAmount', type: 'number', isOptional: true },
    { name: 'deadline', type: 'Date', isOptional: true },
    { name: 'priority', type: 'number', isOptional: true },
    { name: 'status', type: 'GoalStatus', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true }
  ]},
  { name: 'FinancialAccount', filePrefix: 'financial-account', fields: [
    { name: 'bankName', type: 'string', isOptional: false },
    { name: 'accountName', type: 'string', isOptional: false },
    { name: 'accountNumber', type: 'string', isOptional: true },
    { name: 'accountType', type: 'AccountType', isOptional: true },
    { name: 'currency', type: 'string', isOptional: true },
    { name: 'openingBalance', type: 'number', isOptional: true },
    { name: 'currentBalance', type: 'number', isOptional: true },
    { name: 'status', type: 'AccountStatus', isOptional: true }
  ]},
];

const basePath = path.join(__dirname, 'src', 'finance');
if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function toCamel(s) { return s.replace(/-./g, x=>x[1].toUpperCase()); }
function toPascal(s) { return capitalize(toCamel(s)); }

models.forEach(model => {
  const dir = path.join(basePath, model.filePrefix);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const pascalName = toPascal(model.filePrefix);
  const camelName = toCamel(model.filePrefix);
  
  const dtoImports = new Set(['IsOptional', 'IsString', 'IsNumber', 'IsDateString', 'IsEnum', 'IsNotEmpty']);
  const modelEnums = Array.from(new Set(model.fields.filter(f => !['string','number','Date','boolean'].includes(f.type)).map(f => f.type)));
  
  // Create DTOs
  let dtoContent = `import { ${Array.from(dtoImports).join(', ')} } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
${modelEnums.length > 0 ? `import { ${modelEnums.join(', ')} } from '@prisma/client';` : ''}

export class Create${pascalName}Dto {
`;
  model.fields.forEach(f => {
    dtoContent += `  ${f.isOptional ? '@ApiPropertyOptional()' : '@ApiProperty()'}\n`;
    dtoContent += `  ${f.isOptional ? '@IsOptional()' : '@IsNotEmpty()'}\n`;
    if (f.type === 'string') dtoContent += `  @IsString()\n`;
    else if (f.type === 'number') dtoContent += `  @IsNumber()\n  @Type(() => Number)\n`;
    else if (f.type === 'Date') dtoContent += `  @IsDateString()\n`;
    else dtoContent += `  @IsEnum(${f.type})\n`;
    dtoContent += `  ${f.name}${f.isOptional ? '?' : ''}: ${['string','number','Date','boolean'].includes(f.type) ? (f.type==='Date'?'string':f.type) : f.type};\n\n`;
  });
  dtoContent += `}\n\nexport class Update${pascalName}Dto extends PartialType(Create${pascalName}Dto) {}\n`;

  // Filter DTO
  dtoContent += `
export class ${pascalName}FilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
`;

  fs.writeFileSync(path.join(dir, `${model.filePrefix}.dto.ts`), dtoContent);

  // Create Repository
  const repoContent = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, ${pascalName} } from '@prisma/client';

@Injectable()
export class ${pascalName}Repository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.${pascalName}UncheckedCreateInput): Promise<${pascalName}> {
    return this.prisma.${camelName}.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.${pascalName}WhereInput;
    orderBy?: Prisma.${pascalName}OrderByWithRelationInput;
  }): Promise<{ data: ${pascalName}[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.${camelName}.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.${camelName}.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<${pascalName} | null> {
    return this.prisma.${camelName}.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.${pascalName}UpdateInput): Promise<${pascalName}> {
    return this.prisma.${camelName}.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<${pascalName}> {
    return this.prisma.${camelName}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: '${pascalName}',
        action,
        recordId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
      },
    });
  }

  async executeInTransaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
`;
  fs.writeFileSync(path.join(dir, `${model.filePrefix}.repository.ts`), repoContent);

  // Create Service
  const serviceContent = `import { Injectable, NotFoundException } from '@nestjs/common';
import { ${pascalName}Repository } from './${model.filePrefix}.repository';
import { Create${pascalName}Dto, Update${pascalName}Dto, ${pascalName}FilterDto } from './${model.filePrefix}.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ${pascalName}Service {
  constructor(private readonly repository: ${pascalName}Repository) {}

  async create(userId: string, dto: Create${pascalName}Dto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.${camelName}.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: '${pascalName}',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: ${pascalName}FilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.${pascalName}WhereInput = { userId };
    if (filter.search) {
      where.OR = [
        ${model.fields.filter(f=>f.type==='string').map(f => `{ ${f.name}: { contains: filter.search, mode: 'insensitive' } }`).join(', ')}
      ];
    }

    const orderBy: Prisma.${pascalName}OrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findOne(id: string, userId: string) {
    const record = await this.repository.findById(id);
    if (!record || record.userId !== userId) {
      throw new NotFoundException('${pascalName} not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: Update${pascalName}Dto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.${camelName}.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: '${pascalName}',
          action: 'UPDATE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
          newData: JSON.parse(JSON.stringify(updated)),
        }
      });
      return updated;
    });
  }

  async remove(id: string, userId: string) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const deleted = await tx.${camelName}.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: '${pascalName}',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: '${pascalName} deleted successfully' };
    });
  }
}
`;
  fs.writeFileSync(path.join(dir, `${model.filePrefix}.service.ts`), serviceContent);

  // Create Controller
  const controllerContent = `import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ${pascalName}Service } from './${model.filePrefix}.service';
import { Create${pascalName}Dto, Update${pascalName}Dto, ${pascalName}FilterDto } from './${model.filePrefix}.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - ${pascalName}')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/${model.filePrefix}')
export class ${pascalName}Controller {
  constructor(private readonly service: ${pascalName}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create new ${pascalName}' })
  create(@Request() req, @Body() dto: Create${pascalName}Dto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ${pascalName} with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: ${pascalName}FilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${pascalName} by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ${pascalName}' })
  update(@Request() req, @Param('id') id: string, @Body() dto: Update${pascalName}Dto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete ${pascalName}' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
`;
  fs.writeFileSync(path.join(dir, `${model.filePrefix}.controller.ts`), controllerContent);

  // Create Module
  const moduleContent = `import { Module } from '@nestjs/common';
import { ${pascalName}Service } from './${model.filePrefix}.service';
import { ${pascalName}Controller } from './${model.filePrefix}.controller';
import { ${pascalName}Repository } from './${model.filePrefix}.repository';

@Module({
  controllers: [${pascalName}Controller],
  providers: [${pascalName}Service, ${pascalName}Repository],
  exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`;
  fs.writeFileSync(path.join(dir, `${model.filePrefix}.module.ts`), moduleContent);
});

console.log("Finance modules generated successfully!");
