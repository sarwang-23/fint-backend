import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto, UpdateAssetDto, AssetFilterDto } from './asset.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - Asset')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/asset')
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Create new Asset' })
  create(@Request() req, @Body() dto: CreateAssetDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Asset with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: AssetFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Asset by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Asset' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete Asset' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
