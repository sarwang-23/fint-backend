import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards, Logger, Query, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatDto } from '../dto/chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('AI Copilot')
@Controller('ai/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Version('1')
  @Post()
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message to FINT AI Financial Copilot' })
  async chat(@Req() req: any, @Body() body: ChatDto) {
    const userId = req.user?.id;
    this.logger.log(`POST /api/v1/ai/chat — User: ${userId}`);
    const result = await this.chatService.chat(userId, body.message);
    return {
      success: true,
      data: result,
      message: 'AI Copilot Response',
      timestamp: new Date().toISOString(),
    };
  }

  @Version('1')
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation history for the current user' })
  async getHistory(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const userId = req.user?.id;
    this.logger.log(`GET /api/v1/ai/chat/history — User: ${userId}`);
    const history = await this.chatService.getHistory(userId, parseInt(page), parseInt(limit));
    return {
      success: true,
      data: history,
      message: 'Conversation History',
      timestamp: new Date().toISOString(),
    };
  }

  @Version('1')
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  async getById(@Param('id') id: string) {
    this.logger.log(`GET /api/v1/ai/chat/${id}`);
    const conversation = await this.chatService.getById(id);
    return {
      success: true,
      data: conversation,
      message: 'Conversation Detail',
      timestamp: new Date().toISOString(),
    };
  }

  @Version('1')
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a conversation' })
  async deleteConversation(@Param('id') id: string) {
    this.logger.log(`DELETE /api/v1/ai/chat/${id}`);
    await this.chatService.deleteConversation(id);
    return {
      success: true,
      message: 'Conversation deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
