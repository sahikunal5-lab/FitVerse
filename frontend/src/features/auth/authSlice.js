
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  status: "loading",
  recoveryActive: false,
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

    recoveryStarted(state) {
      state.recoveryActive = true;
    },

    recoveryFinished(state) {
      state.recoveryActive = false;
    },
  },
});

export const {
  authChanged,
  recoveryStarted,
  recoveryFinished,
} = authSlice.actions;

export const selectUser = (state) =>
  state.auth.user;

export const selectAuthStatus = (state) =>
  state.auth.status;

export const selectIsAuthenticated = (state) =>
  state.auth.status === "authenticated";

export const selectRecoveryActive = (state) =>
  state.auth.recoveryActive;

export default authSlice.reducer;
