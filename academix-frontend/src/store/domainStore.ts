import { create } from 'zustand';

interface Domain {
  id: string | number;
  name: string;
}

interface DomainStoreState {
  domains: Domain[];
  allowDomainIds: number[];
  setDomains: (domains: Domain[]) => void;
  setAllowDomainIds: (domainIds: number[]) => void;
  addAllowDomainId: (domainId: number) => void;
  removeAllowDomainId: (domainId: number) => void;
}

export const useDomainStore = create<DomainStoreState>((set) => ({
  domains: [],
  allowDomainIds: [],
  setDomains: (domains) => set({ domains }),
  setAllowDomainIds: (domainIds) => set({ allowDomainIds: domainIds }),
  addAllowDomainId: (domainId) => set((state) => ({
    allowDomainIds: [...state.allowDomainIds, domainId]
  })),
  removeAllowDomainId: (domainId) => set((state) => ({
    allowDomainIds: state.allowDomainIds.filter(id => id !== domainId)
  })),
}));