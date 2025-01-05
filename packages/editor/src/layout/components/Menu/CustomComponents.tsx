import { useEffect, useState, useImperativeHandle, forwardRef, MutableRefObject } from 'react';
import { Empty, Flex, Button, Spin } from 'antd';
import { createId } from '@/utils/util';
import { usePageStore } from '@/stores/pageStore';
import { IDragTarget, ConfigType, ComponentMethodType, ComponentType } from '@/packages/types/index';
import { CusComItem } from '@/config/components';
import libApi from '@/api/libs';

/**
 * 自定义组件
 */
const ForwardCustomComponents = forwardRef<{ reload: () => void }>(function CustomComponents(props, ref) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<CusComItem[]>([]);
  const { selectedElement, elementsMap, addElement, addChildElements } = usePageStore((state) => {
    return {
      addElement: state.addElement,
      addChildElements: state.addChildElements,
      selectedElement: state.selectedElement,
      elementsMap: state.page.pageData.elementsMap,
    };
  });
  const reload = () => {
    setLoading(true);
    libApi.getLibInstallList().then((res) => {
      setLoading(false);
      setList(res);
    });
  };
  const handleClick = async (item: CusComItem) => {
    // 生成组件ID
    const newId = createId(item.tag);
    // 远程加载 configUrl，并获取其中的 config、events、methods、elements
    const {
      config,
      events = [],
      methods = [],
      elements = [],
    } = await import(/** vite-ignore */ item.configUrl).then(
      (module: any) => {
        return module.default as {
          config: ConfigType;
          methods: ComponentMethodType[];
          events?: Array<{ name: string; value: string }>;
          elements: ComponentType[];
        };
      },
      (error) => {
        console.error('加载远程模块出错:', error);
        throw Error;
      },
    );
    // todo，还未处理 elements 的情况
    addElement({
      id: newId,
      type: item.tag,
      name: item.name,
      remoteUrl: item.reactUrl,
      remoteCssUrl: item.cssUrl,
      remoteConfigUrl: item.configUrl,
      config,
      events,
      methods,
      elements,
    });
  };
  useImperativeHandle(ref, () => ({
    reload,
  }));
  useEffect(() => {
    reload();
  }, []);
  return (
    <>
      <Spin spinning={loading}>
        <div style={{ overflow: 'auto', height: 'calc(-200px + 100vh)' }}>
          {!loading && list.length > 0 && (
            <Flex wrap="wrap" gap={5} justify="space-between" style={{ marginTop: '10px' }}>
              {list.map((item) => {
                return (
                  <div style={{ width: '45%' }} key={item.id}>
                    <Button type="default" block onClick={handleClick.bind(null, item)}>
                      {item.name}
                    </Button>
                  </div>
                );
              })}
            </Flex>
          )}
          {!loading && list.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </div>
      </Spin>
    </>
  );
});

export default ForwardCustomComponents;
