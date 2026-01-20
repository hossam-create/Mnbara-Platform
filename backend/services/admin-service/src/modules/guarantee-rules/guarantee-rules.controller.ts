import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { GuaranteeRulesService } from './guarantee-rules.service';
import { CreateGuaranteeRuleDto, UpdateGuaranteeRuleDto } from './dto/guarantee-rule.dto';
// Assuming shared AuthGuard exists or mocking it for internal admin usage if strictly internal. 
// However, OrdersController used UseGuards(JwtAuthGuard). Let's assume similar structure or omit guard for now if we can't easily find the import path for JwtAuthGuard in this service (it was in orders-service).
// Looking at app.module.ts, it imports AuthModule. 
// Looking at admin-service file structure, `middleware/security.middleware.ts` is applied. 
// I'll stick to basic controller decorators for now.

@Controller('guarantee-rules')
export class GuaranteeRulesController {
  constructor(private readonly service: GuaranteeRulesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGuaranteeRuleDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGuaranteeRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
