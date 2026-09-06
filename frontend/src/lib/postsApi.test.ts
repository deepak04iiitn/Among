/**
 * postsApi.test.ts — Unit tests for the posts API client.
 */
import { createPost, getPost, editPost, deletePost, getMyPosts } from './postsApi';
import { API } from '../constants/apiEndpoints';
import { POST_EXPERIENCE_STATE, POST_VISIBILITY } from '../constants/postStates';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./apiClient', () => ({
  apiClient: {
    post:   jest.fn(),
    get:    jest.fn(),
    put:    jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from './apiClient';

const mockClient = apiClient as jest.Mocked<typeof apiClient>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const POST_ID = 'post-abc-123';
const MOCK_POST = {
  id:              POST_ID,
  body:            'A shared experience longer than twenty chars.',
  categoryIds:     ['loneliness'],
  state:           POST_EXPERIENCE_STATE.CURRENT,
  visibilityScope: POST_VISIBILITY.BROAD,
  status:          'published',
  authorAlias:     'QuietRiver',
  authorAvatarSeed: 'seed-xyz',
  publishedAt:     new Date().toISOString(),
  editableUntil:   new Date(Date.now() + 900_000).toISOString(),
  editedAt:        null,
  reactionCounts:  { current: 0, past: 0, considering: 0, same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0 },
  isOwnPost:       true,
};

const CREATE_INPUT = {
  body:            'A shared experience longer than twenty chars.',
  categoryIds:     ['loneliness'],
  state:           POST_EXPERIENCE_STATE.CURRENT,
  visibilityScope: POST_VISIBILITY.BROAD,
};

// ─── createPost ───────────────────────────────────────────────────────────────

describe('createPost', () => {
  it('calls POST /api/posts with correct payload', async () => {
    mockClient.post.mockResolvedValue({
      data: { post: MOCK_POST, crisisDetected: false, crisisResources: null, safetyWarnings: [] },
    });

    const result = await createPost(CREATE_INPUT);

    expect(mockClient.post).toHaveBeenCalledWith(API.POSTS, CREATE_INPUT);
    expect(result.post.id).toBe(POST_ID);
    expect(result.crisisDetected).toBe(false);
  });

  it('returns crisisResources when crisis is detected', async () => {
    const resources = [{ type: 'self_harm', name: 'Crisis Line', phone: '988', description: 'Help' }];
    mockClient.post.mockResolvedValue({
      data: { post: MOCK_POST, crisisDetected: true, crisisResources: resources, safetyWarnings: [] },
    });

    const result = await createPost(CREATE_INPUT);

    expect(result.crisisDetected).toBe(true);
    expect(result.crisisResources).toHaveLength(1);
  });

  it('does not include authorAccountId in response', async () => {
    mockClient.post.mockResolvedValue({
      data: { post: MOCK_POST, crisisDetected: false, crisisResources: null, safetyWarnings: [] },
    });

    const result = await createPost(CREATE_INPUT);
    expect(result.post).not.toHaveProperty('authorAccountId');
  });
});

// ─── getPost ─────────────────────────────────────────────────────────────────

describe('getPost', () => {
  it('calls GET /api/posts/:id', async () => {
    mockClient.get.mockResolvedValue({ data: MOCK_POST });

    const result = await getPost(POST_ID);

    expect(mockClient.get).toHaveBeenCalledWith(API.POST(POST_ID));
    expect(result).toEqual(MOCK_POST);
  });

  it('returns deleted post info without throwing', async () => {
    mockClient.get.mockResolvedValue({ data: { status: 'deleted_by_user', redirectCategoryId: 'loneliness' } });

    const result = await getPost(POST_ID);
    expect(result).toHaveProperty('status', 'deleted_by_user');
  });
});

// ─── editPost ─────────────────────────────────────────────────────────────────

describe('editPost', () => {
  it('calls PUT /api/posts/:id with body', async () => {
    const updatedBody = 'Updated post body with more than twenty characters.';
    mockClient.put.mockResolvedValue({ data: { ...MOCK_POST, body: updatedBody } });

    const result = await editPost(POST_ID, updatedBody);

    expect(mockClient.put).toHaveBeenCalledWith(API.POST(POST_ID), { body: updatedBody });
    expect(result.body).toBe(updatedBody);
  });
});

// ─── deletePost ───────────────────────────────────────────────────────────────

describe('deletePost', () => {
  it('calls DELETE /api/posts/:id', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    await deletePost(POST_ID);

    expect(mockClient.delete).toHaveBeenCalledWith(API.POST(POST_ID));
  });
});

// ─── getMyPosts ───────────────────────────────────────────────────────────────

describe('getMyPosts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /api/posts/my without params when none given', async () => {
    mockClient.get.mockResolvedValue({ data: { posts: [MOCK_POST], nextCursor: null } });

    const result = await getMyPosts();

    expect(mockClient.get).toHaveBeenCalledWith(API.POSTS_MY, { params: {} });
    expect(result.posts).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });

  it('includes cursor in params when provided', async () => {
    mockClient.get.mockResolvedValue({ data: { posts: [], nextCursor: null } });

    await getMyPosts('cursor-abc', 10);

    const [, config] = (mockClient.get as jest.Mock).mock.calls[0];
    expect(config?.params?.cursor).toBe('cursor-abc');
    expect(config?.params?.limit).toBe('10');
  });
});
