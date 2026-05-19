import * as React from 'react';

import { FridaDetectionViewProps } from './FridaDetection.types';

export default function FridaDetectionView(props: FridaDetectionViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
