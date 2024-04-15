import { Exclude, Expose } from 'class-transformer';
import { Body } from '../../src/decorator/Body.js';
import { JsonController } from '../../src/decorator/JsonController.js';
import { Post } from '../../src/decorator/Post.js';
import { createExpressServer, getMetadataArgsStorage } from '../../src/index.js';
import { axios } from '../utilities/axios.js';
import { defaultMetadataStorage } from 'class-transformer';

describe(``, () => {
  let expressApp: any;
  let initializedUser: any;
  let user: any = { firstName: 'Umed', lastName: 'Khudoiberdiev' };

  @Exclude()
  class UserModel {
    @Expose()
    firstName: string;

    lastName: string;
  }

  beforeAll(() => {
    return new Promise(async done => {
      // reset metadata args storage
      getMetadataArgsStorage().reset();

      function handler(user: UserModel) {
        initializedUser = user;
        const ret = new UserModel();
        ret.firstName = user.firstName;
        ret.lastName = user.lastName || 'default';
        return ret;
      }

      @JsonController('', { transformResponse: false })
      class NoTransformResponseController {
        @Post('/default')
        default(@Body() user: UserModel) {
          return handler(user);
        }

        @Post('/transformRequestOnly', { transformRequest: true, transformResponse: false })
        transformRequestOnly(@Body() user: UserModel) {
          return handler(user);
        }

        @Post('/transformResponseOnly', { transformRequest: false, transformResponse: true })
        transformResponseOnly(@Body() user: UserModel) {
          return handler(user);
        }
      }

      expressApp = await createExpressServer();
      expressApp.listen(3001, done);
    });
  });

  afterAll(() => {
    return new Promise(done => {
      defaultMetadataStorage.clear();
      expressApp.close(done);
    });
  });

  beforeEach(() => {
    initializedUser = undefined;
  });

  it('should use controller options when action transform options are not set', async () => {
    expect.assertions(4);
    const response = await axios.post('/default', user);
    expect(initializedUser).toBeInstanceOf(UserModel);
    expect(initializedUser.lastName).toBeUndefined();
    expect(response.status).toBe(200);
    expect(response.data.lastName).toBe('default');
  });

  it('should override controller options with action transformRequest option', async () => {
    expect.assertions(4);
    const response = await axios.post('/transformRequestOnly', user);
    expect(initializedUser).toBeInstanceOf(UserModel);
    expect(initializedUser.lastName).toBeUndefined();
    expect(response.status).toBe(200);
    expect(response.data.lastName).toBe('default');
  });

  it('should override controller options with action transformResponse option', async () => {
    expect.assertions(4);
    const response = await axios.post('/transformResponseOnly', user);
    expect(initializedUser).not.toBeInstanceOf(UserModel);
    expect(initializedUser.lastName).not.toBeUndefined();
    expect(response.status).toBe(200);
    expect(response.data.lastName).toBeUndefined();
  });
});
