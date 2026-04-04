import React, { createContext, useContext } from 'react';
import { Dimensions } from 'react-native';

const win = Dimensions.get('window');
const defaultViewport = { width: win.width, height: win.height, isFrameMode: false };

const ViewportContext = createContext(null);

/**
 * Возвращает текущий viewport { width, height, isFrameMode }.
 * isFrameMode === true только когда приложение отображается в уменьшенном виде внутри рамки.
 */
export function useViewport() {
  const viewport = useContext(ViewportContext);
  return viewport ?? defaultViewport;
}

export function ViewportProvider({ value, children }) {
  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  );
}
