import { Controller } from '../../../../src/decorator/Controller.js';
import { Get } from '../../../../src/decorator/Get.js';

@Controller()
export class PhotoController {
  @Get('/photos')
  getAll() {
    return 'Hello photos';
  }
}
