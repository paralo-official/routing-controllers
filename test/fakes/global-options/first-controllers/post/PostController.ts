import { JsonController } from '../../../../../src/decorator/JsonController.js';
import { Get } from '../../../../../src/decorator/Get.js';

@JsonController()
export class PostController {
  @Get('/posts')
  getAll() {
    return [
      {
        id: 1,
        title: '#1',
      },
      {
        id: 2,
        title: '#2',
      },
    ];
  }
}
