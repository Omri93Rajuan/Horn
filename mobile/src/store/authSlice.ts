import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  areaId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{user: User; token: string}>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      AsyncStorage.setItem('token', action.payload.token);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: state => {
      state.user = null;
      state.token = null;
      state.error = null;
      AsyncStorage.removeItem('token');
    },
    clearError: state => {
      state.error = null;
    },
  },
});

export const {setCredentials, setLoading, setError, logout, clearError} =
  authSlice.actions;

export default authSlice.reducer;
