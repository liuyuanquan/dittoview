import request from '@/utils/request';
export default {
  // 获取自定义组件列表
  getLibInstallList() {
    return request.post('/libs/install/list');
  },
};
