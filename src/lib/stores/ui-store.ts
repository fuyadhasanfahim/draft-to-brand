import { create } from 'zustand';

type UIState = {
    /** Mobile sidebar visibility (desktop sidebar is always shown). */
    sidebarOpen: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;

    /** True while the blog editor has unsaved changes — powers the leave warning. */
    editorDirty: boolean;
    setEditorDirty: (dirty: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: false,
    openSidebar: () => set({ sidebarOpen: true }),
    closeSidebar: () => set({ sidebarOpen: false }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    editorDirty: false,
    setEditorDirty: (editorDirty) => set({ editorDirty }),
}));
