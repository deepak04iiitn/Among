import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import identityReducer from '../features/identity/identitySlice';
import postsReducer from '../features/posts/postsSlice';
import reactionsReducer from '../features/reactions/reactionsSlice';
import discoveryReducer from '../features/discovery/discoverySlice';
import conversationsReducer from '../features/conversations/conversationsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import featureFlagsReducer from '../features/featureFlags/featureFlagsSlice';

/**
 * Root reducer — combines all feature slice reducers.
 * Slice names here MUST match the keys used in selector paths (e.g. state.auth).
 */
export const rootReducer = combineReducers({
  auth:          authReducer,
  identity:      identityReducer,
  posts:         postsReducer,
  reactions:     reactionsReducer,
  discovery:     discoveryReducer,
  conversations: conversationsReducer,
  notifications: notificationsReducer,
  featureFlags:  featureFlagsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
