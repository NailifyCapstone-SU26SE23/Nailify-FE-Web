import { createSlice } from "@reduxjs/toolkit";

const layoutSlice = createSlice({
  name: "layout",
  initialState: {
    sidebarCollapsed: false,
    theme: "light",
  },
  reducers: {
    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = action.payload;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
  },
});

export const { setSidebarCollapsed, setTheme } = layoutSlice.actions;
export const layoutReducer = layoutSlice.reducer;
