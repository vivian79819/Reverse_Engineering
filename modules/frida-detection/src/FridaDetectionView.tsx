import { requireNativeView } from 'expo';
import * as React from 'react';

import { FridaDetectionViewProps } from './FridaDetection.types';

const NativeView: React.ComponentType<FridaDetectionViewProps> =
  requireNativeView('FridaDetection');

export default function FridaDetectionView(props: FridaDetectionViewProps) {
  return <NativeView {...props} />;
}
