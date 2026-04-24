import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MenuSuggestRequestDto } from './dto/menu-suggest-request.dto';
import { MenuSuggestResponseDto } from './dto/menu-suggest-response.dto';
import { MenuService } from './menu.service';

@ApiTags('menu')
@Controller({
  path: 'menu',
  version: '1',
})
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @ApiOperation({
    summary: 'Suggest a daily menu using weather and dietary preferences',
  })
  @ApiBody({
    type: MenuSuggestRequestDto,
  })
  @ApiOkResponse({
    description: 'Menu suggestion normalized for frontend consumption.',
    type: MenuSuggestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The requested city is not supported by the static catalog.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('suggest')
  suggestMenu(
    @Body() request: MenuSuggestRequestDto,
  ): Promise<MenuSuggestResponseDto> {
    return this.menuService.suggestMenu(request);
  }
}
