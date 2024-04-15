import { Controller } from '../../../../src/decorator/Controller.js';
import { Get } from '../../../../src/decorator/Get.js';

@Controller()
export class VideoController {
  @Get('/videos')
  getAll() {
    return 'Hello videos';
  }
}
