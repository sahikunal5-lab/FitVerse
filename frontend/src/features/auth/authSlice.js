
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  status: "loading",
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    authChanged(state, action) {
      state.user = action.payload;

      state.status = action.payload
        ? "authenticated"
        : "unauthenticated";
    },
  },
});

export const { authChanged } = authSlice.actions;

export const selectUser = (state) => state.auth.user;

export const selectAuthStatus = (state) =>
  state.auth.status;

export const selectIsAuthenticated = (state) =>
  state.auth.status === "authenticated";

export default authSlice.reducer;
