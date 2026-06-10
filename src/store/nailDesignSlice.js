import { createSlice } from "@reduxjs/toolkit";

const nailDesignSlice = createSlice({
  name: "nailDesign",
  initialState: {
    draftId: null,
  },
  reducers: {
    clearDraft(state) {
      state.draftId = null;
    },
    setDraftId(state, action) {
      state.draftId = action.payload;
    },
  },
});

export const { clearDraft, setDraftId } = nailDesignSlice.actions;
export const nailDesignReducer = nailDesignSlice.reducer;
