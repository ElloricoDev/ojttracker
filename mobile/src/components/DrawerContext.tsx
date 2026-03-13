import { createContext, useContext } from 'react';

type DrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextValue>({
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function DrawerProvider({
  value,
  children,
}: {
  value: DrawerContextValue;
  children: React.ReactNode;
}) {
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  return useContext(DrawerContext);
}
