import { useSharedValue, useAnimatedScrollHandler, withTiming } from 'react-native-reanimated';
import { useNav } from '@/context/nav-context';

const HIDE_DELTA = 10;
const SHOW_DELTA = 10;
const HIDE_OFFSET = 100;
const DURATION = 220;

export function useScrollNav() {
  const { bottomNavY } = useNav();
  const lastY = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll(event) {
      'worklet';
      const y = event.contentOffset.y;
      const contentH = event.contentSize.height;
      const layoutH = event.layoutMeasurement.height;
      const nearBottom = y + layoutH >= contentH - 32;

      if (nearBottom) {
        bottomNavY.value = withTiming(0, { duration: DURATION });
      } else if (y > lastY.value + HIDE_DELTA && y > 0) {
        bottomNavY.value = withTiming(HIDE_OFFSET, { duration: DURATION });
      } else if (y < lastY.value - SHOW_DELTA) {
        bottomNavY.value = withTiming(0, { duration: DURATION });
      }
      lastY.value = y;
    },
  });
}
