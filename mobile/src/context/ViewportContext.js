import React, { createContext, useContext } from 'react';
import { Dimensions } from 'react-native';

const win = Dimensions.get('window');
const defaultViewport = { width: win.width, height: win.height, isFrameMode: false };

const ViewportContext = createContext(null);

/**
 * Returns the current viewport { width, height, isFrameMode }.
 * isFrameMode === true only when the app is displayed in a reduced view inside the frame.
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
