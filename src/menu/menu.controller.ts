import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { MenuSuggestRequest, MenuSuggestResponse } from './menu.types';

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
    type: MenuSuggestRequest,
  })
  @ApiOkResponse({
    description: 'Menu suggestion normalized for frontend consumption.',
    type: MenuSuggestResponse,
  })
  @ApiNotFoundResponse({
    description: 'The requested city is not supported by the static catalog.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('suggest')
  suggestMenu(
    @Body() request: MenuSuggestRequest,
  ): Promise<MenuSuggestResponse> {
    return this.menuService.suggestMenu(request);
  }
}
